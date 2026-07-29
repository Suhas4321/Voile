#!/usr/bin/env python3
"""
VOILE File Cleanup Script — zero-RAM, no resident process.

Walks the ./uploads directory tree (models/, garments/, results/) and deletes
files whose modification time is older than 24 hours. Also removes (or marks
as failed) corresponding SQLite job rows so the database doesn't reference
missing files.

Intended to run via cron, NOT as an in-app scheduler.

Usage:
    python cleanup.py              # default: 24h max age
    python cleanup.py --max-age 12 # custom: 12h max age

Crontab entry (run hourly):
    0 * * * * cd /home/suhas/Desktop/Fashion/backend && /home/suhas/Desktop/Fashion/backend/.venv/bin/python cleanup.py >> /tmp/voile_cleanup.log 2>&1
"""

import argparse
import logging
import os
import time
from pathlib import Path

from config import UPLOAD_DIR
from database import get_stale_jobs, delete_job

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ cleanup │ %(message)s",
)
logger = logging.getLogger("cleanup")


def cleanup_files(max_age_hours: int = 24) -> int:
    """
    Delete files older than `max_age_hours` from the uploads directory tree.
    Returns the count of deleted files.
    """
    max_age_seconds = max_age_hours * 3600
    cutoff = time.time() - max_age_seconds
    deleted = 0

    for subdir in ("models", "garments", "results"):
        target = Path(UPLOAD_DIR) / subdir
        if not target.is_dir():
            continue

        for filepath in target.iterdir():
            if not filepath.is_file():
                continue

            if filepath.stat().st_mtime < cutoff:
                try:
                    filepath.unlink()
                    deleted += 1
                    logger.info(f"Deleted: {filepath}")
                except OSError as e:
                    logger.warning(f"Failed to delete {filepath}: {e}")

    return deleted


def cleanup_stale_jobs(max_age_hours: int = 24) -> int:
    """
    Delete SQLite job rows older than `max_age_hours`.
    Returns the count of deleted rows.
    """
    max_age_seconds = max_age_hours * 3600
    stale_jobs = get_stale_jobs(max_age_seconds)
    deleted = 0

    for job in stale_jobs:
        try:
            delete_job(job["job_id"])
            deleted += 1
            logger.info(f"Deleted job row: {job['job_id']} (status={job['status']})")
        except Exception as e:
            logger.warning(f"Failed to delete job {job['job_id']}: {e}")

    return deleted


def main():
    parser = argparse.ArgumentParser(
        description="VOILE cleanup: delete stale upload files and job rows."
    )
    parser.add_argument(
        "--max-age",
        type=int,
        default=24,
        help="Maximum file/job age in hours (default: 24)",
    )
    args = parser.parse_args()

    logger.info(f"Starting cleanup (max age: {args.max_age}h)")

    files_deleted = cleanup_files(args.max_age)
    jobs_deleted = cleanup_stale_jobs(args.max_age)

    logger.info(
        f"Cleanup complete: {files_deleted} file(s), {jobs_deleted} job row(s) deleted."
    )


if __name__ == "__main__":
    main()
