"""
RQ background task: execute a virtual try-on job.

This module is imported by the RQ worker process (a separate OS process
from the FastAPI server). The VTON provider is resolved ONCE at module
load time from the VTON_PROVIDER env var — not per-job.

The worker updates the SQLite job row at each stage so the frontend can
poll /jobs/{id} for live status.
"""

import logging
from pathlib import Path

from config import VTON_PROVIDER, FAL_KEY
from database import update_job
from inference.base import VTONProvider, VTONProviderError

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# ── Provider resolution (once at worker startup) ────────────
def _resolve_provider() -> VTONProvider:
    if VTON_PROVIDER == "hf_dev":
        from inference.hf_provider import HFSpaceDevProvider
        logger.info("VTON provider: HFSpaceDevProvider (DEV/PROTOTYPE)")
        return HFSpaceDevProvider()
    elif VTON_PROVIDER == "fal":
        from inference.fal_provider import FalProvider
        logger.info("VTON provider: FalProvider")
        return FalProvider(api_key=FAL_KEY)
    else:
        raise ValueError(
            f"Unknown VTON_PROVIDER '{VTON_PROVIDER}'. "
            "Valid values: 'hf_dev', 'fal'"
        )


_provider: VTONProvider = _resolve_provider()


# ── RQ task function ────────────────────────────────────────
def run_tryon_job(
    job_id: str,
    model_image_path: str,
    garment_image_path: str,
) -> None:
    """
    Execute a virtual try-on inference job.

    Called by RQ in the worker process. Updates the SQLite job row at
    each stage: validating → preprocessing → processing → completed|failed.
    """
    try:
        # Stage 1: validating
        update_job(job_id, status="validating", progress_message="Validating input images…")
        logger.info(f"[{job_id}] Validating inputs")

        # Quick sanity check: do the files still exist?
        if not Path(model_image_path).is_file():
            raise FileNotFoundError(f"Model image not found: {model_image_path}")
        if not Path(garment_image_path).is_file():
            raise FileNotFoundError(f"Garment image not found: {garment_image_path}")

        # Stage 1.5: preprocessing — isolate garment from any donor model
        # background to prevent shape-bleed into the VTON output.
        # This is optional: if rembg isn't installed, the raw garment is
        # passed through unchanged and the pipeline still works.
        garment_path_for_inference = garment_image_path
        try:
            from preprocessing.garment_isolation import isolate_garment, save_isolated_garment

            update_job(job_id, status="validating", progress_message="Isolating garment from background…")
            logger.info(f"[{job_id}] Running garment isolation")

            iso_result = isolate_garment(garment_image_path)
            if iso_result.was_processed:
                iso_dest = Path(garment_image_path).parent / f"{job_id}_garment_isolated.png"
                save_isolated_garment(iso_result, iso_dest)
                garment_path_for_inference = str(iso_dest)
                logger.info(f"[{job_id}] Garment isolated → {iso_dest.name}")
            else:
                logger.info(f"[{job_id}] Garment isolation skipped (rembg unavailable or failed)")
        except Exception as e:
            # Never let preprocessing failure kill the entire job —
            # fall back to the raw garment image.
            logger.warning(f"[{job_id}] Garment isolation error (continuing with raw): {e}")

        # Stage 2: processing
        update_job(job_id, status="processing", progress_message="Running AI try-on inference…")
        logger.info(f"[{job_id}] Starting inference via {VTON_PROVIDER}")

        result_path = _provider.run(model_image_path, garment_path_for_inference)

        # Stage 3: completed
        # Build a URL-friendly path relative to uploads/ for the API to serve
        result_url = f"/uploads/results/{Path(result_path).name}"
        update_job(
            job_id,
            status="completed",
            result_image_url=result_url,
            progress_message="Try-on complete!",
        )
        logger.info(f"[{job_id}] Completed → {result_url}")

    except VTONProviderError as e:
        logger.error(f"[{job_id}] Provider error: {e.detail}")
        update_job(
            job_id,
            status="failed",
            error_message=f"Inference failed: {e.detail}",
            progress_message="",
        )

    except Exception as e:
        logger.exception(f"[{job_id}] Unexpected error")
        update_job(
            job_id,
            status="failed",
            error_message=f"Unexpected error: {str(e)}",
            progress_message="",
        )

