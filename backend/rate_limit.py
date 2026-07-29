"""
Simple in-memory rate limiter for the try-on endpoint.

Uses a sliding-window counter per client IP. At the scale of a single
8 GB laptop, in-memory is perfectly sufficient — no Redis or SQLite overhead.
Counters are garbage-collected on each check call so memory stays bounded.
"""

import time
from collections import defaultdict
from threading import Lock

from config import RATE_LIMIT_PER_HOUR


class RateLimiter:
    """
    Sliding-window rate limiter.

    Each call to `check(key)` either:
    - Returns normally if the key is within the limit, or
    - Raises RateLimitExceeded with a human-readable message.
    """

    def __init__(self, max_requests: int = RATE_LIMIT_PER_HOUR, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._timestamps: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str) -> None:
        """Check if `key` (e.g. client IP) is within the rate limit."""
        now = time.monotonic()
        cutoff = now - self.window_seconds

        with self._lock:
            # Prune old timestamps for this key
            self._timestamps[key] = [
                t for t in self._timestamps[key] if t > cutoff
            ]

            if len(self._timestamps[key]) >= self.max_requests:
                raise RateLimitExceeded(
                    f"Rate limit exceeded: max {self.max_requests} requests "
                    f"per {self.window_seconds // 60} minutes. Try again later."
                )

            self._timestamps[key].append(now)

        # Periodic GC: purge keys that are entirely expired
        # (only do this occasionally to avoid overhead)
        if int(now) % 60 == 0:
            self._gc(cutoff)

    def _gc(self, cutoff: float) -> None:
        """Remove keys whose timestamps are all expired."""
        with self._lock:
            empty_keys = [
                k for k, ts in self._timestamps.items()
                if not ts or all(t <= cutoff for t in ts)
            ]
            for k in empty_keys:
                del self._timestamps[k]


class RateLimitExceeded(Exception):
    """Raised when a client exceeds the rate limit."""

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


# Singleton instance used by the API
rate_limiter = RateLimiter()
