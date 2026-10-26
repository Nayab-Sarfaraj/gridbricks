from dataclasses import dataclass
from typing import Optional

import numpy as np
import pandas as pd

from app.services.forecast_service import EvaluationData, ForecastService


@dataclass
class MetricsResult:
    mae: float
    rmse: float
    bias: float
    suggestedBufferP95: float
    suggestedBufferP90: float
    debiasedBufferP95: float
    maePercent: float
    totalSlots: int
    usedSlots: int
    droppedSlots: int
    droppedByReason: dict[str, int]


class MetricsService:
    """
    Computes headline forecast accuracy metrics and shortfall buffer sizing
    according to locked project rules:
    - error = actual - forecast (negative = over-forecast / buyer risk)
    - Suggested buffer (headline) = -5th percentile of error (P95 shortfall)
    - Secondary buffer = -10th percentile of error (P90 shortfall)
    - debiasedBufferP95 = -5th percentile of (error - bias)
    - Shortfall buffers floor at 0.0 if there is no shortfall
    - MAE as % of mean actual output
    - No MAPE
    """

    def __init__(self, forecast_service: Optional[ForecastService] = None) -> None:
        self.forecast_service = forecast_service or ForecastService()

    @staticmethod
    def compute_from_errors(
        errors: np.ndarray | pd.Series,
        actuals: np.ndarray | pd.Series,
        total_slots: int,
        used_slots: int,
        dropped_by_reason: dict[str, int],
    ) -> MetricsResult:
        """Calculate metrics directly from error and actual vectors."""
        err_arr = np.asarray(errors, dtype=float)
        act_arr = np.asarray(actuals, dtype=float)

        # Filter NaNs if any
        valid_mask = ~np.isnan(err_arr) & ~np.isnan(act_arr)
        err = err_arr[valid_mask]
        act = act_arr[valid_mask]

        if len(err) == 0:
            return MetricsResult(
                mae=0.0,
                rmse=0.0,
                bias=0.0,
                suggestedBufferP95=0.0,
                suggestedBufferP90=0.0,
                debiasedBufferP95=0.0,
                maePercent=0.0,
                totalSlots=total_slots,
                usedSlots=0,
                droppedSlots=total_slots,
                droppedByReason=dropped_by_reason,
            )

        mae = float(np.mean(np.abs(err)))
        rmse = float(np.sqrt(np.mean(err**2)))
        bias = float(np.mean(err))

        # Shortfall percentiles: 5th percentile is the 95% worst shortfall (most negative error)
        p05 = float(np.percentile(err, 5))
        p10 = float(np.percentile(err, 10))

        # Suggested buffer shown as positive MW number: -(percentile)
        # Floor at 0.0 if the percentile was positive (no shortfall)
        suggested_buffer_p95 = max(0.0, -p05)
        suggested_buffer_p90 = max(0.0, -p10)

        # Debiased buffer: removes systemic bias from the shortfall distribution
        debiased_err = err - bias
        debiased_p05 = float(np.percentile(debiased_err, 5))
        debiased_buffer_p95 = max(0.0, -debiased_p05)

        mean_actual = float(np.mean(act))
        mae_percent = float((mae / mean_actual * 100.0) if mean_actual > 0 else 0.0)

        dropped_slots = total_slots - used_slots

        return MetricsResult(
            mae=round(mae, 2),
            rmse=round(rmse, 2),
            bias=round(bias, 2),
            suggestedBufferP95=round(suggested_buffer_p95, 2),
            suggestedBufferP90=round(suggested_buffer_p90, 2),
            debiasedBufferP95=round(debiased_buffer_p95, 2),
            maePercent=round(mae_percent, 2),
            totalSlots=total_slots,
            usedSlots=used_slots,
            droppedSlots=dropped_slots,
            droppedByReason=dropped_by_reason,
        )

    def get_headline_metrics(
        self,
        eval_data: Optional[EvaluationData] = None,
    ) -> MetricsResult:
        """Compute headline metrics across the delivery window."""
        data = eval_data or self.forecast_service.get_evaluation_data()
        df = data.df

        used_df = df[df["error"].notna() & df["actual"].notna()]
        return self.compute_from_errors(
            errors=used_df["error"].to_numpy(),
            actuals=used_df["actual"].to_numpy(),
            total_slots=data.total_slots,
            used_slots=data.used_slots,
            dropped_by_reason=data.dropped_by_reason,
        )
