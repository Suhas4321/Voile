"""
Garment isolation — strips a garment photo down to *only the clothing item*
before it reaches IDM-VTON.

Why this matters
----------------
IDM-VTON conditions its diffusion process on the visible silhouette in the
garment reference image. If that image contains a human model wearing the
garment, the model's shoulder width and torso proportions leak into the
generated drape — an oversized fit model produces an oversized-looking result
even on a slim user, because the network partly reconstructs the donor body's
shape, not just the fabric.

Isolating the garment onto a transparent background removes that signal
entirely, so IDM-VTON conditions only on the garment's own shape and texture.

The `rembg` backend is optional — if not installed, the raw garment image
is passed through unchanged. This keeps the pipeline functional on low-RAM
systems that can't afford the extra model weights.
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

logger = logging.getLogger(__name__)


@dataclass
class IsolationResult:
    """Result of garment isolation."""
    image: Image.Image       # RGBA, garment only, transparent elsewhere
    was_processed: bool      # True if rembg was used, False if passthrough


def isolate_garment(image_path: str) -> IsolationResult:
    """
    Take a garment image path, return an IsolationResult with the clothing
    item isolated on a transparent background.

    Falls back to the raw image (converted to RGBA) if rembg is unavailable.
    """
    source = Image.open(image_path).convert("RGB")

    try:
        cutout = _isolate_with_rembg(source)
        cutout = _clean_alpha_edges(cutout)
        logger.info("Garment isolated successfully via rembg")
        return IsolationResult(image=cutout, was_processed=True)
    except ImportError:
        logger.warning(
            "rembg not installed — skipping garment isolation. "
            "Install with: pip install rembg[cpu]"
        )
        return IsolationResult(image=source.convert("RGBA"), was_processed=False)
    except Exception as e:
        logger.warning(f"Garment isolation failed, using raw image: {e}")
        return IsolationResult(image=source.convert("RGBA"), was_processed=False)


def _isolate_with_rembg(source: Image.Image) -> Image.Image:
    """
    Default path. rembg's IS-Net model segments the dominant foreground
    subject — for a garment flat-lay photo this correctly isolates the item;
    for a garment-on-model photo it segments the person (including the
    garment), which is still a significant improvement over a busy background.
    """
    from rembg import remove, new_session

    session = new_session("isnet-general-use")
    return remove(source, session=session).convert("RGBA")


def _clean_alpha_edges(image: Image.Image, threshold: int = 8) -> Image.Image:
    """
    Segmentation models leave a soft semi-transparent halo at the garment
    edge, which IDM-VTON can misread as a faint secondary silhouette.
    Hard-clip low-alpha pixels to fully transparent.
    """
    r, g, b, a = image.split()
    a = a.point(lambda v: 0 if v < threshold else v)
    return Image.merge("RGBA", (r, g, b, a))


def save_isolated_garment(result: IsolationResult, out_path: Path) -> Path:
    """Save the isolated garment as PNG (preserves alpha channel)."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    result.image.save(out_path, format="PNG")
    return out_path
