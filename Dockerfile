# Multi-stage Dockerfile for Gridbricks Wind Forecast Application
# Stage 1: Build React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python runtime
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install uv for fast, reliable Python package installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install production dependencies
COPY backend/pyproject.toml /app/
RUN uv pip install --system --no-cache \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.30.0" \
    "pandas>=2.2.0" \
    "pyarrow>=17.0.0" \
    "pydantic>=2.9.0" \
    "pydantic-settings>=2.5.0" \
    "httpx>=0.28.1"

# Copy backend application source and cached Parquet data
COPY backend/app /app/app
COPY backend/data /app/data

# Copy compiled frontend assets to /app/static (served automatically by FastAPI)
COPY --from=frontend-builder /app/frontend/dist /app/static

EXPOSE 8000

# Health check to ensure service liveness
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start Uvicorn, evaluating $PORT at runtime (required for Heroku container stack)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
