import socket
import sys
import threading
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import httpx
import uvicorn
import webview

from app.main import create_app

HEALTH_CHECK_TIMEOUT_SECONDS = 10
HEALTH_CHECK_INTERVAL_SECONDS = 0.2


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def wait_for_health(base_url: str, timeout_seconds: float = HEALTH_CHECK_TIMEOUT_SECONDS) -> bool:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        try:
            response = httpx.get(f"{base_url}/api/health", timeout=1)
            if response.status_code == 200:
                return True
        except httpx.HTTPError:
            pass
        time.sleep(HEALTH_CHECK_INTERVAL_SECONDS)
    return False


def start_backend_in_thread(port: int) -> uvicorn.Server:
    app = create_app()
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    return server


def main() -> None:
    port = find_free_port()
    base_url = f"http://127.0.0.1:{port}"
    server = start_backend_in_thread(port)

    try:
        if not wait_for_health(base_url):
            raise RuntimeError("MapMate backend did not become ready in time")

        webview.create_window("MapMate", base_url)
        webview.start()
    finally:
        server.should_exit = True


if __name__ == "__main__":  # pragma: no cover
    main()
