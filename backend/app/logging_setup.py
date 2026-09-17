import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from platformdirs import user_data_dir

from app.db import APP_NAME

LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s %(message)s"
MAX_LOG_BYTES = 5_000_000
BACKUP_COUNT = 10


def get_default_log_dir() -> Path:
    log_dir = Path(user_data_dir(APP_NAME, appauthor=False)) / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def configure_logging(log_dir: Path) -> logging.Logger:
    log_dir.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger("mapmate")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    file_handler = RotatingFileHandler(
        log_dir / "mapmate.log",
        maxBytes=MAX_LOG_BYTES,
        backupCount=BACKUP_COUNT,
        encoding="utf-8",
    )
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT))
    logger.addHandler(file_handler)

    install_crash_hook(logger)
    return logger


def install_crash_hook(logger: logging.Logger) -> None:
    def log_unhandled_exception(exc_type, exc_value, exc_traceback):
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        logger.critical(
            "Unhandled exception, process is about to exit",
            exc_info=(exc_type, exc_value, exc_traceback),
        )
        sys.__excepthook__(exc_type, exc_value, exc_traceback)

    sys.excepthook = log_unhandled_exception
