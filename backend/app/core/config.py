import os
from pathlib import Path
from zoneinfo import ZoneInfo

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="GRIDBRICKS_",
        env_file=".env",
        extra="ignore",
    )

    # Cutoff configuration: 09:00 UK time on D-1
    cutoff_hour: int = 9
    cutoff_minute: int = 0
    timezone: str = "Europe/London"

    # Delivery date window: Jan 2, 2026 to Feb 1, 2026 (for decisions made Jan 1-31)
    delivery_window_start: str = "2026-01-02"
    delivery_window_end: str = "2026-02-01"

    # Fetch buffer window for script
    fetch_start_date: str = "2025-12-28"
    fetch_end_date: str = "2026-02-03"

    # Horizon bucket definitions in hours: (min_exclusive, max_inclusive, label)
    # Buckets: 0-6h, 6-12h, 12-24h, 24-48h, 48h+
    horizon_bucket_edges: list[tuple[float, float, str]] = [
        (0.0, 6.0, "0-6h"),
        (6.0, 12.0, "6-12h"),
        (12.0, 24.0, "12-24h"),
        (24.0, 48.0, "24-48h"),
        (48.0, float("inf"), "48h+"),
    ]

    # Forecast resolution handling:
    # Elexon WINDFOR is published with hourly resolution (minute 00).
    # Per locked decision: hourly forecasts apply to both 30-min settlement intervals of the hour.
    map_hourly_forecast_to_half_hours: bool = True

    # Data directory and cached file names
    base_dir: Path = Path(__file__).resolve().parent.parent.parent
    data_dir: Path = base_dir / "data"
    actuals_filename: str = "fuelhh_wind_actuals.parquet"
    forecasts_filename: str = "windfor_forecasts.parquet"
    static_dir: Path | None = None

    # App host & port - respects PORT env var for Heroku / container hosting
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", "8000"))

    @property
    def resolved_static_dir(self) -> Path | None:
        """Resolve frontend static files directory if available."""
        if self.static_dir and self.static_dir.exists():
            return self.static_dir
        candidate_static = self.base_dir / "static"
        if candidate_static.exists():
            return candidate_static
        candidate_frontend = self.base_dir.parent / "frontend" / "dist"
        if candidate_frontend.exists():
            return candidate_frontend
        return None

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.timezone)

    @property
    def actuals_path(self) -> Path:
        return self.data_dir / self.actuals_filename

    @property
    def forecasts_path(self) -> Path:
        return self.data_dir / self.forecasts_filename


settings = Settings()
