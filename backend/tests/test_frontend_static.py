import sys

from app.main import create_app, get_default_frontend_dist


def test_get_default_frontend_dist_uses_meipass_when_frozen(monkeypatch, tmp_path):
    monkeypatch.setattr(sys, "frozen", True, raising=False)
    monkeypatch.setattr(sys, "_MEIPASS", str(tmp_path), raising=False)
    assert get_default_frontend_dist() == tmp_path / "frontend_dist"


def test_get_default_frontend_dist_uses_repo_relative_path_when_not_frozen(monkeypatch):
    monkeypatch.setattr(sys, "frozen", False, raising=False)
    result = get_default_frontend_dist()
    assert result.name == "dist"
    assert result.parent.name == "frontend"


def test_create_app_serves_built_frontend_when_present(tmp_path):
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    (dist_dir / "index.html").write_text("<html>MapMate</html>")

    app = create_app(
        db_path=tmp_path / "test.db", log_dir=tmp_path / "logs", frontend_dist=dist_dir
    )
    from fastapi.testclient import TestClient

    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert "MapMate" in response.text


def test_create_app_skips_static_mount_when_frontend_not_built(tmp_path):
    app = create_app(
        db_path=tmp_path / "test.db",
        log_dir=tmp_path / "logs",
        frontend_dist=tmp_path / "does-not-exist",
    )
    from fastapi.testclient import TestClient

    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 404
