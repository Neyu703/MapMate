import pytest
import httpx

from app.clients import osrm


def test_parse_route_response_extracts_distance_and_geometry():
    raw = {
        "code": "Ok",
        "routes": [
            {
                "distance": 850.5,
                "duration": 620.0,
                "geometry": {"coordinates": [[11.97, 51.48], [11.98, 51.49]]},
            }
        ],
    }
    parsed = osrm.parse_route_response(raw)
    assert parsed["distance_meters"] == 850.5
    assert parsed["geometry"] == [[11.97, 51.48], [11.98, 51.49]]


def test_parse_route_response_recomputes_duration_from_distance():
    # OSRM's public demo reports car-speed durations even for /foot/ routes (see
    # osrm.py), so duration must come from distance / walking speed, not route["duration"].
    raw = {
        "code": "Ok",
        "routes": [{"distance": 1000.0, "duration": 60.0, "geometry": {"coordinates": []}}],
    }
    parsed = osrm.parse_route_response(raw)
    assert parsed["duration_seconds"] == pytest.approx(720.0)


def test_parse_route_response_raises_when_no_route_found():
    with pytest.raises(ValueError):
        osrm.parse_route_response({"code": "NoRoute", "routes": []})


def test_get_walking_route_builds_expected_url_and_parses_result():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        return httpx.Response(
            200,
            json={
                "code": "Ok",
                "routes": [
                    {"distance": 100.0, "duration": 90.0, "geometry": {"coordinates": []}}
                ],
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    result = osrm.get_walking_route(51.48, 11.97, 51.49, 11.98, client=client)

    assert "11.97,51.48;11.98,51.49" in captured["url"]
    assert result["distance_meters"] == 100.0


def test_get_walking_route_creates_and_closes_its_own_client_by_default(monkeypatch):
    close_calls = []

    class TrackingClient(httpx.Client):
        def close(self):
            close_calls.append(True)
            super().close()

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, json={"code": "Ok", "routes": [{"distance": 1.0, "duration": 1.0, "geometry": {"coordinates": []}}]}
        )

    monkeypatch.setattr(
        osrm.httpx,
        "Client",
        lambda *args, **kwargs: TrackingClient(transport=httpx.MockTransport(handler)),
    )
    osrm.get_walking_route(0, 0, 1, 1)

    assert close_calls == [True]
