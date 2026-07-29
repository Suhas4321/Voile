"""
Centralized configuration — reads from environment variables with sensible defaults.
All paths are resolved relative to this file's parent directory (i.e. backend/).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the backend directory before any os.getenv() calls
load_dotenv(Path(__file__).resolve().parent / ".env")

# ── Base paths ──────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / os.getenv("DATABASE_PATH", "./voile.db")
UPLOAD_DIR = BASE_DIR / os.getenv("UPLOAD_DIR", "./uploads")

# Ensure upload sub-directories exist on import
for sub in ("models", "garments", "results"):
    (UPLOAD_DIR / sub).mkdir(parents=True, exist_ok=True)

# ── Redis / RQ ──────────────────────────────────────────────
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

# ── VTON provider ──────────────────────────────────────────
VTON_PROVIDER: str = os.getenv("VTON_PROVIDER", "hf_dev")  # "hf_dev" | "fal"
HF_SPACE_ID: str = os.getenv("HF_SPACE_ID", "yisol/IDM-VTON")
HF_TOKEN: str = os.getenv("HF_TOKEN", "")  # Optional: authenticate for higher ZeroGPU quota
FAL_KEY: str = os.getenv("FAL_KEY", "")

# ── Upload guardrails ──────────────────────────────────────
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# ── Rate limiting ──────────────────────────────────────────
RATE_LIMIT_PER_HOUR: int = int(os.getenv("RATE_LIMIT_PER_HOUR", "10"))

# ── CORS ───────────────────────────────────────────────────
FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
