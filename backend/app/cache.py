import json
import sqlite3
import time
from typing import Callable, Optional

TTL_SECONDS_BY_QUERY_TYPE = {
    "geocode": 30 * 24 * 3600,
    "poi": 7 * 24 * 3600,
    "route_walk": 30 * 24 * 3600,
    "transit_lines": 30 * 24 * 3600,
}
POPULARITY_THRESHOLD = 3


def get_cached_or_fetch(
    db: sqlite3.Connection,
    cache_key: str,
    query_type: str,
    fetch: Callable[[], object],
    schedule_background_refresh: Optional[Callable[[Callable[[], None]], None]] = None,
) -> object:
    row = db.execute("SELECT * FROM cache_entries WHERE cache_key = ?", (cache_key,)).fetchone()

    if row is None:
        return _fetch_and_store(db, cache_key, query_type, fetch)

    hit_count = _increment_hit_count(db, cache_key, row["hit_count"])

    ttl_seconds = TTL_SECONDS_BY_QUERY_TYPE[query_type]
    age_seconds = time.time() - row["last_fetched_at"]
    if age_seconds < ttl_seconds:
        return json.loads(row["value_json"])

    if hit_count >= POPULARITY_THRESHOLD and schedule_background_refresh is not None:
        stale_value = json.loads(row["value_json"])
        schedule_background_refresh(
            lambda: _fetch_and_store(db, cache_key, query_type, fetch)
        )
        _touch_last_checked(db, cache_key)
        return stale_value

    return _fetch_and_store(db, cache_key, query_type, fetch)


def _increment_hit_count(db: sqlite3.Connection, cache_key: str, previous_hit_count: int) -> int:
    db.execute(
        "UPDATE cache_entries SET hit_count = hit_count + 1 WHERE cache_key = ?", (cache_key,)
    )
    db.commit()
    return previous_hit_count + 1


def _fetch_and_store(
    db: sqlite3.Connection, cache_key: str, query_type: str, fetch: Callable[[], object]
) -> object:
    value = fetch()
    now = time.time()
    db.execute(
        "INSERT INTO cache_entries "
        "(cache_key, query_type, value_json, hit_count, last_fetched_at, last_checked_at) "
        "VALUES (?, ?, ?, 1, ?, ?) "
        "ON CONFLICT(cache_key) DO UPDATE SET "
        "value_json = excluded.value_json, "
        "last_fetched_at = excluded.last_fetched_at, "
        "last_checked_at = excluded.last_checked_at",
        (cache_key, query_type, json.dumps(value), now, now),
    )
    db.commit()
    return value


def _touch_last_checked(db: sqlite3.Connection, cache_key: str) -> None:
    db.execute(
        "UPDATE cache_entries SET last_checked_at = ? WHERE cache_key = ?",
        (time.time(), cache_key),
    )
    db.commit()
