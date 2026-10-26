from fastapi import APIRouter, Depends

from app.api.deps import get_error_analysis_service
from app.schemas.errors import (
    DailyErrorBreakdownItem,
    ErrorsResponse,
    HorizonBreakdownItem,
    HourOfDayBreakdownItem,
)
from app.services.error_analysis_service import ErrorAnalysisService

router = APIRouter(prefix="/errors", tags=["Errors"])


@router.get("", response_model=ErrorsResponse)
def get_errors(
    error_service: ErrorAnalysisService = Depends(get_error_analysis_service),
) -> ErrorsResponse:
    """
    Returns breakdown of errors:
    1. By forecast horizon bucket (0-6h, 6-12h, 12-24h, 24-48h, 48h+) across all forecasts.
    2. By hour of day (0..23 UK time) using the cutoff forecast.
    3. Daily error trend across the period.
    """
    res = error_service.get_breakdowns()

    return ErrorsResponse(
        byHorizon=[
            HorizonBreakdownItem(
                bucket=h.bucket,
                mae=h.mae,
                bias=h.bias,
                p95Shortfall=h.p95Shortfall,
                count=h.count,
            )
            for h in res.byHorizon
        ],
        byHourOfDay=[
            HourOfDayBreakdownItem(
                hour=h.hour,
                mae=h.mae,
                bias=h.bias,
                p95Shortfall=h.p95Shortfall,
                count=h.count,
            )
            for h in res.byHourOfDay
        ],
        dailySeries=[
            DailyErrorBreakdownItem(
                date=d.date,
                mae=d.mae,
                bias=d.bias,
                p95Shortfall=d.p95Shortfall,
                count=d.count,
            )
            for d in res.dailySeries
        ],
    )
