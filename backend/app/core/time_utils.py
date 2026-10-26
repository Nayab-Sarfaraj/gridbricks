from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.core.config import settings

UTC = timezone.utc


def get_uk_tz() -> ZoneInfo:
    return settings.tz


def to_utc(dt: datetime) -> datetime:
    """Ensure datetime is timezone-aware in UTC."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def to_uk_time(dt: datetime) -> datetime:
    """Convert datetime to UK time (Europe/London)."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(get_uk_tz())


def compute_cutoff_timestamp(
    delivery_date: date,
    cutoff_hour: int | None = None,
    cutoff_minute: int | None = None,
) -> datetime:
    """
    Compute the decision cutoff timestamp for a delivery date D.
    Cutoff is at 09:00 UK time on D-1, returned as timezone-aware UTC datetime.
    """
    hour = cutoff_hour if cutoff_hour is not None else settings.cutoff_hour
    minute = cutoff_minute if cutoff_minute is not None else settings.cutoff_minute

    decision_date = delivery_date - timedelta(days=1)
    cutoff_local = datetime.combine(
        decision_date,
        time(hour=hour, minute=minute),
        tzinfo=get_uk_tz(),
    )
    return cutoff_local.astimezone(UTC)


def get_uk_delivery_date(dt: datetime) -> date:
    """Return the delivery date (in UK calendar time) for a target half-hour timestamp."""
    return to_uk_time(dt).date()
