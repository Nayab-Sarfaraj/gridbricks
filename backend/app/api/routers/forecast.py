from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_forecast_service, get_metrics_service
from app.core.config import settings
from app.schemas.forecast import ForecastPointSchema, ForecastResponse
from app.services.forecast_service import ForecastService
from app.services.metrics_service import MetricsService

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("", response_model=ForecastResponse)
def get_forecast(
    delivery_date_str: str = Query(
        ...,
        alias="date",
        description="Target delivery day in YYYY-MM-DD format (within Jan 2 to Feb 1, 2026)",
        examples=["2026-01-15"],
    ),
    forecast_service: ForecastService = Depends(get_forecast_service),
    metrics_service: MetricsService = Depends(get_metrics_service),
) -> ForecastResponse:
    """
    Returns 48 half-hour points of forecast vs actual for a delivery day,
    using the latest forecast published at or before the 09:00 UK D-1 cutoff.
    """
    try:
        delivery_date = date.fromisoformat(delivery_date_str)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format '{delivery_date_str}'. Expected YYYY-MM-DD.",
        ) from e

    min_date = date.fromisoformat(settings.delivery_window_start)
    max_date = date.fromisoformat(settings.delivery_window_end)
    if delivery_date < min_date or delivery_date > max_date:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Date {delivery_date_str} is outside the evaluated delivery window "
                f"({settings.delivery_window_start} to {settings.delivery_window_end})."
            ),
        )

    day_summary = forecast_service.get_day_forecast(delivery_date)
    headline_metrics = metrics_service.get_headline_metrics()

    points = [
        ForecastPointSchema(
            startTime=pt.startTime,
            forecast=pt.forecast,
            actual=pt.actual,
            error=pt.error,
            publishTime=pt.publishTime,
            missingReason=pt.missing_reason,
        )
        for pt in day_summary.points
    ]

    return ForecastResponse(
        deliveryDate=day_summary.delivery_date,
        cutoff=day_summary.cutoff_time,
        points=points,
        forecastTotalMwh=day_summary.forecast_total_mwh,
        forecastAvgMw=day_summary.forecast_avg_mw,
        suggestedBufferP95=headline_metrics.suggestedBufferP95,
        debiasedBufferP95=headline_metrics.debiasedBufferP95,
        missingSlots=day_summary.missing_slots,
        totalSlots=day_summary.total_slots,
        droppedByReason=day_summary.dropped_by_reason,
    )
