def test_create_and_list_marker(client, default_profile_id):
    response = client.post(
        f"/api/markers?profile_id={default_profile_id}",
        json={"name": "Supermarkt XY", "lat": 51.48, "lon": 11.97, "category": "supermarket"},
    )
    assert response.status_code == 201
    marker = response.json()
    assert marker["name"] == "Supermarkt XY"
    assert marker["profile_id"] == default_profile_id
    assert marker["color"] == "#3388ff"

    listed = client.get(f"/api/markers?profile_id={default_profile_id}").json()
    assert len(listed) == 1
    assert listed[0]["id"] == marker["id"]


def test_create_marker_for_missing_profile_returns_404(client):
    response = client.post(
        "/api/markers?profile_id=999",
        json={"name": "X", "lat": 0, "lon": 0},
    )
    assert response.status_code == 404


def test_markers_are_scoped_to_their_profile(client, default_profile_id):
    other_profile = client.post("/api/profiles", json={"name": "Andere Stadt"}).json()
    client.post(
        f"/api/markers?profile_id={default_profile_id}",
        json={"name": "Zuhause", "lat": 51.0, "lon": 11.0},
    )
    client.post(
        f"/api/markers?profile_id={other_profile['id']}",
        json={"name": "Woanders", "lat": 40.0, "lon": -74.0},
    )

    default_markers = client.get(f"/api/markers?profile_id={default_profile_id}").json()
    other_markers = client.get(f"/api/markers?profile_id={other_profile['id']}").json()
    assert [marker["name"] for marker in default_markers] == ["Zuhause"]
    assert [marker["name"] for marker in other_markers] == ["Woanders"]


def test_update_marker(client, default_profile_id):
    created = client.post(
        f"/api/markers?profile_id={default_profile_id}",
        json={"name": "Alt", "lat": 1.0, "lon": 2.0},
    ).json()
    response = client.put(f"/api/markers/{created['id']}", json={"name": "Neu"})
    assert response.status_code == 200
    assert response.json()["name"] == "Neu"


def test_update_missing_marker_returns_404(client):
    response = client.put("/api/markers/999", json={"name": "X"})
    assert response.status_code == 404


def test_delete_marker(client, default_profile_id):
    created = client.post(
        f"/api/markers?profile_id={default_profile_id}",
        json={"name": "Zu löschen", "lat": 1.0, "lon": 2.0},
    ).json()
    response = client.delete(f"/api/markers/{created['id']}")
    assert response.status_code == 204
    remaining = client.get(f"/api/markers?profile_id={default_profile_id}").json()
    assert remaining == []


def test_delete_missing_marker_returns_404(client):
    response = client.delete("/api/markers/999")
    assert response.status_code == 404


def test_deleting_profile_cascades_to_its_markers(client, default_profile_id):
    other_profile = client.post("/api/profiles", json={"name": "Löschbar"}).json()
    marker = client.post(
        f"/api/markers?profile_id={other_profile['id']}",
        json={"name": "Verschwindet", "lat": 1.0, "lon": 2.0},
    ).json()
    client.delete(f"/api/profiles/{other_profile['id']}")
    response = client.put(f"/api/markers/{marker['id']}", json={"name": "X"})
    assert response.status_code == 404
