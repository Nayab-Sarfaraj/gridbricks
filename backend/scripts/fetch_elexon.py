"""
Elexon BMRS Data Fetcher for Gridbricks Day-Ahead Wind Forecast Evaluation.

This script fetches actual wind generation (FUELHH dataset) and wind power
forecasts (WINDFOR dataset) from the official Elexon BMRS API.

Datasets fetched:
1. FUELHH: Actual generation by fuel type.
   - Endpoint: https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream
   - Filtered to fuelType == 'WIND'
   - Output fields: startTime, generation (MW)
2. WINDFOR: Wind power generation forecasts.
   - Endpoint: https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream
   - Output fields: startTime, publishTime, generation (MW)

Window:
- Covers decisions made in January 2026 (delivery Jan 2 to Feb 1, 2026).
- Fetches buffer from 2025-12-28 to 2026-02-03 to ensure full coverage.
- Chunked by 2-day date ranges to respect API limits and ensure reliability.
- Saves Parquet files into backend/data/.

Usage:
    cd backend
    uv run python scripts/fetch_elexon.py
"""

import logging
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("fetch_elexon")

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
START_DATE = datetime(2025, 12, 28, 0, 0, 0, tzinfo=timezone.utc)
END_DATE = datetime(2026, 2, 3, 23, 59, 59, tzinfo=timezone.utc)
CHUNK_DAYS = 2
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data"


def fetch_stream_chunk(
    client: httpx.Client,
    dataset: str,
    from_dt: datetime,
    to_dt: datetime,
    max_retries: int = 3,
) -> list[dict]:
    """Fetch a single chunk for a dataset with retry backoff."""
    url = f"{BASE_URL}/{dataset}/stream"
    params = {
        "publishDateTimeFrom": from_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publishDateTimeTo": to_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    for attempt in range(1, max_retries + 1):
        try:
            response = client.get(url, params=params, timeout=30.0)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    return data
                return []
            if response.status_code == 404:
                return []
            logger.warning(
                "Chunk %s -> %s for %s returned HTTP %s (attempt %d/%d)",
                params["publishDateTimeFrom"],
                params["publishDateTimeTo"],
                dataset,
                response.status_code,
                attempt,
                max_retries,
            )
        except Exception as e:
            logger.warning(
                "Chunk %s -> %s for %s failed with %s (attempt %d/%d)",
                params["publishDateTimeFrom"],
                params["publishDateTimeTo"],
                dataset,
                e,
                attempt,
                max_retries,
            )
        time.sleep(1.5 * attempt)

    logger.error(
        "Failed to fetch chunk %s to %s for %s after %d retries",
        params["publishDateTimeFrom"],
        params["publishDateTimeTo"],
        dataset,
        max_retries,
    )
    return []


def fetch_fuelhh_wind(client: httpx.Client) -> pd.DataFrame:
    """Fetch and clean FUELHH wind generation actuals."""
    logger.info("Starting FUELHH (WIND) fetch...")
    records = []
    current_start = START_DATE

    while current_start < END_DATE:
        current_end = min(current_start + timedelta(days=CHUNK_DAYS), END_DATE)
        chunk = fetch_stream_chunk(client, "FUELHH", current_start, current_end)
        for item in chunk:
            if item.get("fuelType") == "WIND":
                records.append(
                    {
                        "startTime": item["startTime"],
                        "generation": float(item["generation"]),
                    }
                )
        logger.info(
            "FUELHH chunk [%s to %s]: retrieved %d records (running total: %d)",
            current_start.date(),
            current_end.date(),
            len(chunk),
            len(records),
        )
        current_start = current_end

    df = pd.DataFrame(records)
    if not df.empty:
        # Normalize and sort
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        df = (
            df.drop_duplicates(subset=["startTime"]).sort_values("startTime").reset_index(drop=True)
        )
    logger.info("FUELHH fetch complete. Total unique wind actuals: %d", len(df))
    return df


def fetch_windfor_forecasts(client: httpx.Client) -> pd.DataFrame:
    """Fetch and clean WINDFOR wind forecasts."""
    logger.info("Starting WINDFOR forecasts fetch...")
    records = []
    current_start = START_DATE

    while current_start < END_DATE:
        current_end = min(current_start + timedelta(days=CHUNK_DAYS), END_DATE)
        chunk = fetch_stream_chunk(client, "WINDFOR", current_start, current_end)
        for item in chunk:
            records.append(
                {
                    "startTime": item["startTime"],
                    "publishTime": item["publishTime"],
                    "generation": float(item["generation"]),
                }
            )
        logger.info(
            "WINDFOR chunk [%s to %s]: retrieved %d forecasts (running total: %d)",
            current_start.date(),
            current_end.date(),
            len(chunk),
            len(records),
        )
        current_start = current_end

    df = pd.DataFrame(records)
    if not df.empty:
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
        df = df.drop_duplicates(subset=["startTime", "publishTime"])

        # Filter to forecasts relevant for target delivery window (within buffer)
        buffer_start = pd.Timestamp("2025-12-28 00:00:00", tz=timezone.utc)
        buffer_end = pd.Timestamp("2026-02-04 00:00:00", tz=timezone.utc)
        df = df[(df["startTime"] >= buffer_start) & (df["startTime"] <= buffer_end)]

        df = df.sort_values(["startTime", "publishTime"]).reset_index(drop=True)
    logger.info("WINDFOR fetch complete. Total unique forecasts: %d", len(df))
    return df


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    actuals_path = OUTPUT_DIR / "fuelhh_wind_actuals.parquet"
    forecasts_path = OUTPUT_DIR / "windfor_forecasts.parquet"

    with httpx.Client() as client:
        actuals_df = fetch_fuelhh_wind(client)
        actuals_df.to_parquet(actuals_path, index=False)
        logger.info("Saved %d actuals rows to %s", len(actuals_df), actuals_path)

        forecasts_df = fetch_windfor_forecasts(client)
        forecasts_df.to_parquet(forecasts_path, index=False)
        logger.info("Saved %d forecast rows to %s", len(forecasts_df), forecasts_path)


if __name__ == "__main__":
    main()
