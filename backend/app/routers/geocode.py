import sqlite3
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.cache import get_cached_or_fetch
from app.clients import nominatim
from app.deps import get_db

router = APIRouter(prefix="/api/geocode", tags=["geocode"])


def get_profile_restriction(
    profile_id: Optional[int], db: sqlite3.Connection
) -> Optional[tuple[float, float, float]]:
    if profile_id is None:
        return None
    row = db.execute(
        "SELECT center_lat, center_lon, radius_km FROM profiles WHERE id = ?", (profile_id,)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    if row["center_lat"] is None or row["center_lon"] is None or row["radius_km"] is None:
        return None
    return row["center_lat"], row["center_lon"], row["radius_km"]


def build_cache_key(query: str, restriction: Optional[tuple[float, float, float]]) -> str:
    return f"geocode:{query.strip().lower()}:{restriction}"


@router.get("")
def geocode(
    q: str,
    profile_id: Optional[int] = None,
    *,
    background_tasks: BackgroundTasks,
    db: sqlite3.Connection = Depends(get_db),
) -> list[dict]:
    restriction = get_profile_restriction(profile_id, db)
    center_lat, center_lon, radius_km = restriction or (None, None, None)

    def fetch() -> list[dict]:
        return nominatim.search_address(q, center_lat, center_lon, radius_km)

    return get_cached_or_fetch(
        db,
        build_cache_key(q, restriction),
        "geocode",
        fetch,
        background_tasks.add_task,
    )
