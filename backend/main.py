"""
VOILE Backend — FastAPI Application

Lightweight backend for the VOILE AI Virtual Try-On Studio.
Designed for 8 GB RAM Ubuntu, $0 cost, all heavy inference offloaded
to external providers via the adapter pattern.

API Routes:
  POST /api/v1/try-on      — upload model + garment → enqueue job
  GET  /api/v1/jobs/{id}    — poll job status
  GET  /api/v1/health       — liveness + Redis connectivity check
"""

import logging
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from redis import Redis
from rq import Queue

from config import FRONTEND_ORIGIN, REDIS_URL, UPLOAD_DIR
from database import create_job, get_job, init_db
from rate_limit import RateLimitExceeded, rate_limiter
from tasks import run_tryon_job
from validation import ValidationError, validate_image

# ── Logging ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logger = logging.getLogger("voile")

# ── App ─────────────────────────────────────────────────────
app = FastAPI(
    title="VOILE AI Virtual Try-On API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS — match the React/Vite frontend dev origin ────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve uploaded/result images as static files ────────────
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ── Redis + RQ ──────────────────────────────────────────────
try:
    redis_conn = Redis.from_url(REDIS_URL)
    redis_conn.ping()
    logger.info("Connected to Redis server")
except Exception:
    import fakeredis
    logger.warning("Redis server unreachable. Falling back to in-memory FakeRedis.")
    redis_conn = fakeredis.FakeStrictRedis()

task_queue = Queue(connection=redis_conn)


# ── Startup ─────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    init_db()
    logger.info("SQLite database initialized (WAL mode)")
    logger.info(f"CORS origin: {FRONTEND_ORIGIN}")
    logger.info(f"Upload dir: {UPLOAD_DIR}")


# ── Exception handlers ─────────────────────────────────────
@app.exception_handler(ValidationError)
async def validation_error_handler(_request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": exc.detail},
    )


# ── Routes ──────────────────────────────────────────────────

@app.get("/api/v1/health")
async def health_check():
    """
    Liveness check. Also verifies Redis connectivity.
    """
    redis_ok = False
    try:
        redis_ok = redis_conn.ping()
    except Exception:
        pass

    status = "healthy" if redis_ok else "degraded"
    return {
        "status": status,
        "redis": "connected" if redis_ok else "unreachable",
    }


@app.post("/api/v1/try-on", status_code=202)
async def create_tryon(
    request: Request,
    background_tasks: BackgroundTasks,
    model_image: UploadFile = File(..., description="Model/person photo (JPEG, PNG, or WebP, max 10 MB)"),
    garment_image: UploadFile = File(..., description="Garment flat-lay photo (JPEG, PNG, or WebP, max 10 MB)"),
):
    """
    Submit a virtual try-on request.

    Accepts multipart/form-data with two image files:
    - `model_image`: the person/model photo
    - `garment_image`: the garment flat-lay photo

    Returns 202 with a job_id for polling via GET /api/v1/jobs/{job_id}.
    """
    # Rate limit by client IP
    client_ip = request.client.host if request.client else "unknown"
    rate_limiter.check(client_ip)

    # Read file bytes
    model_bytes = await model_image.read()
    garment_bytes = await garment_image.read()

    # Validate both images (content inspection via Pillow)
    validate_image(model_bytes, model_image.content_type or "", model_image.filename or "model_image")
    validate_image(garment_bytes, garment_image.content_type or "", garment_image.filename or "garment_image")

    # Generate job ID and save files to disk
    job_id = uuid.uuid4().hex

    model_ext = _safe_extension(model_image.filename)
    garment_ext = _safe_extension(garment_image.filename)

    model_path = UPLOAD_DIR / "models" / f"{job_id}_model{model_ext}"
    garment_path = UPLOAD_DIR / "garments" / f"{job_id}_garment{garment_ext}"

    model_path.write_bytes(model_bytes)
    garment_path.write_bytes(garment_bytes)

    # Insert job into SQLite
    model_url = f"/uploads/models/{model_path.name}"
    garment_url = f"/uploads/garments/{garment_path.name}"

    create_job(
        job_id=job_id,
        model_image_url=model_url,
        garment_image_url=garment_url,
    )

    # Enqueue background task
    is_fake_redis = type(redis_conn).__name__ in ("FakeStrictRedis", "FakeRedis")
    if is_fake_redis:
        # No real worker process — run inference in a background thread
        background_tasks.add_task(
            run_tryon_job,
            job_id,
            str(model_path.resolve()),
            str(garment_path.resolve()),
        )
    else:
        task_queue.enqueue(
            run_tryon_job,
            job_id,
            str(model_path.resolve()),
            str(garment_path.resolve()),
            job_timeout="10m",  # generous timeout for cold-start HF Spaces
        )

    logger.info(f"Job {job_id} enqueued for {client_ip}")

    return {
        "job_id": job_id,
        "status": "pending",
    }


@app.get("/api/v1/jobs/{job_id}")
async def get_job_status(job_id: str):
    """
    Poll the status of a try-on job.

    Returns the current status, progress message, result URL (if completed),
    or error message (if failed).
    """
    job = get_job(job_id)
    if not job:
        return JSONResponse(
            status_code=404,
            content={"detail": f"Job '{job_id}' not found."},
        )

    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "progress_message": job["progress_message"],
        "result_image_url": job["result_image_url"],
        "error_message": job["error_message"],
    }


# ── Helpers ─────────────────────────────────────────────────

def _safe_extension(filename: str | None) -> str:
    """Extract a safe file extension from the upload filename."""
    if not filename:
        return ".jpg"
    ext = Path(filename).suffix.lower()
    return ext if ext in {".jpg", ".jpeg", ".png", ".webp"} else ".jpg"
