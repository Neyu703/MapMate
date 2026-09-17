import logging
import sys

from app.logging_setup import get_default_log_dir, install_crash_hook


def test_get_default_log_dir_creates_directory():
    log_dir = get_default_log_dir()
    assert log_dir.is_dir()
    assert log_dir.name == "logs"


def test_crash_hook_logs_unhandled_exception(caplog):
    logger = logging.getLogger("mapmate-test-crash")
    original_hook = sys.excepthook
    try:
        install_crash_hook(logger)
        with caplog.at_level(logging.CRITICAL, logger="mapmate-test-crash"):
            try:
                raise ValueError("boom")
            except ValueError:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                sys.excepthook(exc_type, exc_value, exc_traceback)
        assert "Unhandled exception" in caplog.text
    finally:
        sys.excepthook = original_hook


def test_crash_hook_passes_through_keyboard_interrupt():
    logger = logging.getLogger("mapmate-test-crash-kbi")
    original_hook = sys.excepthook
    passed_through = {}

    def fake_default_hook(exc_type, exc_value, exc_traceback):
        passed_through["called"] = True

    sys.__excepthook__ = fake_default_hook
    try:
        install_crash_hook(logger)
        try:
            raise KeyboardInterrupt()
        except KeyboardInterrupt:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            sys.excepthook(exc_type, exc_value, exc_traceback)
        assert passed_through.get("called") is True
    finally:
        sys.excepthook = original_hook
