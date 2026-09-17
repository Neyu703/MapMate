import httpx

from app.clients import transit


def test_parse_journeys_response_extracts_legs():
    raw = {
        "journeys": [
            {
                "legs": [
                    {
                        "walking": True,
                        "departure": "2026-01-01T10:00:00+01:00",
                        "arrival": "2026-01-01T10:05:00+01:00",
                        "origin": {"name": "Start"},
                        "destination": {"name": "Haltestelle X"},
                    },
                    {
                        "walking": False,
                        "line": {"name": "Tram 4", "mode": "tram"},
                        "departure": "2026-01-01T10:07:00+01:00",
                        "arrival": "2026-01-01T10:15:00+01:00",
                        "origin": {"name": "Haltestelle X"},
                        "destination": {"name": "Ziel"},
                        "departurePlatform": "A",
                        "arrivalPlatform": "2",
                    },
                ]
            }
        ]
    }
    parsed = transit.parse_journeys_response(raw)
    assert len(parsed) == 1
    legs = parsed[0]["legs"]
    assert legs[0]["mode"] == "walking"
    assert legs[0]["departure_platform"] is None
    assert legs[1]["mode"] == "tram"
    assert legs[1]["line_name"] == "Tram 4"
    assert legs[1]["departure_platform"] == "A"
    assert legs[1]["arrival_platform"] == "2"


def test_parse_journeys_response_handles_no_journeys():
    assert transit.parse_journeys_response({"journeys": []}) == []


def test_parse_journeys_response_defaults_missing_platforms_to_none():
    raw = {
        "journeys": [
            {
                "legs": [
                    {
                        "walking": True,
                        "departure": "2026-01-01T10:00:00+01:00",
                        "arrival": "2026-01-01T10:05:00+01:00",
                        "origin": {"name": "Start"},
                        "destination": {"name": "Ziel"},
                    }
                ]
            }
        ]
    }
    leg = transit.parse_journeys_response(raw)[0]["legs"][0]
    assert leg["departure_platform"] is None
    assert leg["arrival_platform"] is None


def test_get_journeys_sends_coordinates_as_query_params():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json={"journeys": []})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    result = transit.get_journeys(51.48, 11.97, 51.49, 11.98, client=client)

    assert captured["params"]["from.latitude"] == "51.48"
    assert captured["params"]["to.longitude"] == "11.98"
    assert result == []


def test_get_journeys_creates_and_closes_its_own_client_by_default(monkeypatch):
    close_calls = []

    class TrackingClient(httpx.Client):
        def close(self):
            close_calls.append(True)
            super().close()

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"journeys": []})

    monkeypatch.setattr(
        transit.httpx,
        "Client",
        lambda *args, **kwargs: TrackingClient(transport=httpx.MockTransport(handler)),
    )
    transit.get_journeys(0, 0, 1, 1)

    assert close_calls == [True]
