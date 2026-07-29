"""
SQLite database layer for job persistence.

Design decisions:
- WAL mode enabled on every connection — safe for concurrent writes from the
  API process and the RQ worker process.
- Short-lived connections per operation — no long-held connection object.
- All timestamps are ISO-8601 UTC strings.
"""

import sqlite3
from datetime import datetime, timezone
from typing import Any, Optional

from config import DATABASE_PATH

# ── Schema ──────────────────────────────────────────────────

_SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    job_id            TEXT PRIMARY KEY,
    status            TEXT NOT NULL DEFAULT 'pending',
    model_image_url   TEXT,
    garment_image_url TEXT,
    result_image_url  TEXT,
    progress_message  TEXT DEFAULT '',
    error_message     TEXT DEFAULT '',
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
);
"""

# Valid status transitions (informational; enforced by application logic)
VALID_STATUSES = {"pending", "validating", "processing", "completed", "failed"}


def _connect() -> sqlite3.Connection:
    """Open a short-lived connection with WAL mode and row-factory enabled."""
    conn = sqlite3.connect(str(DATABASE_PATH), timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=5000;")  # wait up to 5s on lock contention
    return conn


def init_db() -> None:
    """Create the jobs table if it doesn't exist. Call once at startup."""
    conn = _connect()
    try:
        conn.executescript(_SCHEMA)
        conn.commit()
    finally:
        conn.close()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── CRUD ────────────────────────────────────────────────────

def create_job(
    job_id: str,
    model_image_url: str,
    garment_image_url: str,
) -> dict[str, Any]:
    """Insert a new job with status=pending. Returns the row as a dict."""
    now = _now()
    conn = _connect()
    try:
        conn.execute(
            """INSERT INTO jobs
               (job_id, status, model_image_url, garment_image_url,
                progress_message, error_message, created_at, updated_at)
               VALUES (?, 'pending', ?, ?, '', '', ?, ?)""",
            (job_id, model_image_url, garment_image_url, now, now),
        )
        conn.commit()
        return get_job(job_id)  # type: ignore[return-value]
    finally:
        conn.close()


def get_job(job_id: str) -> Optional[dict[str, Any]]:
    """Fetch a single job by ID. Returns None if not found."""
    conn = _connect()
    try:
        row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_job(job_id: str, **fields: Any) -> None:
    """
    Update arbitrary fields on a job row.
    Automatically sets `updated_at` to now.
    """
    fields["updated_at"] = _now()
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [job_id]
    conn = _connect()
    try:
        conn.execute(f"UPDATE jobs SET {set_clause} WHERE job_id = ?", values)
        conn.commit()
    finally:
        conn.close()


def delete_job(job_id: str) -> None:
    """Hard-delete a job row."""
    conn = _connect()
    try:
        conn.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))
        conn.commit()
    finally:
        conn.close()


def get_stale_jobs(max_age_seconds: int = 86400) -> list[dict[str, Any]]:
    """
    Return all jobs whose `created_at` is older than `max_age_seconds` ago.
    Used by the cleanup script.
    """
    cutoff = datetime.fromtimestamp(
        datetime.now(timezone.utc).timestamp() - max_age_seconds,
        tz=timezone.utc,
    ).isoformat()
    conn = _connect()
    try:
        rows = conn.execute(
            "SELECT * FROM jobs WHERE created_at < ?", (cutoff,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
