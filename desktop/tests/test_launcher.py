import socket

import pytest

import launcher


def test_find_free_port_returns_a_bindable_port():
    port = launcher.find_free_port()
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", port))


def test_wait_for_health_returns_false_quickly_when_nothing_is_listening():
    port = launcher.find_free_port()
    assert launcher.wait_for_health(f"http://127.0.0.1:{port}", timeout_seconds=0.5) is False


def test_start_backend_in_thread_serves_health_endpoint():
    port = launcher.find_free_port()
    server = launcher.start_backend_in_thread(port)
    try:
        assert launcher.wait_for_health(f"http://127.0.0.1:{port}") is True
    finally:
        server.should_exit = True


def test_main_opens_webview_window_when_backend_becomes_healthy(monkeypatch):
    fake_server = type("FakeServer", (), {"should_exit": False})()
    webview_calls = []

    monkeypatch.setattr(launcher, "find_free_port", lambda: 12345)
    monkeypatch.setattr(launcher, "start_backend_in_thread", lambda port: fake_server)
    monkeypatch.setattr(launcher, "wait_for_health", lambda base_url, **kwargs: True)
    monkeypatch.setattr(
        launcher.webview, "create_window", lambda title, url: webview_calls.append((title, url))
    )
    monkeypatch.setattr(launcher.webview, "start", lambda: webview_calls.append("started"))

    launcher.main()

    assert webview_calls == [("MapMate", "http://127.0.0.1:12345"), "started"]
    assert fake_server.should_exit is True


def test_main_shuts_down_backend_and_raises_when_health_check_fails(monkeypatch):
    fake_server = type("FakeServer", (), {"should_exit": False})()

    monkeypatch.setattr(launcher, "find_free_port", lambda: 12345)
    monkeypatch.setattr(launcher, "start_backend_in_thread", lambda port: fake_server)
    monkeypatch.setattr(launcher, "wait_for_health", lambda base_url, **kwargs: False)

    with pytest.raises(RuntimeError):
        launcher.main()

    assert fake_server.should_exit is True
