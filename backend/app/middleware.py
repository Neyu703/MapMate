import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("mapmate")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 1)
            logger.exception(
                "Unhandled error on %s %s after %sms",
                request.method,
                request.url.path,
                duration_ms,
            )
            return JSONResponse(status_code=500, content={"detail": "Internal server error"})

        duration_ms = round((time.perf_counter() - start_time) * 1000, 1)
        logger.info(
            "%s %s -> %s (%sms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response
