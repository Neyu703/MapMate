import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app import db as db_module
from app.logging_setup import configure_logging, get_default_log_dir
from app.middleware import RequestLoggingMiddleware
from app.routers import geocode, links, markers, poi, profiles, route, transit_lines

logger = logging.getLogger("mapmate")


def get_default_frontend_dist() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS) / "frontend_dist"  # type: ignore[attr-defined]
    return Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


def create_app(
    db_path: Path | None = None,
    log_dir: Path | None = None,
    frontend_dist: Path | None = None,
) -> FastAPI:
    resolved_db_path = db_path or db_module.get_default_db_path()
    resolved_log_dir = log_dir or get_default_log_dir()
    configure_logging(resolved_log_dir)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.db = db_module.connect(resolved_db_path)
        db_module.init_schema(app.state.db)
        logger.info("MapMate backend started (db=%s)", resolved_db_path)
        yield
        app.state.db.close()
        logger.info("MapMate backend stopped")

    app = FastAPI(title="MapMate", lifespan=lifespan)
    app.add_middleware(RequestLoggingMiddleware)

    app.include_router(profiles.router)
    app.include_router(markers.router)
    app.include_router(links.router)
    app.include_router(geocode.router)
    app.include_router(poi.router)
    app.include_router(route.router)
    app.include_router(transit_lines.router)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    resolved_frontend_dist = frontend_dist or get_default_frontend_dist()
    if resolved_frontend_dist.is_dir():
        app.mount("/", StaticFiles(directory=resolved_frontend_dist, html=True), name="frontend")

    return app


app = create_app()
