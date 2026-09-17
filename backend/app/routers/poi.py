import sqlite3
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.cache import get_cached_or_fetch
from app.clients import overpass
from app.deps import get_db

router = APIRouter(prefix="/api/poi", tags=["poi"])


def cap_radius_to_profile(
    radius_meters: float, profile_id: Optional[int], db: sqlite3.Connection
) -> float:
    if profile_id is None:
        return radius_meters
    row = db.execute("SELECT radius_km FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    if row["radius_km"] is None:
        return radius_meters
    return min(radius_meters, row["radius_km"] * 1000)


@router.get("")
def search_poi(
    lat: float,
    lon: float,
    radius: float,
    categories: str,
    profile_id: Optional[int] = None,
    *,
    background_tasks: BackgroundTasks,
    db: sqlite3.Connection = Depends(get_db),
) -> list[dict]:
    category_list = [category.strip() for category in categories.split(",") if category.strip()]
    effective_radius = cap_radius_to_profile(radius, profile_id, db)
    cache_key = f"poi:{lat}:{lon}:{effective_radius}:{sorted(category_list)}"

    def fetch() -> list[dict]:
        return overpass.search_pois(lat, lon, effective_radius, category_list)

    return get_cached_or_fetch(db, cache_key, "poi", fetch, background_tasks.add_task)
