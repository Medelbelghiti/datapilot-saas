from fastapi import Request, HTTPException
from collections import defaultdict
import time


class RateLimiter:
    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_rate_limited(self, key: str) -> bool:
        now = time.time()
        cutoff = now - self.window

        # Clean old entries
        self.requests[key] = [t for t in self.requests[key] if t > cutoff]

        if len(self.requests[key]) >= self.max_requests:
            return True

        self.requests[key].append(now)
        return False

    def get_remaining(self, key: str) -> int:
        now = time.time()
        cutoff = now - self.window
        current = len([t for t in self.requests[key] if t > cutoff])
        return max(0, self.max_requests - current)


# Global rate limiter instance
rate_limiter = RateLimiter(max_requests=60, window_seconds=60)

# Stricter limiter for auth endpoints
auth_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

# Analysis limiter (heavier operations)
analysis_rate_limiter = RateLimiter(max_requests=5, window_seconds=60)


def check_rate_limit(request: Request, limiter: RateLimiter | None = None):
    limiter = limiter or rate_limiter
    client_ip = request.client.host if request.client else "unknown"
    key = f"ip:{client_ip}"

    if limiter.is_rate_limited(key):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later.",
        )


def get_client_key(request: Request) -> str:
    return f"ip:{request.client.host if request.client else 'unknown'}"
