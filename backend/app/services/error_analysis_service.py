from dataclasses import dataclass
from typing import Optional

import numpy as np

from app.core.config import settings
from app.core.time_utils import to_uk_time
from app.data.repository import DataRepository, default_repository
from app.services.forecast_service import EvaluationData, ForecastService


@dataclass
class HorizonBucketItem:
    bucket: str
    mae: float
    bias: float
    p95Shortfall: float
    count: int


@dataclass
class HourOfDayItem:
    hour: int
    mae: float
    bias: float
    p95Shortfall: float
    count: int


@dataclass
class DailyErrorItem:
    date: str  # YYYY-MM-DD
    mae: float
    bias: float
    p95Shortfall: float
    count: int


@dataclass
class ErrorAnalysisResult:
    byHorizon: list[HorizonBucketItem]
    byHourOfDay: list[HourOfDayItem]
    dailySeries: list[DailyErrorItem]


class ErrorAnalysisService:
    """
    Computes forecast error breakdowns:
    1. By forecast horizon: uses ALL forecasts per target half-hour,
       measuring how accuracy evolves as lead time decreases.
    2. By hour of day (UK time): uses the day-ahead cutoff forecast,
       showing intraday error patterns across 00:00 to 23:00.
    3. Daily error time series across January 2026.

    Note on p95Shortfall: consistently defined across all breakdowns as
    the 95th percentile shortfall = max(0.0, -5th percentile of error),
    representing the positive MW buffer required for that bucket/hour/day.
    """

    def __init__(
        self,
        repository: Optional[DataRepository] = None,
        forecast_service: Optional[ForecastService] = None,
    ) -> None:
        self.repo = repository or default_repository
        self.forecast_service = forecast_service or ForecastService(repository=self.repo)

    @staticmethod
    def assign_horizon_bucket(horizon_hours: float) -> Optional[str]:
        """
        Assign lead time horizon (in hours) to standard buckets:
        - 0 <= h < 6   -> '0-6h'
        - 6 <= h < 12  -> '6-12h'
        - 12 <= h < 24 -> '12-24h'
        - 24 <= h < 48 -> '24-48h'
        - h >= 48      -> '48h+'
        Returns None if horizon_hours < 0 (post-outturn).
        """
        if horizon_hours < 0:
            return None

        for min_edge, max_edge, label in settings.horizon_bucket_edges:
            if min_edge <= horizon_hours < max_edge:
                return label

        # Fallback for upper bound inclusive or beyond
        return settings.horizon_bucket_edges[-1][2]

    def compute_by_horizon(self) -> list[HorizonBucketItem]:
        """
        Analyze all forecasts in the delivery window grouped by lead time horizon bucket.
        """
        forecasts = self.repo.get_forecasts().copy()
        actuals = self.repo.get_actuals(delivery_window_only=True).copy()

        # Join forecasts with actuals on startTime
        merged = forecasts.merge(
            actuals.rename(columns={"generation": "actual"}),
            on="startTime",
            how="inner",
        )

        merged["horizon_hours"] = (
            merged["startTime"] - merged["publishTime"]
        ).dt.total_seconds() / 3600.0

        # Filter out negative lead times
        valid = merged[merged["horizon_hours"] >= 0].copy()
        valid["bucket"] = valid["horizon_hours"].apply(self.assign_horizon_bucket)
        valid["error"] = valid["actual"] - valid["generation"]

        results: list[HorizonBucketItem] = []
        for _, _, label in settings.horizon_bucket_edges:
            grp = valid[valid["bucket"] == label]
            if len(grp) == 0:
                results.append(
                    HorizonBucketItem(
                        bucket=label,
                        mae=0.0,
                        bias=0.0,
                        p95Shortfall=0.0,
                        count=0,
                    )
                )
                continue

            errors = grp["error"].to_numpy()
            p05 = float(np.percentile(errors, 5))
            results.append(
                HorizonBucketItem(
                    bucket=label,
                    mae=round(float(np.mean(np.abs(errors))), 2),
                    bias=round(float(np.mean(errors)), 2),
                    p95Shortfall=round(max(0.0, -p05), 2),
                    count=len(grp),
                )
            )

        return results

    def compute_by_hour_of_day(
        self,
        eval_data: Optional[EvaluationData] = None,
    ) -> list[HourOfDayItem]:
        """
        Group day-ahead cutoff forecasts by UK-time hour of day (0..23).
        """
        data = eval_data or self.forecast_service.get_evaluation_data()
        df = data.df[data.df["error"].notna()].copy()

        df["uk_hour"] = df["startTime"].apply(lambda dt: to_uk_time(dt).hour)

        results: list[HourOfDayItem] = []
        for hour in range(24):
            grp = df[df["uk_hour"] == hour]
            if len(grp) == 0:
                results.append(
                    HourOfDayItem(
                        hour=hour,
                        mae=0.0,
                        bias=0.0,
                        p95Shortfall=0.0,
                        count=0,
                    )
                )
                continue

            errors = grp["error"].to_numpy()
            p05 = float(np.percentile(errors, 5))
            results.append(
                HourOfDayItem(
                    hour=hour,
                    mae=round(float(np.mean(np.abs(errors))), 2),
                    bias=round(float(np.mean(errors)), 2),
                    p95Shortfall=round(max(0.0, -p05), 2),
                    count=len(grp),
                )
            )

        return results

    def compute_daily_series(
        self,
        eval_data: Optional[EvaluationData] = None,
    ) -> list[DailyErrorItem]:
        """
        Compute daily MAE and Bias series across each delivery day in the period.
        """
        data = eval_data or self.forecast_service.get_evaluation_data()
        df = data.df[data.df["error"].notna()].copy()

        results: list[DailyErrorItem] = []
        for dt_val, grp in df.groupby("deliveryDate", sort=True):
            errors = grp["error"].to_numpy()
            p05 = float(np.percentile(errors, 5))
            results.append(
                DailyErrorItem(
                    date=dt_val.isoformat(),
                    mae=round(float(np.mean(np.abs(errors))), 2),
                    bias=round(float(np.mean(errors)), 2),
                    p95Shortfall=round(max(0.0, -p05), 2),
                    count=len(grp),
                )
            )

        return results

    def get_breakdowns(
        self,
        eval_data: Optional[EvaluationData] = None,
    ) -> ErrorAnalysisResult:
        """Get complete breakdown payload."""
        return ErrorAnalysisResult(
            byHorizon=self.compute_by_horizon(),
            byHourOfDay=self.compute_by_hour_of_day(eval_data=eval_data),
            dailySeries=self.compute_daily_series(eval_data=eval_data),
        )
