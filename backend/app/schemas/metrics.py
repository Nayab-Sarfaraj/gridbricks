from pydantic import BaseModel, Field


class MetricsResponse(BaseModel):
    mae: float = Field(..., description="Mean Absolute Error in MW")
    rmse: float = Field(..., description="Root Mean Squared Error in MW")
    bias: float = Field(..., description="Mean error (actual - forecast) in MW")
    suggestedBufferP95: float = Field(
        ...,
        description="Suggested buffer (headline) = P95 shortfall = -(5th percentile error) in MW",
    )
    suggestedBufferP90: float = Field(
        ...,
        description="Secondary buffer = P90 shortfall = -(10th percentile of error) in MW",
    )
    debiasedBufferP95: float = Field(
        ...,
        description="P95 safety buffer after correcting for systemic bias in MW",
    )
    maePercent: float = Field(..., description="MAE as a percentage of mean actual generation")
    totalSlots: int = Field(..., description="Total half-hour slots in the delivery period")
    usedSlots: int = Field(
        ...,
        description="Number of slots evaluated with valid forecast and actual",
    )
    droppedSlots: int = Field(..., description="Number of dropped slots")
    droppedByReason: dict[str, int] = Field(
        default_factory=dict,
        description="Dropped slot counts categorized by reason",
    )
