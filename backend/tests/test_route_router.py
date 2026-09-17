from app.clients import osrm, transit


def test_route_walk_returns_parsed_route(client, monkeypatch):
    monkeypatch.setattr(
        osrm,
        "get_walking_route",
        lambda *a, **k: {"distance_meters": 500.0, "duration_seconds": 400.0, "geometry": []},
    )
    response = client.get(
        "/api/route/walk",
        params={"from_lat": 51.48, "from_lon": 11.97, "to_lat": 51.49, "to_lon": 11.98},
    )
    assert response.status_code == 200
    assert response.json()["distance_meters"] == 500.0


def test_route_walk_result_is_cached_across_requests(client, monkeypatch):
    calls = {"count": 0}

    def fake_route(*args, **kwargs):
        calls["count"] += 1
        return {"distance_meters": 1.0, "duration_seconds": 1.0, "geometry": []}

    monkeypatch.setattr(osrm, "get_walking_route", fake_route)
    params = {"from_lat": 51.48, "from_lon": 11.97, "to_lat": 51.49, "to_lon": 11.98}
    client.get("/api/route/walk", params=params)
    client.get("/api/route/walk", params=params)
    assert calls["count"] == 1


def test_route_transit_is_never_cached_and_always_calls_client(client, monkeypatch):
    calls = {"count": 0}

    def fake_journeys(*args, **kwargs):
        calls["count"] += 1
        return [{"legs": []}]

    monkeypatch.setattr(transit, "get_journeys", fake_journeys)
    params = {"from_lat": 51.48, "from_lon": 11.97, "to_lat": 51.49, "to_lon": 11.98}
    client.get("/api/route/transit", params=params)
    response = client.get("/api/route/transit", params=params)

    assert response.status_code == 200
    assert response.json() == [{"legs": []}]
    assert calls["count"] == 2
