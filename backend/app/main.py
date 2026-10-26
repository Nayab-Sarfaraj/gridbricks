from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routers import errors, forecast, health, metrics
from app.core.config import settings
from app.core.logging import get_logger, setup_logging

logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Application factory."""
    setup_logging()

    app = FastAPI(
        title="Gridbricks Wind Forecast Accuracy API",
        description="Day-ahead wind power forecast and accuracy evaluation service",
        version="0.1.0",
    )

    # Enable CORS for frontend development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routers
    app.include_router(health.router, prefix="/api")
    app.include_router(forecast.router, prefix="/api")
    app.include_router(metrics.router, prefix="/api")
    app.include_router(errors.router, prefix="/api")

    # Mount static assets if built frontend is present
    static_dir = settings.resolved_static_dir
    if static_dir is not None:
        logger.info(f"Mounting static frontend build from: {static_dir}")
        app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
    else:
        logger.info("No static frontend build found. Running in API-only mode.")

    return app


app = create_app()
