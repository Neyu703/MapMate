import time

import app.cache as cache_module
from app.cache import get_cached_or_fetch


def make_counting_fetch(return_values):
    calls = {"count": 0}

    def fetch():
        calls["count"] += 1
        return return_values[min(calls["count"] - 1, len(return_values) - 1)]

    return fetch, calls


def test_cache_miss_calls_fetch_and_stores_value(db_connection):
    fetch, calls = make_counting_fetch(["first"])
    result = get_cached_or_fetch(db_connection, "key-a", "geocode", fetch)
    assert result == "first"
    assert calls["count"] == 1


def test_cache_hit_within_ttl_does_not_refetch(db_connection):
    fetch, calls = make_counting_fetch(["first", "second"])
    get_cached_or_fetch(db_connection, "key-b", "geocode", fetch)
    result = get_cached_or_fetch(db_connection, "key-b", "geocode", fetch)
    assert result == "first"
    assert calls["count"] == 1


def test_stale_entry_below_popularity_threshold_refetches_synchronously(db_connection, monkeypatch):
    fetch, calls = make_counting_fetch(["first", "second"])
    get_cached_or_fetch(db_connection, "key-c", "poi", fetch)

    future = time.time() + cache_module.TTL_SECONDS_BY_QUERY_TYPE["poi"] + 1
    monkeypatch.setattr(cache_module.time, "time", lambda: future)

    result = get_cached_or_fetch(db_connection, "key-c", "poi", fetch)
    assert result == "second"
    assert calls["count"] == 2


def test_stale_popular_entry_serves_stale_value_and_schedules_refresh(db_connection, monkeypatch):
    fetch, calls = make_counting_fetch(["v1", "v2"])
    for _ in range(cache_module.POPULARITY_THRESHOLD - 1):
        get_cached_or_fetch(db_connection, "key-d", "route_walk", fetch)
    assert calls["count"] == 1

    future = time.time() + cache_module.TTL_SECONDS_BY_QUERY_TYPE["route_walk"] + 1
    monkeypatch.setattr(cache_module.time, "time", lambda: future)

    scheduled = {}

    def schedule_background_refresh(job):
        scheduled["job"] = job

    result = get_cached_or_fetch(
        db_connection, "key-d", "route_walk", fetch, schedule_background_refresh
    )
    assert result == "v1"
    assert calls["count"] == 1
    assert "job" in scheduled

    scheduled["job"]()
    assert calls["count"] == 2

    fresh_result = get_cached_or_fetch(db_connection, "key-d", "route_walk", fetch)
    assert fresh_result == "v2"
