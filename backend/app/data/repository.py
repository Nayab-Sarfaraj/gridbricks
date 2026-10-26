from pathlib import Path
from typing import Optional

import pandas as pd

from app.core.config import settings


class DataRepository:
    """
    Data access layer: the ONLY module that reads and loads cached files.
    Loads data once and caches cleaned, typed DataFrames in memory.
    """

    def __init__(
        self,
        actuals_path: Optional[Path] = None,
        forecasts_path: Optional[Path] = None,
    ) -> None:
        self.actuals_path = actuals_path or settings.actuals_path
        self.forecasts_path = forecasts_path or settings.forecasts_path
        self._actuals_df: Optional[pd.DataFrame] = None
        self._forecasts_df: Optional[pd.DataFrame] = None

    def _read_file(self, path: Path) -> pd.DataFrame:
        if not path.exists():
            raise FileNotFoundError(f"Data file not found at: {path}")
        if path.suffix == ".parquet":
            return pd.read_parquet(path)
        elif path.suffix == ".csv":
            return pd.read_csv(path)
        else:
            raise ValueError(f"Unsupported file format: {path.suffix}")

    def get_actuals(self, delivery_window_only: bool = True) -> pd.DataFrame:
        """
        Returns clean wind actuals with columns ['startTime', 'generation'].
        - startTime is timezone-aware UTC datetime.
        - Exact duplicates by startTime are dropped.
        - If delivery_window_only is True, filtered to Jan 2 00:00 UTC to Feb 1 23:30 UTC.
        """
        if self._actuals_df is None:
            raw = self._read_file(self.actuals_path)
            df = raw[["startTime", "generation"]].copy()
            df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
            df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
            # Drop duplicates by startTime
            df = (
                df.drop_duplicates(subset=["startTime"])
                .sort_values("startTime")
                .reset_index(drop=True)
            )
            self._actuals_df = df

        df = self._actuals_df
        if delivery_window_only:
            # Jan 2, 2026 00:00:00 UTC to Feb 1, 2026 23:30:00 UTC
            start_bound = pd.Timestamp(f"{settings.delivery_window_start} 00:00:00", tz="UTC")
            # Delivery window end is Feb 1, so target time includes up to 23:30 on that date
            end_bound = pd.Timestamp(f"{settings.delivery_window_end} 23:59:59", tz="UTC")
            df = df[(df["startTime"] >= start_bound) & (df["startTime"] <= end_bound)].reset_index(
                drop=True
            )

        return df

    def get_forecasts(self) -> pd.DataFrame:
        """
        Returns clean wind forecasts with columns ['startTime', 'publishTime', 'generation'].
        - startTime and publishTime are timezone-aware UTC datetimes.
        - Exact duplicates by ['startTime', 'publishTime'] are dropped.
        """
        if self._forecasts_df is None:
            raw = self._read_file(self.forecasts_path)
            df = raw[["startTime", "publishTime", "generation"]].copy()
            df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
            df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
            df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
            df = (
                df.drop_duplicates(subset=["startTime", "publishTime"])
                .sort_values(["startTime", "publishTime"])
                .reset_index(drop=True)
            )
            self._forecasts_df = df

        return self._forecasts_df


# Default singleton instance for app usage
default_repository = DataRepository()
