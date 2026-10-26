from pydantic import BaseModel, Field


class HorizonBreakdownItem(BaseModel):
    bucket: str = Field(..., description="Lead time horizon bucket (e.g. '0-6h', '6-12h')")
    mae: float = Field(..., description="Mean Absolute Error in MW")
    bias: float = Field(..., description="Mean error (actual - forecast) in MW")
    p95Shortfall: float = Field(
        ...,
        description="P95 shortfall buffer (-(5th percentile of error)) in MW",
    )
    count: int = Field(..., description="Number of forecasts evaluated in this bucket")


class HourOfDayBreakdownItem(BaseModel):
    hour: int = Field(..., description="Delivery hour of day in UK local time (0..23)")
    mae: float = Field(..., description="Mean Absolute Error in MW")
    bias: float = Field(..., description="Mean error (actual - forecast) in MW")
    p95Shortfall: float = Field(
        ...,
        description="P95 shortfall buffer (-(5th percentile of error)) in MW",
    )
    count: int = Field(..., description="Number of slots evaluated for this hour")


class DailyErrorBreakdownItem(BaseModel):
    date: str = Field(..., description="Delivery date (YYYY-MM-DD)")
    mae: float = Field(..., description="Mean Absolute Error in MW")
    bias: float = Field(..., description="Mean error (actual - forecast) in MW")
    p95Shortfall: float = Field(
        ...,
        description="P95 shortfall buffer (-(5th percentile of error)) in MW",
    )
    count: int = Field(..., description="Number of evaluated slots in this day")


class ErrorsResponse(BaseModel):
    byHorizon: list[HorizonBreakdownItem] = Field(
        ...,
        description="Forecast accuracy by lead time horizon bucket (evaluates all forecasts)",
    )
    byHourOfDay: list[HourOfDayBreakdownItem] = Field(
        ...,
        description="Forecast accuracy by UK delivery hour of day (using cutoff forecast)",
    )
    dailySeries: list[DailyErrorBreakdownItem] = Field(
        default_factory=list,
        description="Daily forecast accuracy trend across the evaluation period",
    )
