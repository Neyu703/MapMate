from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware import RequestLoggingMiddleware


def build_failing_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(RequestLoggingMiddleware)

    @app.get("/boom")
    def boom():
        raise RuntimeError("kaboom")

    return app


def test_middleware_converts_unhandled_exception_to_500(caplog):
    app = build_failing_app()
    client = TestClient(app, raise_server_exceptions=False)
    with caplog.at_level("ERROR", logger="mapmate"):
        response = client.get("/boom")
    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error"}
    assert "Unhandled error" in caplog.text
