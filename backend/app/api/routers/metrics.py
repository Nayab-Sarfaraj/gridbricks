from fastapi import APIRouter, Depends

from app.api.deps import get_metrics_service
from app.schemas.metrics import MetricsResponse
from app.services.metrics_service import MetricsService

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("", response_model=MetricsResponse)
def get_metrics(
    metrics_service: MetricsService = Depends(get_metrics_service),
) -> MetricsResponse:
    """
    Returns headline quantitative forecast accuracy metrics across January 2026:
    MAE, RMSE, Bias, P95 and P90 shortfall buffers, debiased buffer, and slot counts.
    """
    res = metrics_service.get_headline_metrics()
    return MetricsResponse(
        mae=res.mae,
        rmse=res.rmse,
        bias=res.bias,
        suggestedBufferP95=res.suggestedBufferP95,
        suggestedBufferP90=res.suggestedBufferP90,
        debiasedBufferP95=res.debiasedBufferP95,
        maePercent=res.maePercent,
        totalSlots=res.totalSlots,
        usedSlots=res.usedSlots,
        droppedSlots=res.droppedSlots,
        droppedByReason=res.droppedByReason,
    )
