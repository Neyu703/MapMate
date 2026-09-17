import httpx

from app.clients import transit_lines


def test_build_query_includes_route_types_and_radius():
    query = transit_lines.build_query(51.48, 11.97, 1200)
    assert "route\"~\"^(bus|tram|light_rail|train|subway)$\"" in query
    assert "around:1200,51.48,11.97" in query


def test_fallback_color_for_ref_is_deterministic_across_calls():
    first = transit_lines.fallback_color_for_ref("9")
    second = transit_lines.fallback_color_for_ref("9")
    assert first == second
    assert first in transit_lines.FALLBACK_COLORS


def test_parse_transit_lines_response_extracts_segments_and_uses_colour_tag():
    raw = {
        "elements": [
            {
                "type": "relation",
                "id": 1,
                "tags": {"route": "tram", "ref": "9", "name": "Tram 9", "colour": "#ff0000"},
                "members": [
                    {
                        "type": "way",
                        "geometry": [{"lat": 51.48, "lon": 11.97}, {"lat": 51.49, "lon": 11.98}],
                    }
                ],
            }
        ]
    }
    lines = transit_lines.parse_transit_lines_response(raw)
    assert lines == [
        {
            "id": 1,
            "ref": "9",
            "name": "Tram 9",
            "route_type": "tram",
            "mode": "tram",
            "color": "#ff0000",
            "segments": [[[51.48, 11.97], [51.49, 11.98]]],
        }
    ]


def test_parse_transit_lines_response_maps_train_and_subway_to_bahn_mode():
    for route_type in ("train", "subway"):
        raw = {
            "elements": [
                {
                    "type": "relation",
                    "id": 9,
                    "tags": {"route": route_type, "ref": "S1"},
                    "members": [{"type": "way", "geometry": [{"lat": 0, "lon": 0}]}],
                }
            ]
        }
        assert transit_lines.parse_transit_lines_response(raw)[0]["mode"] == "bahn"


def test_parse_transit_lines_response_maps_bus_to_bus_mode():
    raw = {
        "elements": [
            {
                "type": "relation",
                "id": 10,
                "tags": {"route": "bus", "ref": "21"},
                "members": [{"type": "way", "geometry": [{"lat": 0, "lon": 0}]}],
            }
        ]
    }
    assert transit_lines.parse_transit_lines_response(raw)[0]["mode"] == "bus"


def test_parse_transit_lines_response_falls_back_to_generated_color_without_colour_tag():
    raw = {
        "elements": [
            {
                "type": "relation",
                "id": 2,
                "tags": {"route": "bus", "ref": "21"},
                "members": [{"type": "way", "geometry": [{"lat": 0, "lon": 0}, {"lat": 1, "lon": 1}]}],
            }
        ]
    }
    lines = transit_lines.parse_transit_lines_response(raw)
    assert lines[0]["color"] == transit_lines.fallback_color_for_ref("21")


def test_parse_transit_lines_response_skips_relations_without_way_geometry():
    raw = {
        "elements": [
            {"type": "relation", "id": 3, "tags": {"route": "bus", "ref": "1"}, "members": []},
            {"type": "node", "id": 4, "tags": {}},
        ]
    }
    assert transit_lines.parse_transit_lines_response(raw) == []


def test_parse_transit_lines_response_defaults_missing_ref():
    raw = {
        "elements": [
            {
                "type": "relation",
                "id": 5,
                "tags": {"route": "tram"},
                "members": [{"type": "way", "geometry": [{"lat": 0, "lon": 0}]}],
            }
        ]
    }
    assert transit_lines.parse_transit_lines_response(raw)[0]["ref"] == "?"


def test_search_transit_lines_posts_query_and_parses_response():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = request.content.decode()
        captured["user_agent"] = request.headers.get("user-agent")
        return httpx.Response(200, json={"elements": []})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    result = transit_lines.search_transit_lines(51.48, 11.97, 1000, client=client)

    assert "route" in captured["body"]
    assert captured["user_agent"] == transit_lines.USER_AGENT
    assert result == []


def test_search_transit_lines_creates_and_closes_its_own_client_by_default(monkeypatch):
    close_calls = []

    class TrackingClient(httpx.Client):
        def close(self):
            close_calls.append(True)
            super().close()

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"elements": []})

    monkeypatch.setattr(
        transit_lines.httpx,
        "Client",
        lambda *args, **kwargs: TrackingClient(transport=httpx.MockTransport(handler)),
    )
    transit_lines.search_transit_lines(0, 0, 500)

    assert close_calls == [True]
