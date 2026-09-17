def create_marker(client, profile_id, name, lat=0.0, lon=0.0):
    return client.post(
        f"/api/markers?profile_id={profile_id}",
        json={"name": name, "lat": lat, "lon": lon},
    ).json()


def test_create_and_list_link(client, default_profile_id):
    marker_a = create_marker(client, default_profile_id, "Zuhause")
    marker_b = create_marker(client, default_profile_id, "Arbeit")

    response = client.post(
        "/api/links", json={"marker_a_id": marker_a["id"], "marker_b_id": marker_b["id"]}
    )
    assert response.status_code == 201
    link = response.json()
    assert link["profile_id"] == default_profile_id

    listed = client.get(f"/api/links?profile_id={default_profile_id}").json()
    assert len(listed) == 1
    assert listed[0]["id"] == link["id"]


def test_link_to_self_is_rejected(client, default_profile_id):
    marker = create_marker(client, default_profile_id, "Solo")
    response = client.post(
        "/api/links", json={"marker_a_id": marker["id"], "marker_b_id": marker["id"]}
    )
    assert response.status_code == 400


def test_link_across_profiles_is_rejected(client, default_profile_id):
    other_profile = client.post("/api/profiles", json={"name": "Andere Stadt"}).json()
    marker_a = create_marker(client, default_profile_id, "Hier")
    marker_b = create_marker(client, other_profile["id"], "Dort")

    response = client.post(
        "/api/links", json={"marker_a_id": marker_a["id"], "marker_b_id": marker_b["id"]}
    )
    assert response.status_code == 400


def test_link_with_missing_marker_returns_404(client, default_profile_id):
    marker = create_marker(client, default_profile_id, "Solo")
    response = client.post(
        "/api/links", json={"marker_a_id": marker["id"], "marker_b_id": 999}
    )
    assert response.status_code == 404


def test_duplicate_link_is_rejected(client, default_profile_id):
    marker_a = create_marker(client, default_profile_id, "A")
    marker_b = create_marker(client, default_profile_id, "B")
    client.post("/api/links", json={"marker_a_id": marker_a["id"], "marker_b_id": marker_b["id"]})

    response = client.post(
        "/api/links", json={"marker_a_id": marker_a["id"], "marker_b_id": marker_b["id"]}
    )
    assert response.status_code == 409


def test_delete_link(client, default_profile_id):
    marker_a = create_marker(client, default_profile_id, "A")
    marker_b = create_marker(client, default_profile_id, "B")
    link = client.post(
        "/api/links", json={"marker_a_id": marker_a["id"], "marker_b_id": marker_b["id"]}
    ).json()

    response = client.delete(f"/api/links/{link['id']}")
    assert response.status_code == 204
    remaining = client.get(f"/api/links?profile_id={default_profile_id}").json()
    assert remaining == []


def test_delete_missing_link_returns_404(client):
    response = client.delete("/api/links/999")
    assert response.status_code == 404
