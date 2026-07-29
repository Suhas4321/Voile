"""
User photo matting — optional cleanup pass for the user's body photo.

Why this matters
----------------
Outdoor photos with high-frequency backgrounds (railings, foliage, crowds)
introduce edge noise at exactly the body boundary where DWPose needs the
cleanest signal. This measurably degrades keypoint confidence at shoulders,
wrists, and ankles, propagating into the fitting stage as misaligned joints.

This produces a background-flattened *copy* used solely as the pose-detection
input. The original photo is always preserved for the actual render — we never
overwrite or degrade it.

Note: In the current architecture the HF Space runs its own internal DWPose,
so this module is NOT integrated into the pipeline yet. It's scaffolded for
when we move to a self-hosted model endpoint where we control pose extraction.
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageFilter

logger = logging.getLogger(__name__)


@dataclass
class MattingResult:
    """Result of user photo background flattening."""
    pose_clean_image: Image.Image   # RGB, neutral flat background, for DWPose only
    original_preserved: bool = True


def clean_user_photo_for_pose(
    image_path: str,
    fill_color: tuple[int, int, int] = (18, 18, 22),
) -> MattingResult:
    """
    Produce a background-flattened copy of the user's photo, used only as
    input to pose/keypoint detection — never shown to the user and never
    passed to IDM-VTON's render step (which needs the original for
    lighting/skin-tone fidelity).
    """
    source = Image.open(image_path).convert("RGB")

    try:
        mask = _foreground_mask(source)
        flat_bg = Image.new("RGB", source.size, fill_color)
        pose_clean = Image.composite(source, flat_bg, mask)
        logger.info("User photo background flattened for pose detection")
        return MattingResult(pose_clean_image=pose_clean)
    except ImportError:
        logger.warning(
            "rembg not installed — skipping user photo matting. "
            "Install with: pip install rembg[cpu]"
        )
        return MattingResult(pose_clean_image=source)
    except Exception as e:
        logger.warning(f"User photo matting failed, using original: {e}")
        return MattingResult(pose_clean_image=source)


def _foreground_mask(source: Image.Image) -> Image.Image:
    """
    Person-vs-background mask. Reuses rembg's general-purpose model —
    a full-body photo against sky/water/foliage is exactly the kind of
    subject it handles well.
    """
    from rembg import remove, new_session

    session = new_session("isnet-general-use")
    cutout = remove(source, session=session).convert("RGBA")
    alpha = cutout.split()[-1]

    # Slight blur on the mask edge avoids a hard cutout line that would
    # itself become a new artificial edge for DWPose to trip on.
    return alpha.filter(ImageFilter.GaussianBlur(radius=2))


def save_pose_clean(result: MattingResult, out_path: Path) -> Path:
    """Save the pose-clean image as JPEG."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    result.pose_clean_image.save(out_path, format="JPEG", quality=95)
    return out_path
