import sqlite3

from fastapi import APIRouter, BackgroundTasks, Depends

from app.cache import get_cached_or_fetch
from app.clients import osrm, transit
from app.deps import get_db

router = APIRouter(prefix="/api/route", tags=["route"])


@router.get("/walk")
def route_walk(
    from_lat: float,
    from_lon: float,
    to_lat: float,
    to_lon: float,
    *,
    background_tasks: BackgroundTasks,
    db: sqlite3.Connection = Depends(get_db),
) -> dict:
    cache_key = f"route_walk:{from_lat}:{from_lon}:{to_lat}:{to_lon}"

    def fetch() -> dict:
        return osrm.get_walking_route(from_lat, from_lon, to_lat, to_lon)

    return get_cached_or_fetch(db, cache_key, "route_walk", fetch, background_tasks.add_task)


@router.get("/transit")
def route_transit(from_lat: float, from_lon: float, to_lat: float, to_lon: float) -> list[dict]:
    # Departure times are time-critical: always fetched live, never cached (see plan's Caching-Strategie).
    return transit.get_journeys(from_lat, from_lon, to_lat, to_lon)
