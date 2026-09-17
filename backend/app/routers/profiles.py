import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_db
from app.models import Profile, ProfileCreate, ProfileUpdate

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def row_to_profile(row: sqlite3.Row) -> Profile:
    return Profile(
        id=row["id"],
        name=row["name"],
        center_lat=row["center_lat"],
        center_lon=row["center_lon"],
        radius_km=row["radius_km"],
        is_default=bool(row["is_default"]),
        created_at=row["created_at"],
    )


@router.get("", response_model=list[Profile])
def list_profiles(db: sqlite3.Connection = Depends(get_db)) -> list[Profile]:
    rows = db.execute("SELECT * FROM profiles ORDER BY id").fetchall()
    return [row_to_profile(row) for row in rows]


@router.post("", response_model=Profile, status_code=201)
def create_profile(payload: ProfileCreate, db: sqlite3.Connection = Depends(get_db)) -> Profile:
    cursor = db.execute(
        "INSERT INTO profiles (name, center_lat, center_lon, radius_km) VALUES (?, ?, ?, ?)",
        (payload.name, payload.center_lat, payload.center_lon, payload.radius_km),
    )
    db.commit()
    return get_profile_or_404(cursor.lastrowid, db)


@router.put("/{profile_id}", response_model=Profile)
def update_profile(
    profile_id: int, payload: ProfileUpdate, db: sqlite3.Connection = Depends(get_db)
) -> Profile:
    get_profile_or_404(profile_id, db)
    updates = payload.model_dump(exclude_unset=True)
    if updates:
        set_clause = ", ".join(f"{field} = ?" for field in updates)
        db.execute(
            f"UPDATE profiles SET {set_clause} WHERE id = ?",
            (*updates.values(), profile_id),
        )
        db.commit()
    return get_profile_or_404(profile_id, db)


@router.delete("/{profile_id}", status_code=204)
def delete_profile(profile_id: int, db: sqlite3.Connection = Depends(get_db)) -> None:
    get_profile_or_404(profile_id, db)
    remaining = db.execute("SELECT COUNT(*) AS count FROM profiles").fetchone()["count"]
    if remaining <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last remaining profile")
    db.execute("DELETE FROM profiles WHERE id = ?", (profile_id,))
    db.commit()


def get_profile_or_404(profile_id: int, db: sqlite3.Connection) -> Profile:
    row = db.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return row_to_profile(row)
