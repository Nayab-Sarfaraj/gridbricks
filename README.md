# Gridbricks &mdash; Day-Ahead Wind Forecast Accuracy & Safety Buffer Sizing

> A production-grade web application for a UK energy utility's day-ahead power buying team. Built exclusively with national-level wind data from Elexon BMRS (`FUELHH` actuals and `WINDFOR` forecasts) for delivery days across January 2026.

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19%20%7C%20TypeScript-61DAFB?logo=react)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage-2496ED?logo=docker)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Deployment-Render-46E3B7?logo=render)](https://gridbricks-qek9.onrender.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

### 🌐 Live Production Deployment
- **Web Application:** [https://gridbricks-qek9.onrender.com/](https://gridbricks-qek9.onrender.com/)
- **Healthcheck Endpoint:** [https://gridbricks-qek9.onrender.com/api/health](https://gridbricks-qek9.onrender.com/api/health)
- **OpenAPI Interactive Documentation:** [https://gridbricks-qek9.onrender.com/docs](https://gridbricks-qek9.onrender.com/docs)

---

## 1. Overview & Trading Context

Day-ahead power buyers for UK energy utilities face a critical financial trade-off at **09:00 UK time on D-1** (prior to the 11:00 UK power exchange auction gate closure):

1. **Volume Exposure:** If wind output comes in **below forecast** (a shortfall, indicated by negative error: $\text{Actual} - \text{Forecast} < 0$), the utility is short and must purchase replacement energy at punitive system cashout prices in the balancing mechanism.
2. **Buffer Sizing:** Buyers must size a quantitative safety buffer to reserve or hedge against down-side forecast error.
3. **The January 2026 Insight:** Across January 2026, day-ahead wind forecasts exhibited a severe systemic bias&mdash;over-predicting generation by an average of **$1,747.89\text{ MW}$** (~18.1% of actual generation). 
   - A conservative **P95 shortfall buffer** requires **$5,310\text{ MW}$** of reserve capacity.
   - If systemic bias is calibrated or base-hedged, the residual spread buffer (**Debiased P95**) drops to **$3,562\text{ MW}$**, freeing up over $1.7\text{ GW}$ of capital.

---

## 2. Architecture & Directory Guide

The application is structured into a cleanly decoupled frontend and backend, unified in a single container:

```
gridbricks/
├── Dockerfile                   # Multi-stage production build (Node 22 + Python 3.12-slim)
├── docker-compose.yml           # Local one-command container runner
├── heroku.yml                   # Container stack specification for Heroku / Cloud Run
├── README.md                    # System documentation and disclosure
├── AGENTS.md                    # Architectural contract and locked rules
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app factory, CORS, static file mount
│   │   ├── api/
│   │   │   ├── deps.py          # Dependency injection container (precomputes on startup)
│   │   │   └── routers/
│   │   │       ├── health.py    # GET /api/health (container liveness)
│   │   │       ├── forecast.py  # GET /api/forecast?date=YYYY-MM-DD (48 half-hours)
│   │   │       ├── metrics.py   # GET /api/metrics (MAE, RMSE, Bias, Buffers)
│   │   │       └── errors.py    # GET /api/errors (Horizon, Hour of Day, Daily series)
│   │   ├── services/
│   │   │   ├── forecast_service.py       # D-1 09:00 cutoff selection & hourly-to-slot mapping
│   │   │   ├── metrics_service.py        # Quant metrics, shortfall percentiles & buffers
│   │   │   └── error_analysis_service.py # Horizon bucketing & temporal error profiles
│   │   ├── schemas/             # Pydantic v2 schemas for all requests and responses
│   │   ├── data/
│   │   │   └── repository.py    # Sole data layer: loads Parquet, enforces UTC & deduplication
│   │   └── core/
│   │       ├── config.py        # Centralized settings (cutoff, tz, buckets, paths, port)
│   │       ├── time_utils.py    # UTC/UK conversion & D-1 09:00 cutoff calculator
│   │       └── logging.py       # Structured logging configuration
│   ├── data/                    # Cached January data files (no database required)
│   │   ├── fuelhh_wind_actuals.parquet   # FUELHH WIND generation (1,824 rows)
│   │   └── windfor_forecasts.parquet     # WINDFOR generation forecasts (21,640 rows)
│   ├── scripts/
│   │   └── fetch_elexon.py      # BMRS stream fetcher with chunking and retries
│   ├── tests/                   # 27 unit and integration tests (pytest)
│   └── pyproject.toml           # Python dependencies and tool configurations
│
└── frontend/
    ├── src/
    │   ├── App.tsx              # App shell, TanStack Query provider, navigation
    │   ├── components/common/   # Assumptions strip, header, metric cards, chart wrappers
    │   ├── features/forecast/   # Hero tab: Date picker, 48-slot curve, clamped buffer bands
    │   ├── features/accuracy/   # Accuracy tab: Horizon, hour-of-day, daily series breakdown
    │   ├── hooks/               # useForecast, useMetrics, useErrors hooks
    │   ├── lib/                 # Typed API client and TypeScript schema definitions
    │   └── index.css            # Tailwind CSS styling
    ├── package.json
    └── vite.config.ts
```

---

## 3. Quickstart & How to Run

### Option A: Run via Docker (Recommended)

To run the entire combined application (FastAPI + React) in Docker:

```bash
# Clone the repository
git clone <repo-url>
cd <repo-folder>

# Launch the multi-stage container
docker compose up --build
```

Access the application in your browser at:
- **Web UI:** [http://localhost:8000](http://localhost:8000)
- **API Health:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Interactive OpenAPI Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Option B: Local Development (Without Docker)

#### 1. Backend Setup:
```bash
cd backend

# Using uv (fast Python manager)
uv sync

# Run tests to verify logic
uv run pytest -v

# Run the FastAPI server
uv run uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup:
```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server with proxy to backend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Analytical Methodology & Assumptions

All quantitative calculations adhere strictly to the rules defined in `AGENTS.md`:

| Parameter | Value / Methodology | Rationale |
| :--- | :--- | :--- |
| **Cutoff Time** | `09:00 UK time on D-1` | Day-ahead purchase decision deadline prior to the 11:00 UK power exchange auction. Defined in a single config setting (`cutoff_hour=9`). |
| **Delivery Window** | `2026-01-02` to `2026-02-01` | Corresponds to buying decisions made between January 1 and January 31, 2026. |
| **Error Convention** | $\text{Error} = \text{Actual} - \text{Forecast}$ | **Negative error represents over-forecasting** (Actual was lower than Forecast), which creates volume shortfall and financial risk for the buyer. |
| **Resolution Mapping** | Hourly to 30-min settlement slots | Elexon `WINDFOR` forecasts are published at hourly intervals (`:00`). Per specification, each hourly forecast applies to both half-hours of that hour (`:00` and `:30`). |
| **Suggested Buffer (P95)** | $\max(0, -P_{05}(\text{Error}))$ | The positive MW buffer required to cover 95% of shortfall events across the period ($5,310.05\text{ MW}$). |
| **Debiased Buffer (P95)** | $\max(0, -P_{05}(\text{Error} - \text{Bias}))$ | Buffer required after isolating and removing systemic bias ($3,562.16\text{ MW}$), highlighting the spread-only uncertainty. |
| **Band Clamping** | $\max(0, \text{Forecast} - \text{Buffer})$ | Lower band edge is clamped at $0\text{ MW}$ in all visualisations to ensure physically realistic positive power. |
| **Energy Sizing** | $\sum \text{MW} \times 0.5\text{ h}$ | Computed in MWh per delivery day; preserves mathematical accuracy even if individual slots are omitted. |
| **Missing Slot Accounting**| Dropped slot auditing | Slots are explicitly tracked with reasons: `no_forecast_published`, `no_forecast_before_cutoff`, or `missing_actual`. With hourly mapping, all 1,488 half-hours in January 2026 are evaluated ($0$ dropped slots). |

### Analytical Caveat
> In January 2026 data, National Grid ESO forecasts over-predicted wind by $\sim 1.75\text{ GW}$ at the D-1 09:00 cutoff. While this represents a major operational finding for procurement teams, we note as an analytical caveat that Elexon `FUELHH` (transmission-metered outturn) and `WINDFOR` (NESO model generation) dataset scopes may have minor reporting boundary differences regarding embedded generation.

---

## 5. API Reference

All timestamps are ISO 8601 in UTC. Generation is measured in MW.

- `GET /api/health`: Returns service status and current UTC timestamp.
- `GET /api/forecast?date=YYYY-MM-DD`: Returns 48 half-hour settlement points with `{startTime, forecast, actual, error, publishTime, missingReason}`, along with daily aggregates: `forecastTotalMwh`, `forecastAvgMw`, `suggestedBufferP95`, `debiasedBufferP95`, `missingSlots`, `totalSlots`, and `droppedByReason`.
- `GET /api/metrics`: Returns headline quantitative metrics across the entire evaluated month: `mae`, `rmse`, `bias`, `suggestedBufferP95`, `suggestedBufferP90`, `debiasedBufferP95`, `maePercent`, and slot counts.
- `GET /api/errors`: Returns multidimensional error breakdowns:
  - `byHorizon`: Errors grouped into 5 lead-time buckets (`0-6h`, `6-12h`, `12-24h`, `24-48h`, `48h+`).
  - `byHourOfDay`: Errors grouped by delivery hour (0–23 UK time) showing diurnal risk patterns.
  - `dailySeries`: Daily MAE, Bias, and P95 shortfall progression across all 31 delivery days.

---

## 6. How to Re-Run the Data Pipeline

The local parquet files in `backend/data/` were populated using the included extraction script:

```bash
# From the backend directory
cd backend

# Execute the fetch script
python scripts/fetch_elexon.py
```

The script:
1. Queries the Elexon BMRS API (`data.elexon.co.uk`) streams for `FUELHH` and `WINDFOR`.
2. Chunks requests across 7-day windows to satisfy API rate limits.
3. Filters `FUELHH` strictly to `fuelType == "WIND"`.
4. Saves high-performance Parquet files to `backend/data/`.
5. *Note: Per project constraints, the backend service never makes live external API calls during runtime.*

---

## 7. Verification & Test Suite

The backend includes a comprehensive pytest suite covering all business logic, hand-calculated fixtures, boundary conditions, and schema validations:

```bash
cd backend
uv run pytest -v
```

**Test Coverage Highlights:**
- `test_hourly_forecast_maps_to_both_half_hours`: Proves `:00` forecasts correctly apply to `:30` half-hours.
- `test_slot_published_after_cutoff_gets_no_forecast_before_cutoff`: Verifies strict D-1 09:00 cutoff boundary enforcement.
- `test_shortfall_floors_at_zero_when_no_shortfall`: Verifies buffer floor logic.
- `test_debiased_buffer_reduces_buffer_when_bias_is_negative`: Verifies debiased spread buffer calculation.
- `test_real_january_delivery_day_matches_hand_check`: Verifies Jan 15 against hand-reconciled raw figures.
- `test_root_serves_frontend_when_built`: Proves single-container SPA serving works seamlessly.

Frontend linting and type-checking:
```bash
cd frontend
npm run lint
npm run build
```

---

## 8. Deployment (Render)

The application is deployed live on **Render** as a unified Docker Web Service:

- **Live Web App:** [https://gridbricks-qek9.onrender.com/](https://gridbricks-qek9.onrender.com/)
- **API Health Check:** [https://gridbricks-qek9.onrender.com/api/health](https://gridbricks-qek9.onrender.com/api/health)
- **Interactive OpenAPI Docs:** [https://gridbricks-qek9.onrender.com/docs](https://gridbricks-qek9.onrender.com/docs)

### How to Deploy on Render:
1. Connect your GitHub repository to [Render](https://render.com/).
2. Create a new **Web Service**.
3. Select **Docker** as the Environment / Runtime.
4. Set the configuration:
   - **Environment:** Docker
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Context:** `.`
   - **Health Check Path:** `/api/health`
5. Deploy. Render automatically runs the multi-stage build (compiling React with Node 22, bundling static assets into Python 3.12-slim), assigns the dynamic `$PORT`, and starts the Uvicorn server.

---

## 9. AI Tools Disclosure

In accordance with the project guidelines, it is explicitly disclosed that **AI tools (Claude 3.7 / Claude Code)** were utilized to assist in the construction of this codebase. AI assistance was applied toward rapid scaffolding, test fixture generation, mathematical reconciliation of percentiles, and UI component drafting, under continuous human architectural supervision and verification.
