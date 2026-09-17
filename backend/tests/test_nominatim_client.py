import httpx

from app.clients import nominatim


def test_build_viewbox_returns_box_around_center():
    left, top, right, bottom = nominatim.build_viewbox(51.48, 11.97, 10)
    assert left < 11.97 < right
    assert bottom < 51.48 < top


def test_parse_search_response_extracts_fields():
    raw = [{"display_name": "Halle (Saale), Deutschland", "lat": "51.48", "lon": "11.97"}]
    parsed = nominatim.parse_search_response(raw)
    assert parsed == [{"display_name": "Halle (Saale), Deutschland", "lat": 51.48, "lon": 11.97}]


def test_search_address_without_restriction_omits_viewbox():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=[{"display_name": "X", "lat": "1.0", "lon": "2.0"}])

    client = httpx.Client(transport=httpx.MockTransport(handler))
    result = nominatim.search_address("Halle", client=client)

    assert "viewbox" not in captured["params"]
    assert result == [{"display_name": "X", "lat": 1.0, "lon": 2.0}]


def test_search_address_with_restriction_adds_viewbox():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=[])

    client = httpx.Client(transport=httpx.MockTransport(handler))
    nominatim.search_address("Halle", center_lat=51.48, center_lon=11.97, radius_km=5, client=client)

    assert captured["params"]["bounded"] == "1"
    assert "viewbox" in captured["params"]


def test_search_address_creates_and_closes_its_own_client_by_default(monkeypatch):
    close_calls = []

    class TrackingClient(httpx.Client):
        def close(self):
            close_calls.append(True)
            super().close()

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[])

    monkeypatch.setattr(
        nominatim.httpx,
        "Client",
        lambda *args, **kwargs: TrackingClient(transport=httpx.MockTransport(handler)),
    )
    nominatim.search_address("Halle")

    assert close_calls == [True]
