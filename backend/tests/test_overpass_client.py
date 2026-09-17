import httpx

from app.clients import overpass


def test_build_query_includes_tag_and_radius_for_each_category():
    query = overpass.build_query(51.48, 11.97, 1500, ["supermarket", "tram_stop"])
    assert '["shop"="supermarket"]' in query
    assert '["railway"="tram_stop"]' in query
    assert "around:1500,51.48,11.97" in query


def test_build_query_ignores_unknown_category():
    query = overpass.build_query(0, 0, 500, ["unknown_category"])
    assert query.count("node[") == 0


def test_haversine_distance_zero_for_identical_points():
    assert overpass.haversine_distance_meters(51.48, 11.97, 51.48, 11.97) == 0


def test_haversine_distance_is_positive_for_different_points():
    distance = overpass.haversine_distance_meters(51.48, 11.97, 51.50, 11.99)
    assert distance > 0


def test_category_for_tags_matches_known_tag():
    assert overpass.category_for_tags({"shop": "supermarket"}) == "supermarket"


def test_category_for_tags_returns_none_for_unmatched_tags():
    assert overpass.category_for_tags({"shop": "bakery"}) is None


def test_parse_overpass_response_sorts_by_distance_and_skips_nodes_without_coordinates():
    raw = {
        "elements": [
            {"id": 1, "tags": {"shop": "supermarket", "name": "Weit weg"}, "lat": 52.0, "lon": 12.0},
            {"id": 2, "tags": {"shop": "supermarket", "name": "Nah"}, "lat": 51.481, "lon": 11.971},
            {"id": 3, "tags": {"shop": "supermarket"}},
        ]
    }
    pois = overpass.parse_overpass_response(raw, 51.48, 11.97)
    assert [poi["id"] for poi in pois] == [2, 1]
    assert pois[0]["name"] == "Nah"
    assert pois[1]["category"] == "supermarket"


def test_parse_overpass_response_defaults_missing_name():
    raw = {"elements": [{"id": 1, "tags": {"shop": "supermarket"}, "lat": 51.48, "lon": 11.97}]}
    pois = overpass.parse_overpass_response(raw, 51.48, 11.97)
    assert pois[0]["name"] == "(ohne Namen)"


def test_parse_overpass_response_includes_opening_hours_contact_and_address():
    raw = {
        "elements": [
            {
                "id": 1,
                "tags": {
                    "shop": "supermarket",
                    "name": "EDEKA",
                    "opening_hours": "Mo-Sa 07:00-22:00",
                    "contact:phone": "+49 345 1234567",
                    "contact:website": "https://edeka.de",
                    "addr:street": "Marktplatz",
                    "addr:housenumber": "1",
                    "addr:postcode": "06108",
                    "addr:city": "Halle (Saale)",
                },
                "lat": 51.48,
                "lon": 11.97,
            }
        ]
    }
    poi = overpass.parse_overpass_response(raw, 51.48, 11.97)[0]
    assert poi["opening_hours"] == "Mo-Sa 07:00-22:00"
    assert poi["phone"] == "+49 345 1234567"
    assert poi["website"] == "https://edeka.de"
    assert poi["address"] == "Marktplatz 1, 06108 Halle (Saale)"


def test_parse_overpass_response_falls_back_to_plain_phone_and_website_tags():
    raw = {
        "elements": [
            {
                "id": 1,
                "tags": {"shop": "supermarket", "phone": "030 123", "website": "https://x.de"},
                "lat": 51.48,
                "lon": 11.97,
            }
        ]
    }
    poi = overpass.parse_overpass_response(raw, 51.48, 11.97)[0]
    assert poi["phone"] == "030 123"
    assert poi["website"] == "https://x.de"


def test_parse_overpass_response_leaves_optional_fields_none_when_missing():
    raw = {"elements": [{"id": 1, "tags": {"shop": "supermarket"}, "lat": 51.48, "lon": 11.97}]}
    poi = overpass.parse_overpass_response(raw, 51.48, 11.97)[0]
    assert poi["opening_hours"] is None
    assert poi["phone"] is None
    assert poi["website"] is None
    assert poi["address"] is None


def test_build_address_combines_available_parts():
    assert (
        overpass.build_address(
            {"addr:street": "Marktplatz", "addr:housenumber": "1", "addr:city": "Halle"}
        )
        == "Marktplatz 1, Halle"
    )


def test_build_address_returns_none_when_no_address_tags():
    assert overpass.build_address({}) is None


def test_build_address_handles_only_street_without_housenumber():
    assert overpass.build_address({"addr:street": "Marktplatz"}) == "Marktplatz"


def test_search_pois_posts_query_and_parses_response():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = request.content.decode()
        captured["user_agent"] = request.headers.get("user-agent")
        return httpx.Response(
            200,
            json={"elements": [{"id": 1, "tags": {"shop": "supermarket"}, "lat": 51.48, "lon": 11.97}]},
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    result = overpass.search_pois(51.48, 11.97, 1000, ["supermarket"], client=client)

    assert "supermarket" in captured["body"]
    assert result[0]["id"] == 1


def test_search_pois_sends_identifying_user_agent():
    # Overpass API's front-end proxy rejects requests without a recognizable
    # User-Agent with a 406, so this header is required, not just polite.
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["user_agent"] = request.headers.get("user-agent")
        return httpx.Response(200, json={"elements": []})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    overpass.search_pois(51.48, 11.97, 1000, ["supermarket"], client=client)

    assert captured["user_agent"] == overpass.USER_AGENT


def test_search_pois_creates_and_closes_its_own_client_by_default(monkeypatch):
    close_calls = []

    class TrackingClient(httpx.Client):
        def close(self):
            close_calls.append(True)
            super().close()

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"elements": []})

    monkeypatch.setattr(
        overpass.httpx,
        "Client",
        lambda *args, **kwargs: TrackingClient(transport=httpx.MockTransport(handler)),
    )
    overpass.search_pois(0, 0, 500, ["gym"])

    assert close_calls == [True]
