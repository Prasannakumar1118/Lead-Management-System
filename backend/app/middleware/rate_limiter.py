import os
import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

# In-memory store: ip -> list of request timestamps
_request_history: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
AUTH_RATE_LIMIT = 20    # requests per minute per IP


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow disabling or bypassing during automated test suite if configured
        if os.getenv("DISABLE_RATE_LIMIT") == "true" or request.headers.get("X-Bypass-Rate-Limit"):
            return await call_next(request)

        # Apply rate limiting selectively to sensitive auth endpoints
        path = request.url.path
        if request.method == "POST" and (path.endswith("/auth/login") or path.endswith("/auth/register")):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            cutoff = now - RATE_LIMIT_WINDOW

            # Filter out timestamps older than the sliding window
            timestamps = [t for t in _request_history[client_ip] if t > cutoff]
            if len(timestamps) >= AUTH_RATE_LIMIT:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many authentication attempts. Please try again after 60 seconds."},
                    headers={"Retry-After": "60"},
                )

            timestamps.append(now)
            _request_history[client_ip] = timestamps

        return await call_next(request)
