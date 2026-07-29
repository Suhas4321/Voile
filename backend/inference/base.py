"""
Abstract base class for Virtual Try-On providers.

Every concrete provider implements `run()` which accepts local file paths
for the person and garment images and returns the local path to the
generated result image.
"""

from abc import ABC, abstractmethod


class VTONProviderError(Exception):
    """Raised when a VTON provider fails (timeout, API error, bad response, etc.)."""

    def __init__(self, detail: str, retriable: bool = False):
        self.detail = detail
        self.retriable = retriable
        super().__init__(detail)


class VTONProvider(ABC):
    """
    Abstract VTON provider interface.

    Implementations must be safe to call from an RQ worker (synchronous,
    blocking I/O is fine — the worker runs in its own OS process).
    """

    @abstractmethod
    def run(self, person_image_path: str, garment_image_path: str) -> str:
        """
        Execute a virtual try-on inference.

        Args:
            person_image_path:  Absolute path to the model/person image file.
            garment_image_path: Absolute path to the garment flat-lay image file.

        Returns:
            Absolute path to the generated result image saved to disk.

        Raises:
            VTONProviderError: On any inference failure.
        """
        ...
