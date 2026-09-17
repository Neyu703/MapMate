def test_default_profile_created_on_startup(client):
    response = client.get("/api/profiles")
    assert response.status_code == 200
    profiles = response.json()
    assert len(profiles) == 1
    assert profiles[0]["name"] == "Standard"
    assert profiles[0]["is_default"] is True
    assert profiles[0]["radius_km"] is None


def test_create_profile_with_radius(client):
    response = client.post(
        "/api/profiles",
        json={"name": "Halle (Saale)", "center_lat": 51.48, "center_lon": 11.97, "radius_km": 8},
    )
    assert response.status_code == 201
    profile = response.json()
    assert profile["name"] == "Halle (Saale)"
    assert profile["radius_km"] == 8
    assert profile["is_default"] is False


def test_update_profile_renames_it(client, default_profile_id):
    response = client.put(f"/api/profiles/{default_profile_id}", json={"name": "Zuhause"})
    assert response.status_code == 200
    assert response.json()["name"] == "Zuhause"


def test_update_missing_profile_returns_404(client):
    response = client.put("/api/profiles/999", json={"name": "X"})
    assert response.status_code == 404


def test_delete_last_profile_is_rejected(client, default_profile_id):
    response = client.delete(f"/api/profiles/{default_profile_id}")
    assert response.status_code == 400


def test_delete_non_default_profile_succeeds(client, default_profile_id):
    created = client.post("/api/profiles", json={"name": "Zweitprofil"}).json()
    response = client.delete(f"/api/profiles/{created['id']}")
    assert response.status_code == 204
    remaining = client.get("/api/profiles").json()
    assert len(remaining) == 1
    assert remaining[0]["id"] == default_profile_id


def test_delete_missing_profile_returns_404(client):
    response = client.delete("/api/profiles/999")
    assert response.status_code == 404
