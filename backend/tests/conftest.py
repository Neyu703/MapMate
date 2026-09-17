import pytest
from fastapi.testclient import TestClient

from app import db as db_module
from app.main import create_app


@pytest.fixture
def db_connection(tmp_path):
    connection = db_module.connect(tmp_path / "cache_test.db")
    db_module.init_schema(connection)
    yield connection
    connection.close()


@pytest.fixture
def client(tmp_path):
    db_path = tmp_path / "test.db"
    log_dir = tmp_path / "logs"
    app = create_app(db_path=db_path, log_dir=log_dir)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def default_profile_id(client):
    profiles = client.get("/api/profiles").json()
    return profiles[0]["id"]
