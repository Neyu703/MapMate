from app.clients import nominatim


def test_geocode_without_profile_returns_results(client, monkeypatch):
    monkeypatch.setattr(
        nominatim, "search_address", lambda *a, **k: [{"display_name": "X", "lat": 1.0, "lon": 2.0}]
    )
    response = client.get("/api/geocode", params={"q": "Halle"})
    assert response.status_code == 200
    assert response.json() == [{"display_name": "X", "lat": 1.0, "lon": 2.0}]


def test_geocode_with_unrestricted_profile_ignores_restriction(client, default_profile_id, monkeypatch):
    calls = []
    monkeypatch.setattr(
        nominatim,
        "search_address",
        lambda q, center_lat=None, center_lon=None, radius_km=None: calls.append(
            (center_lat, center_lon, radius_km)
        )
        or [],
    )
    response = client.get("/api/geocode", params={"q": "Halle", "profile_id": default_profile_id})
    assert response.status_code == 200
    assert calls == [(None, None, None)]


def test_geocode_with_restricted_profile_passes_restriction(client, monkeypatch):
    profile = client.post(
        "/api/profiles",
        json={"name": "Halle (Saale)", "center_lat": 51.48, "center_lon": 11.97, "radius_km": 8},
    ).json()
    calls = []
    monkeypatch.setattr(
        nominatim,
        "search_address",
        lambda q, center_lat=None, center_lon=None, radius_km=None: calls.append(
            (center_lat, center_lon, radius_km)
        )
        or [],
    )
    response = client.get("/api/geocode", params={"q": "Markt", "profile_id": profile["id"]})
    assert response.status_code == 200
    assert calls == [(51.48, 11.97, 8)]


def test_geocode_with_unknown_profile_returns_404(client):
    response = client.get("/api/geocode", params={"q": "Halle", "profile_id": 999})
    assert response.status_code == 404


def test_geocode_result_is_cached_across_requests(client, monkeypatch):
    calls = {"count": 0}

    def fake_search(*args, **kwargs):
        calls["count"] += 1
        return []

    monkeypatch.setattr(nominatim, "search_address", fake_search)
    client.get("/api/geocode", params={"q": "Halle"})
    client.get("/api/geocode", params={"q": "Halle"})
    assert calls["count"] == 1
