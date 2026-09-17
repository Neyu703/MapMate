import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_db
from app.models import Link, LinkCreate

router = APIRouter(prefix="/api/links", tags=["links"])


def row_to_link(row: sqlite3.Row) -> Link:
    return Link(
        id=row["id"],
        profile_id=row["profile_id"],
        marker_a_id=row["marker_a_id"],
        marker_b_id=row["marker_b_id"],
        created_at=row["created_at"],
    )


def get_link_or_404(link_id: int, db: sqlite3.Connection) -> Link:
    row = db.execute("SELECT * FROM links WHERE id = ?", (link_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Link not found")
    return row_to_link(row)


def get_marker_profile_id(marker_id: int, db: sqlite3.Connection) -> int:
    row = db.execute("SELECT profile_id FROM markers WHERE id = ?", (marker_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Marker {marker_id} not found")
    return row["profile_id"]


@router.get("", response_model=list[Link])
def list_links(profile_id: int, db: sqlite3.Connection = Depends(get_db)) -> list[Link]:
    rows = db.execute(
        "SELECT * FROM links WHERE profile_id = ? ORDER BY id", (profile_id,)
    ).fetchall()
    return [row_to_link(row) for row in rows]


@router.post("", response_model=Link, status_code=201)
def create_link(payload: LinkCreate, db: sqlite3.Connection = Depends(get_db)) -> Link:
    if payload.marker_a_id == payload.marker_b_id:
        raise HTTPException(status_code=400, detail="A marker cannot be linked to itself")

    profile_a = get_marker_profile_id(payload.marker_a_id, db)
    profile_b = get_marker_profile_id(payload.marker_b_id, db)
    if profile_a != profile_b:
        raise HTTPException(status_code=400, detail="Both markers must belong to the same profile")

    try:
        cursor = db.execute(
            "INSERT INTO links (profile_id, marker_a_id, marker_b_id) VALUES (?, ?, ?)",
            (profile_a, payload.marker_a_id, payload.marker_b_id),
        )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="These markers are already linked")
    db.commit()
    return get_link_or_404(cursor.lastrowid, db)


@router.delete("/{link_id}", status_code=204)
def delete_link(link_id: int, db: sqlite3.Connection = Depends(get_db)) -> None:
    get_link_or_404(link_id, db)
    db.execute("DELETE FROM links WHERE id = ?", (link_id,))
    db.commit()
