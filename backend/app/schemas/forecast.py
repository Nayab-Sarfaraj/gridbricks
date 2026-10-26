from typing import Optional

from pydantic import BaseModel, Field


class ForecastPointSchema(BaseModel):
    startTime: str = Field(..., description="Target half-hour start time in ISO 8601 UTC")
    forecast: Optional[float] = Field(None, description="Day-ahead forecast in MW")
    actual: Optional[float] = Field(None, description="Actual generation outturn in MW")
    error: Optional[float] = Field(
        None,
        description="Forecast error = actual - forecast in MW. Negative = over-forecast",
    )
    publishTime: Optional[str] = Field(
        None,
        description="Publication timestamp of the selected forecast in ISO 8601 UTC",
    )
    missingReason: Optional[str] = Field(
        None,
        description=(
            "Reason if slot is dropped: 'no_forecast_published', "
            "'no_forecast_before_cutoff', or 'missing_actual'"
        ),
    )


class ForecastResponse(BaseModel):
    deliveryDate: str = Field(..., description="Target delivery date (YYYY-MM-DD)")
    cutoff: str = Field(..., description="Cutoff timestamp used (ISO 8601 UTC)")
    points: list[ForecastPointSchema] = Field(
        ...,
        description="48 half-hour forecast points across the delivery day",
    )
    forecastTotalMwh: float = Field(
        ...,
        description="Total forecasted wind energy for the delivery day in MWh (sum(MW) * 0.5h)",
    )
    forecastAvgMw: float = Field(
        ...,
        description="Average forecasted wind power for the delivery day in MW",
    )
    suggestedBufferP95: float = Field(
        ...,
        description="Suggested P95 safety buffer in MW to cover forecast shortfall risk",
    )
    debiasedBufferP95: float = Field(
        ...,
        description="P95 safety buffer after correcting for systemic bias in MW",
    )
    missingSlots: int = Field(..., description="Number of dropped/missing slots in the day")
    totalSlots: int = Field(48, description="Expected slots for the day (48)")
    droppedByReason: dict[str, int] = Field(
        default_factory=dict,
        description="Breakdown of missing slots by reason",
    )
