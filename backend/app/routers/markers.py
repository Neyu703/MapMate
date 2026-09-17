import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_db
from app.models import Marker, MarkerCreate, MarkerUpdate

router = APIRouter(prefix="/api/markers", tags=["markers"])


def row_to_marker(row: sqlite3.Row) -> Marker:
    return Marker(
        id=row["id"],
        profile_id=row["profile_id"],
        name=row["name"],
        lat=row["lat"],
        lon=row["lon"],
        category=row["category"],
        color=row["color"],
        note=row["note"],
        created_at=row["created_at"],
    )


def ensure_profile_exists(profile_id: int, db: sqlite3.Connection) -> None:
    row = db.execute("SELECT id FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Profile not found")


def get_marker_or_404(marker_id: int, db: sqlite3.Connection) -> Marker:
    row = db.execute("SELECT * FROM markers WHERE id = ?", (marker_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Marker not found")
    return row_to_marker(row)


@router.get("", response_model=list[Marker])
def list_markers(profile_id: int, db: sqlite3.Connection = Depends(get_db)) -> list[Marker]:
    ensure_profile_exists(profile_id, db)
    rows = db.execute(
        "SELECT * FROM markers WHERE profile_id = ? ORDER BY id", (profile_id,)
    ).fetchall()
    return [row_to_marker(row) for row in rows]


@router.post("", response_model=Marker, status_code=201)
def create_marker(
    profile_id: int, payload: MarkerCreate, db: sqlite3.Connection = Depends(get_db)
) -> Marker:
    ensure_profile_exists(profile_id, db)
    cursor = db.execute(
        "INSERT INTO markers (profile_id, name, lat, lon, category, color, note) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            profile_id,
            payload.name,
            payload.lat,
            payload.lon,
            payload.category,
            payload.color,
            payload.note,
        ),
    )
    db.commit()
    return get_marker_or_404(cursor.lastrowid, db)


@router.put("/{marker_id}", response_model=Marker)
def update_marker(
    marker_id: int, payload: MarkerUpdate, db: sqlite3.Connection = Depends(get_db)
) -> Marker:
    get_marker_or_404(marker_id, db)
    updates = payload.model_dump(exclude_unset=True)
    if updates:
        set_clause = ", ".join(f"{field} = ?" for field in updates)
        db.execute(
            f"UPDATE markers SET {set_clause} WHERE id = ?",
            (*updates.values(), marker_id),
        )
        db.commit()
    return get_marker_or_404(marker_id, db)


@router.delete("/{marker_id}", status_code=204)
def delete_marker(marker_id: int, db: sqlite3.Connection = Depends(get_db)) -> None:
    get_marker_or_404(marker_id, db)
    db.execute("DELETE FROM markers WHERE id = ?", (marker_id,))
    db.commit()
