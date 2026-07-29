"""
fal.ai VTON Provider — placeholder / stub.

This is a ready-to-implement stub for when a real fal.ai API key is available.
Swap in your model endpoint and API key via the FAL_KEY env var.
"""

from inference.base import VTONProvider, VTONProviderError


class FalProvider(VTONProvider):
    """
    fal.ai VTON provider stub.

    To activate:
    1. Set VTON_PROVIDER=fal in .env
    2. Set FAL_KEY=<your-api-key> in .env
    3. Implement the `run()` method below with the actual fal.ai client SDK
    """

    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    def run(self, person_image_path: str, garment_image_path: str) -> str:
        """
        Execute virtual try-on via fal.ai.

        Raises:
            NotImplementedError: This is a stub awaiting real implementation.
        """
        raise NotImplementedError(
            "FalProvider is a placeholder stub. To use it:\n"
            "  1. pip install fal-client\n"
            "  2. Set FAL_KEY in your .env\n"
            "  3. Implement this method with the fal.ai SDK\n"
            "\n"
            "Example skeleton:\n"
            "  import fal_client\n"
            "  result = fal_client.subscribe('fal-ai/idm-vton', arguments={...})\n"
            "  # Download result['image']['url'] to uploads/results/\n"
            "  return local_path"
        )
