from app.clients import transit_lines


def test_search_transit_lines_returns_parsed_lines(client, monkeypatch):
    monkeypatch.setattr(
        transit_lines,
        "search_transit_lines",
        lambda *a, **k: [{"id": 1, "ref": "9", "name": None, "route_type": "tram", "color": "#ff0000", "segments": []}],
    )
    response = client.get("/api/transit-lines", params={"lat": 51.48, "lon": 11.97, "radius": 1000})
    assert response.status_code == 200
    assert response.json()[0]["ref"] == "9"


def test_search_transit_lines_result_is_cached_across_requests(client, monkeypatch):
    calls = {"count": 0}

    def fake_search(lat, lon, radius):
        calls["count"] += 1
        return []

    monkeypatch.setattr(transit_lines, "search_transit_lines", fake_search)
    params = {"lat": 51.48, "lon": 11.97, "radius": 1000}
    client.get("/api/transit-lines", params=params)
    client.get("/api/transit-lines", params=params)
    assert calls["count"] == 1
