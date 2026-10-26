from functools import lru_cache

from app.data.repository import DataRepository, default_repository
from app.services.error_analysis_service import ErrorAnalysisService
from app.services.forecast_service import ForecastService
from app.services.metrics_service import MetricsService


@lru_cache
def get_repository() -> DataRepository:
    """Return singleton DataRepository instance."""
    return default_repository


@lru_cache
def get_forecast_service() -> ForecastService:
    """Return singleton ForecastService instance."""
    return ForecastService(repository=get_repository())


@lru_cache
def get_metrics_service() -> MetricsService:
    """Return singleton MetricsService instance."""
    return MetricsService(forecast_service=get_forecast_service())


@lru_cache
def get_error_analysis_service() -> ErrorAnalysisService:
    """Return singleton ErrorAnalysisService instance."""
    return ErrorAnalysisService(
        repository=get_repository(),
        forecast_service=get_forecast_service(),
    )
