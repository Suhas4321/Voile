"""
Upload validation utilities.

Validates:
1. Content-type whitelist (jpeg, png, webp)
2. File size limit (10 MB)
3. Actual image content via Pillow .verify() — prevents spoofed extensions / headers
"""

import io
from PIL import Image

from config import ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES


class ValidationError(Exception):
    """Raised when an uploaded file fails validation."""

    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


def validate_image(file_bytes: bytes, content_type: str, filename: str) -> None:
    """
    Validate an uploaded image file. Raises ValidationError on failure.

    Checks performed:
    - Size <= MAX_FILE_SIZE_BYTES
    - Content-Type in whitelist
    - Pillow can actually open & verify the image bytes (real content inspection)
    """
    # 1. Size check
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        size_mb = len(file_bytes) / (1024 * 1024)
        raise ValidationError(
            f"File '{filename}' is {size_mb:.1f} MB — max allowed is "
            f"{MAX_FILE_SIZE_BYTES / (1024 * 1024):.0f} MB."
        )

    # 2. Content-Type whitelist (informational; the real check is #3)
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError(
            f"File '{filename}' has content type '{content_type}'. "
            f"Allowed types: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}."
        )

    # 3. True content inspection via Pillow
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()  # lightweight — checks headers, does NOT decode full pixels
    except Exception:
        raise ValidationError(
            f"File '{filename}' is not a valid image. "
            "Upload a real JPEG, PNG, or WebP file."
        )

    # 4. Verify the detected format is in our whitelist
    # Pillow's format names: 'JPEG', 'PNG', 'WEBP'
    pil_format = img.format
    allowed_formats = {"JPEG", "PNG", "WEBP"}
    if pil_format not in allowed_formats:
        raise ValidationError(
            f"File '{filename}' detected as {pil_format} — only JPEG, PNG, "
            "and WebP are accepted."
        )
