from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import pandas as pd

from app.core.config import settings
from app.core.time_utils import (
    compute_cutoff_timestamp,
    get_uk_tz,
)
from app.data.repository import DataRepository, default_repository


@dataclass
class EvaluationData:
    """Complete aligned forecast vs actual evaluation data and slot accounting."""

    df: pd.DataFrame
    total_slots: int
    used_slots: int
    dropped_by_reason: dict[str, int]


@dataclass
class DayForecastPoint:
    startTime: str  # ISO 8601 UTC string
    forecast: Optional[float]
    actual: Optional[float]
    error: Optional[float]
    publishTime: Optional[str]
    missing_reason: Optional[str]


@dataclass
class DayForecastSummary:
    delivery_date: str
    cutoff_time: str
    points: list[DayForecastPoint]
    total_slots: int
    used_slots: int
    missing_slots: int
    forecast_total_mwh: float
    forecast_avg_mw: float
    dropped_by_reason: dict[str, int]


class ForecastService:
    """
    Core domain service for day-ahead forecast selection and error calculation.
    Enforces cutoff rules:
    - Cutoff is 09:00 UK time on D-1.
    - Pick the latest forecast published at or before cutoff.
    - Compute error = actual - forecast.
    """

    def __init__(
        self,
        repository: Optional[DataRepository] = None,
        map_hourly_forecast: Optional[bool] = None,
    ) -> None:
        self.repo = repository or default_repository
        self.map_hourly_forecast = (
            map_hourly_forecast
            if map_hourly_forecast is not None
            else settings.map_hourly_forecast_to_half_hours
        )

    def generate_expected_slots(self, start_date: date, end_date: date) -> pd.DataFrame:
        """
        Generate all expected 48 half-hour slots per day (in UK calendar time)
        from start_date to end_date inclusive.
        """
        slots = []
        uk_tz = get_uk_tz()
        current_date = start_date

        while current_date <= end_date:
            cutoff = compute_cutoff_timestamp(current_date)
            # 48 half-hours per day: 00:00 to 23:30 in UK time
            for half_hour_idx in range(48):
                hour = half_hour_idx // 2
                minute = 30 if (half_hour_idx % 2 == 1) else 0
                local_dt = datetime(
                    current_date.year,
                    current_date.month,
                    current_date.day,
                    hour,
                    minute,
                    0,
                    tzinfo=uk_tz,
                )
                utc_dt = local_dt.astimezone(timezone.utc)
                slots.append(
                    {
                        "startTime": utc_dt,
                        "deliveryDate": current_date,
                        "cutoff": cutoff,
                    }
                )
            current_date += timedelta(days=1)

        return pd.DataFrame(slots)

    def get_evaluation_data(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> EvaluationData:
        """
        Evaluate all half-hour slots within the given window (defaulting to
        configured Jan 2 to Feb 1 delivery window).
        """
        s_date = start_date or date.fromisoformat(settings.delivery_window_start)
        e_date = end_date or date.fromisoformat(settings.delivery_window_end)

        # 1. Expected slot grid
        grid_df = self.generate_expected_slots(s_date, e_date)
        if self.map_hourly_forecast:
            grid_df["match_key"] = grid_df["startTime"].dt.floor("h")
        else:
            grid_df["match_key"] = grid_df["startTime"]

        # 2. Raw forecasts
        forecasts_df = self.repo.get_forecasts().copy()

        # Merge grid cutoff to candidate forecasts by match_key
        # Filter forecasts published at or before cutoff
        cutoff_lookup = grid_df[["match_key", "cutoff"]].drop_duplicates(subset=["match_key"])
        merged_fc = forecasts_df.merge(
            cutoff_lookup,
            left_on="startTime",
            right_on="match_key",
            how="inner",
        )
        valid_fc = merged_fc[merged_fc["publishTime"] <= merged_fc["cutoff"]]

        # Pick forecast with the latest publishTime at or before cutoff
        latest_fc = (
            valid_fc.sort_values(["startTime", "publishTime"])
            .groupby("startTime")
            .last()
            .reset_index()[["startTime", "publishTime", "generation"]]
            .rename(columns={"generation": "forecast", "startTime": "fc_startTime"})
        )

        # 3. Raw actuals
        actuals_df = self.repo.get_actuals(delivery_window_only=False).copy()
        actuals_clean = actuals_df.rename(columns={"generation": "actual"})

        # 4. Join grid -> cutoff forecasts -> actuals
        eval_df = grid_df.merge(
            latest_fc,
            left_on="match_key",
            right_on="fc_startTime",
            how="left",
        )
        eval_df = eval_df.merge(actuals_clean[["startTime", "actual"]], on="startTime", how="left")

        # 5. Compute missing reason and error
        all_forecast_times = set(forecasts_df["startTime"].dropna())
        missing_reasons = []
        errors = []

        for _, row in eval_df.iterrows():
            fc = row["forecast"]
            act = row["actual"]
            match_key = row["match_key"]

            if pd.isna(fc):
                if match_key not in all_forecast_times:
                    missing_reasons.append("no_forecast_published")
                else:
                    missing_reasons.append("no_forecast_before_cutoff")
                errors.append(None)
            elif pd.isna(act):
                missing_reasons.append("missing_actual")
                errors.append(None)
            else:
                missing_reasons.append(None)
                # Locked decision: error = actual - forecast
                errors.append(float(act) - float(fc))

        eval_df["missing_reason"] = missing_reasons
        eval_df["error"] = errors

        # 6. Accounting
        total_slots = len(eval_df)
        used_mask = eval_df["error"].notna()
        used_slots = int(used_mask.sum())

        dropped_df = eval_df[~used_mask]
        reasons_series = dropped_df["missing_reason"].value_counts()
        dropped_by_reason = {
            "no_forecast_published": int(reasons_series.get("no_forecast_published", 0)),
            "no_forecast_before_cutoff": int(reasons_series.get("no_forecast_before_cutoff", 0)),
            "missing_actual": int(reasons_series.get("missing_actual", 0)),
        }

        return EvaluationData(
            df=eval_df,
            total_slots=total_slots,
            used_slots=used_slots,
            dropped_by_reason=dropped_by_reason,
        )

    def get_day_forecast(self, delivery_date: date) -> DayForecastSummary:
        """
        Get 48-slot forecast vs actual data for a single delivery day.
        """
        eval_data = self.get_evaluation_data(start_date=delivery_date, end_date=delivery_date)
        df = eval_data.df.sort_values("startTime").reset_index(drop=True)

        cutoff_ts = compute_cutoff_timestamp(delivery_date)
        cutoff_str = cutoff_ts.isoformat()

        points: list[DayForecastPoint] = []
        forecast_values: list[float] = []

        for _, row in df.iterrows():
            st_iso = row["startTime"].isoformat()
            pub_iso = row["publishTime"].isoformat() if pd.notna(row["publishTime"]) else None
            fc = float(row["forecast"]) if pd.notna(row["forecast"]) else None
            act = float(row["actual"]) if pd.notna(row["actual"]) else None
            err = float(row["error"]) if pd.notna(row["error"]) else None
            reason = str(row["missing_reason"]) if pd.notna(row["missing_reason"]) else None

            if fc is not None:
                forecast_values.append(fc)

            points.append(
                DayForecastPoint(
                    startTime=st_iso,
                    forecast=fc,
                    actual=act,
                    error=err,
                    publishTime=pub_iso,
                    missing_reason=reason,
                )
            )

        # Total energy in MWh: each slot is MW * 0.5 hours (valid even if slots are missing)
        total_mwh = sum(fc * 0.5 for fc in forecast_values)
        avg_mw = float(sum(forecast_values) / len(forecast_values)) if forecast_values else 0.0

        missing_slots = eval_data.total_slots - eval_data.used_slots

        return DayForecastSummary(
            delivery_date=delivery_date.isoformat(),
            cutoff_time=cutoff_str,
            points=points,
            total_slots=eval_data.total_slots,
            used_slots=eval_data.used_slots,
            missing_slots=missing_slots,
            forecast_total_mwh=round(total_mwh, 2),
            forecast_avg_mw=round(avg_mw, 2),
            dropped_by_reason=eval_data.dropped_by_reason,
        )
