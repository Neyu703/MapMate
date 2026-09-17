from app.clients import overpass


def test_search_poi_without_profile_uses_given_radius(client, monkeypatch):
    calls = []
    monkeypatch.setattr(
        overpass,
        "search_pois",
        lambda lat, lon, radius, categories: calls.append((lat, lon, radius, categories)) or [],
    )
    response = client.get(
        "/api/poi",
        params={"lat": 51.48, "lon": 11.97, "radius": 1500, "categories": "supermarket,gym"},
    )
    assert response.status_code == 200
    assert calls == [(51.48, 11.97, 1500.0, ["supermarket", "gym"])]


def test_search_poi_radius_capped_by_profile_radius(client, monkeypatch):
    profile = client.post(
        "/api/profiles",
        json={"name": "Halle (Saale)", "center_lat": 51.48, "center_lon": 11.97, "radius_km": 1},
    ).json()
    calls = []
    monkeypatch.setattr(
        overpass,
        "search_pois",
        lambda lat, lon, radius, categories: calls.append(radius) or [],
    )
    client.get(
        "/api/poi",
        params={
            "lat": 51.48,
            "lon": 11.97,
            "radius": 5000,
            "categories": "supermarket",
            "profile_id": profile["id"],
        },
    )
    assert calls == [1000.0]


def test_search_poi_radius_not_capped_when_below_profile_radius(client, monkeypatch):
    profile = client.post(
        "/api/profiles",
        json={"name": "Halle (Saale)", "center_lat": 51.48, "center_lon": 11.97, "radius_km": 10},
    ).json()
    calls = []
    monkeypatch.setattr(
        overpass, "search_pois", lambda lat, lon, radius, categories: calls.append(radius) or []
    )
    client.get(
        "/api/poi",
        params={
            "lat": 51.48,
            "lon": 11.97,
            "radius": 500,
            "categories": "gym",
            "profile_id": profile["id"],
        },
    )
    assert calls == [500.0]


def test_search_poi_radius_unaffected_by_profile_without_radius(client, default_profile_id, monkeypatch):
    calls = []
    monkeypatch.setattr(
        overpass, "search_pois", lambda lat, lon, radius, categories: calls.append(radius) or []
    )
    client.get(
        "/api/poi",
        params={
            "lat": 51.48,
            "lon": 11.97,
            "radius": 500,
            "categories": "gym",
            "profile_id": default_profile_id,
        },
    )
    assert calls == [500.0]


def test_search_poi_with_unknown_profile_returns_404(client):
    response = client.get(
        "/api/poi",
        params={"lat": 0, "lon": 0, "radius": 500, "categories": "gym", "profile_id": 999},
    )
    assert response.status_code == 404


def test_search_poi_result_is_cached_across_requests(client, monkeypatch):
    calls = {"count": 0}

    def fake_search(lat, lon, radius, categories):
        calls["count"] += 1
        return []

    monkeypatch.setattr(overpass, "search_pois", fake_search)
    params = {"lat": 51.48, "lon": 11.97, "radius": 1000, "categories": "gym"}
    client.get("/api/poi", params=params)
    client.get("/api/poi", params=params)
    assert calls["count"] == 1
