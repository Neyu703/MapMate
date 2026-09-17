import sqlite3
from pathlib import Path

from platformdirs import user_data_dir

APP_NAME = "MapMate"

SCHEMA = """
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    center_lat REAL,
    center_lon REAL,
    radius_km REAL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS markers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    category TEXT,
    color TEXT DEFAULT '#3388ff',
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    marker_a_id INTEGER NOT NULL REFERENCES markers(id) ON DELETE CASCADE,
    marker_b_id INTEGER NOT NULL REFERENCES markers(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(marker_a_id, marker_b_id)
);

CREATE TABLE IF NOT EXISTS cache_entries (
    cache_key TEXT PRIMARY KEY,
    query_type TEXT NOT NULL,
    value_json TEXT NOT NULL,
    hit_count INTEGER NOT NULL DEFAULT 1,
    last_fetched_at REAL NOT NULL,
    last_checked_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    name TEXT NOT NULL,
    duration_ms INTEGER,
    profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
    meta_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_metrics_event_type_created ON metrics(event_type, created_at);
"""


def get_default_db_path() -> Path:
    data_dir = Path(user_data_dir(APP_NAME, appauthor=False))
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "app.db"


def connect(db_path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(db_path, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(SCHEMA)
    ensure_default_profile(connection)
    connection.commit()


def ensure_default_profile(connection: sqlite3.Connection) -> None:
    existing = connection.execute(
        "SELECT id FROM profiles WHERE is_default = 1 LIMIT 1"
    ).fetchone()
    if existing is None:
        connection.execute(
            "INSERT INTO profiles (name, is_default) VALUES (?, 1)",
            ("Standard",),
        )
