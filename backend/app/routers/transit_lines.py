import sqlite3
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends

from app.cache import get_cached_or_fetch
from app.clients import transit_lines
from app.deps import get_db

router = APIRouter(prefix="/api/transit-lines", tags=["transit-lines"])


@router.get("")
def search_transit_lines(
    lat: float,
    lon: float,
    radius: float,
    *,
    background_tasks: BackgroundTasks,
    db: sqlite3.Connection = Depends(get_db),
) -> list[dict]:
    cache_key = f"transit_lines:{lat}:{lon}:{radius}"

    def fetch() -> list[dict]:
        return transit_lines.search_transit_lines(lat, lon, radius)

    return get_cached_or_fetch(db, cache_key, "transit_lines", fetch, background_tasks.add_task)
