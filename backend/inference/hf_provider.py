"""
Hugging Face Spaces VTON Provider — DEV / PROTOTYPE ONLY.

┌─────────────────────────────────────────────────────────────────────────┐
│  ⚠  DEV / PROTOTYPE ONLY                                               │
│                                                                         │
│  This provider routes inference through a PUBLIC Hugging Face Space     │
│  (e.g. yisol/IDM-VTON).  DO NOT route real user data through this in   │
│  production — no data processing agreement exists with this third-party │
│  Space. The Space may be rate-limited, unavailable, or queue for        │
│  minutes at peak times.                                                 │
│                                                                         │
│  For production, implement FalProvider or host your own model endpoint. │
└─────────────────────────────────────────────────────────────────────────┘

Features:
- Global lock so only one ZeroGPU request runs at a time (prevents OOM)
- Timeout handling (configurable, default 300s for cold-start Spaces)
- Retry with exponential backoff (max 2 retries; longer for GPU errors)
- No local background removal — raw garment image is passed directly
- HF Token authentication for higher ZeroGPU quota
- Smart retry: quota-exceeded errors fail fast (no wasteful retries)
"""

import logging
import re
import shutil
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from pathlib import Path

import httpx
from gradio_client import Client, handle_file

from config import HF_SPACE_ID, HF_TOKEN, UPLOAD_DIR
from inference.base import VTONProvider, VTONProviderError

logger = logging.getLogger(__name__)

# Public ZeroGPU Spaces (like yisol/IDM-VTON) typically have a single GPU.
# Concurrent predict() calls cause read timeouts and AcceleratorError (CUDA OOM).
# Serialize all HF Space inference across background threads / workers.
_HF_SPACE_LOCK = threading.Lock()


def _is_quota_error(error: Exception) -> bool:
    """Check if the error is a ZeroGPU quota-exceeded error."""
    msg = str(error).lower()
    return "exceeded" in msg and ("quota" in msg or "zerogpu" in msg)


def _is_gpu_error(error: Exception) -> bool:
    """CUDA / Accelerator failures on the remote Space (often load or OOM)."""
    msg = str(error).lower()
    return any(
        token in msg
        for token in (
            "acceleratorerror",
            "cuda",
            "out of memory",
            "oom",
            "device-side assert",
        )
    )


def _is_timeout_error(error: Exception) -> bool:
    msg = str(error).lower()
    return "timed out" in msg or "timeout" in msg or "read operation" in msg


def _parse_quota_wait_time(error: Exception) -> str | None:
    """Extract the wait time from a quota error message (e.g. 'Try again in 23:19:19')."""
    match = re.search(r"try again in (\d+:\d+:\d+)", str(error), re.IGNORECASE)
    return match.group(1) if match else None


class HFSpaceDevProvider(VTONProvider):
    """
    DEV/PROTOTYPE ONLY — do not route real user data through this in
    production; no data processing agreement exists with this third-party Space.
    """

    def __init__(
        self,
        space_id: str = HF_SPACE_ID,
        hf_token: str = HF_TOKEN,
        timeout: int = 300,
        max_retries: int = 2,
    ):
        self.space_id = space_id
        self.hf_token = hf_token or None  # Convert empty string to None
        self.timeout = timeout
        self.max_retries = max_retries

    def run(self, person_image_path: str, garment_image_path: str) -> str:
        """
        Call the HF Space's Gradio API to perform virtual try-on.

        Passes the raw garment image directly — no local background removal.
        Waits for the process-wide HF lock so concurrent jobs do not
        overload the shared ZeroGPU Space.

        Returns the absolute path to the saved result image.
        """
        # Block until no other try-on is talking to the Space. Waiting is
        # preferable to parallel AcceleratorError / timeout failures.
        if not _HF_SPACE_LOCK.acquire(blocking=False):
            logger.info(
                "Another try-on is using the HF Space — waiting for free slot..."
            )
            _HF_SPACE_LOCK.acquire(blocking=True)
        try:
            return self._run_with_retries(person_image_path, garment_image_path)
        finally:
            _HF_SPACE_LOCK.release()

    def _run_with_retries(self, person_image_path: str, garment_image_path: str) -> str:
        last_error: Exception | None = None

        for attempt in range(1, self.max_retries + 2):  # +2 because range is exclusive
            try:
                return self._call_space(person_image_path, garment_image_path)
            except Exception as e:
                last_error = e

                # Quota errors should NOT be retried — retrying wastes more quota
                if _is_quota_error(e):
                    wait_time = _parse_quota_wait_time(e)
                    detail = (
                        f"ZeroGPU quota exceeded on '{self.space_id}'. "
                        f"Your free GPU quota has been used up for today."
                    )
                    if wait_time:
                        detail += f" Quota resets in {wait_time}."
                    if not self.hf_token:
                        detail += (
                            " [ACTION] Add a Hugging Face token (HF_TOKEN) in your "
                            "backend .env file for 8× more daily quota. "
                            "Get one at: https://huggingface.co/settings/tokens"
                        )
                    else:
                        detail += (
                            " You are already authenticated. Consider upgrading to "
                            "HF Pro ($9/mo) for significantly more quota, or wait "
                            "for the quota to reset."
                        )
                    raise VTONProviderError(detail, retriable=False)

                if attempt <= self.max_retries:
                    # GPU / Accelerator errors need a longer cool-down so the
                    # Space can recover; short backoff just hammers a bad GPU.
                    if _is_gpu_error(e):
                        backoff = 8 * attempt  # 8s, 16s
                    elif _is_timeout_error(e):
                        backoff = 4 * attempt  # 4s, 8s
                    else:
                        backoff = 2 ** attempt  # 2s, 4s
                    logger.warning(
                        f"Attempt {attempt} failed: {e}. Retrying in {backoff}s..."
                    )
                    time.sleep(backoff)
                    continue
                break

        # Build a clearer final error for the UI / job row
        err_text = str(last_error) if last_error else "unknown error"
        if last_error and _is_gpu_error(last_error):
            raise VTONProviderError(
                f"HF Space '{self.space_id}' GPU failed after "
                f"{self.max_retries + 1} attempts (AcceleratorError). "
                "This is usually temporary Space-side GPU load or OOM — not your "
                "HF free-quota limit. Wait ~30s and retry a single job.",
                retriable=True,
            )
        if last_error and _is_timeout_error(last_error):
            raise VTONProviderError(
                f"HF Space '{self.space_id}' timed out after "
                f"{self.max_retries + 1} attempts. The Space may be cold-starting "
                "or under heavy public load. Wait a moment and retry one job.",
                retriable=True,
            )

        raise VTONProviderError(
            f"HF Space '{self.space_id}' failed after {self.max_retries + 1} attempts: "
            f"{err_text}",
            retriable=True,
        )

    def _call_space(self, person_path: str, garment_path: str) -> str:
        """
        Single attempt to call the Gradio Space with a hard timeout.

        The IDM-VTON Space API typically expects:
          - dict(background=<person_img>, layers=[], composite=None)  (ImageEditor)
          - garment image
          - description text
          - toggling auto-generated mask
          - denoising steps, seed, etc.

        Adjust the `predict()` args if the Space's API changes.
        """
        client = None
        try:
            logger.info(
                f"Connecting to HF Space '{self.space_id}' "
                f"(token={'YES' if self.hf_token else 'NO'}, timeout={self.timeout}s)"
            )
            # httpx's default read timeout is short (~5–30s) and aborts mid-
            # inference with "The read operation timed out" even though our
            # ThreadPoolExecutor budget is 300s. Align socket timeouts.
            client = Client(
                self.space_id,
                hf_token=self.hf_token,
                httpx_kwargs={
                    "timeout": httpx.Timeout(
                        connect=60.0,
                        read=float(self.timeout),
                        write=60.0,
                        pool=60.0,
                    )
                },
            )

            # Run predict() in a thread with a hard timeout so a hung Space
            # doesn't block the worker process indefinitely.
            def _predict():
                return client.predict(
                    dict(
                        background=handle_file(person_path),
                        layers=[],
                        composite=None,
                    ),
                    handle_file(garment_path),
                    "A person wearing the garment",  # text description
                    True,   # auto-generate mask
                    True,   # auto-crop & resize
                    30,     # denoising steps
                    42,     # seed
                    api_name="/tryon",
                )

            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_predict)
                try:
                    result = future.result(timeout=self.timeout)
                except FuturesTimeout:
                    raise VTONProviderError(
                        f"HF Space '{self.space_id}' did not respond within "
                        f"{self.timeout}s. The Space may be cold-starting or "
                        f"under heavy load. Please try again.",
                        retriable=True,
                    )

            # The result is typically a list or tuple; the output image path is
            # the first element (or the only element).
            if isinstance(result, (list, tuple)):
                output_file = result[0]
            else:
                output_file = result

            # Copy the result to our uploads/results/ directory
            result_filename = f"{uuid.uuid4().hex}.png"
            dest = Path(UPLOAD_DIR) / "results" / result_filename
            shutil.copy2(str(output_file), str(dest))

            return str(dest)
        finally:
            if client is not None:
                try:
                    client.close()
                except Exception:
                    pass
