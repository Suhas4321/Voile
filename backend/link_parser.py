"""
VOILE Link Parser & E-Commerce Garment Scraper Module

Parses product URLs from fashion platforms (Myntra, Amazon, Zara, H&M, Ajio,
Flipkart, ASOS, Shein, Shopify stores, etc.) or direct image links, extracts
high-resolution garment images and product metadata, and downloads the image
for virtual try-on.
"""

import io
import json
import logging
import re
import uuid
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from PIL import Image

from config import UPLOAD_DIR

logger = logging.getLogger("fitmirrors.link_parser")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
}

# Inferred garment category based on product title
CATEGORY_KEYWORDS = {
    "T-Shirt / Top": ["t-shirt", "tshirt", "top", "tee", "shirt", "blouse", "crop top", "tank"],
    "Hoodie / Sweatshirt": ["hoodie", "sweatshirt", "pullover", "sweater", "cardigan", "fleece"],
    "Jacket / Coat": ["jacket", "coat", "blazer", "parka", "overcoat", "vest", "trench"],
    "Dress": ["dress", "gown", "frock", "maxi", "midi", "minidress", "jumpsuit", "romper"],
    "Pants / Jeans": ["jeans", "pants", "trousers", "joggers", "cargo", "leggings", "chinos", "bottoms", "shorts", "skirt"],
}


def infer_category(title: str) -> str:
    """Infer garment category from product title."""
    title_lower = title.lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in title_lower for kw in keywords):
            return cat
    return "T-Shirt / Top"


def clean_image_url(url: str, base_url: str = "") -> str:
    """Ensure URL is absolute and properly formatted."""
    if not url:
        return ""
    if url.startswith("//"):
        return "https:" + url
    if base_url and not url.startswith("http"):
        return urljoin(base_url, url)
    return url


async def fetch_page(url: str) -> tuple[str, str, str]:
    """
    Fetch URL content.
    Returns (html_or_content, content_type, final_url).
    """
    async with httpx.AsyncClient(
        headers=HEADERS,
        follow_redirects=True,
        timeout=12.0,
        verify=False,
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "").lower()
        return resp.text if "text/html" in content_type else resp.content, content_type, str(resp.url)


def parse_myntra(html: str, url: str) -> Optional[Dict[str, Any]]:
    """Parse Myntra PDP data from window.__myx window variable."""
    myx_match = re.search(r"window\.__myx\s*=\s*({.*?});?</script>", html)
    if not myx_match:
        return None

    try:
        data = json.loads(myx_match.group(1))
        pdp = data.get("pdpData", {})
        if not pdp:
            return None

        title = pdp.get("name") or pdp.get("title") or "Myntra Garment"
        brand_data = pdp.get("brand")
        brand = brand_data.get("name") if isinstance(brand_data, dict) else (brand_data or "Myntra")

        price_data = pdp.get("price", {})
        price = None
        if isinstance(price_data, dict):
            mrp = price_data.get("mrp") or price_data.get("discounted")
            if mrp:
                price = f"₹{mrp}"

        image_urls = []
        media = pdp.get("media", {})
        if isinstance(media, dict) and "albums" in media:
            for album in media.get("albums", []):
                for img in album.get("images", []):
                    src = img.get("src") or img.get("imageURL")
                    if src:
                        # Myntra image template replacing placeholders with high-res specs
                        clean_src = (
                            src.replace("h_($height)", "h_1440")
                            .replace("w_($width)", "w_1080")
                            .replace("q_($qualityPercentage)", "q_85")
                        )
                        if not clean_src.startswith("http"):
                            clean_src = "https:" + clean_src if clean_src.startswith("//") else clean_src
                        image_urls.append(clean_src)

        if image_urls:
            return {
                "title": title,
                "brand": brand,
                "price": price,
                "site_name": "Myntra",
                "images": image_urls,
            }
    except Exception as e:
        logger.warning(f"Myntra specialized parser failed: {e}")

    return None


def parse_amazon(html: str, url: str) -> Optional[Dict[str, Any]]:
    """
    Parse Amazon.in / Amazon fashion PDPs.

    Amazon rarely exposes Product JSON-LD or usable og:image on fashion PDPs.
    Prefer #landingImage / data-a-dynamic-image / embedded colorImages JS blobs.
    Note: many Amazon fashion photos are lifestyle (model wearing outfit), not flat-lays.
    """
    try:
        soup = BeautifulSoup(html, "html.parser")

        title_el = soup.find(id="productTitle")
        title = title_el.get_text(strip=True) if title_el else None
        if not title:
            og = soup.find("meta", property="og:title")
            title = og.get("content", "").strip() if og else None

        brand = None
        brand_el = soup.find(id="bylineInfo")
        if brand_el:
            brand = brand_el.get_text(strip=True)
            brand = re.sub(r"^(Visit the|Brand:\s*)", "", brand, flags=re.I).replace(" Store", "").strip()
        if not brand:
            brand = "Amazon Fashion"

        price = None
        price_whole = soup.select_one(".a-price .a-offscreen") or soup.select_one("#priceblock_ourprice")
        if price_whole:
            price = price_whole.get_text(strip=True)
        if not price:
            m = re.search(r'"priceAmount"\s*:\s*([\d.]+)', html)
            if m:
                price = f"₹{m.group(1)}"

        image_urls: List[str] = []

        # 1) High-res from landing image attributes
        landing = soup.find(id="landingImage") or soup.find(id="imgTagWrapperId")
        if landing:
            if landing.name != "img":
                landing = landing.find("img") if landing else None
            if landing:
                for attr in ("data-old-hires", "data-a-dynamic-image", "src"):
                    val = landing.get(attr)
                    if not val:
                        continue
                    if attr == "data-a-dynamic-image":
                        try:
                            dyn = json.loads(val)
                            # Prefer largest by max(width, height)
                            ranked = sorted(
                                dyn.items(),
                                key=lambda kv: max(kv[1]) if isinstance(kv[1], list) and kv[1] else 0,
                                reverse=True,
                            )
                            for img_url, _ in ranked:
                                if img_url and img_url not in image_urls:
                                    image_urls.append(img_url)
                        except Exception:
                            pass
                    elif val.startswith("http") and val not in image_urls:
                        image_urls.append(val)

        # 2) colorImages / imageGalleryData embedded scripts
        for pattern in (
            r"'colorImages'\s*:\s*(\{.*?\}),\s*'",
            r'"colorImages"\s*:\s*(\{.*?\}),\s*"',
            r'"hiRes"\s*:\s*"(https://m\.media-amazon\.com/images/I/[^"]+)"',
        ):
            for match in re.finditer(pattern, html, re.DOTALL):
                blob = match.group(1)
                if blob.startswith("http"):
                    if blob not in image_urls:
                        image_urls.append(blob)
                    continue
                try:
                    # colorImages is JS-ish; extract https image URLs
                    for img_url in re.findall(
                        r"https://m\.media-amazon\.com/images/I/[A-Za-z0-9+%,._-]+", blob
                    ):
                        # Prefer larger variants (skip tiny thumbnails)
                        if any(x in img_url for x in ("_SX38_", "_SY50_", "sprite", "nav-sprite")):
                            continue
                        if img_url not in image_urls:
                            image_urls.append(img_url)
                except Exception:
                    continue

        # Filter junk / chrome assets
        filtered = [
            u
            for u in image_urls
            if "sprite" not in u.lower()
            and "gno/" not in u.lower()
            and "x-site" not in u.lower()
            and "transparent-pixel" not in u.lower()
        ]

        if not filtered and not title:
            return None

        if filtered:
            return {
                "title": title or "Amazon Fashion Garment",
                "brand": brand,
                "price": price,
                "site_name": "Amazon Fashion",
                "images": list(dict.fromkeys(filtered))[:10],
            }
    except Exception as e:
        logger.warning(f"Amazon specialized parser failed: {e}")

    return None


def parse_json_ld(soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
    """Extract Product schema from JSON-LD scripts."""
    scripts = soup.find_all("script", type="application/ld+json")
    for script in scripts:
        if not script.string:
            continue
        try:
            data = json.loads(script.string)
            items = data if isinstance(data, list) else [data]
            for item in items:
                if not isinstance(item, dict):
                    continue
                item_type = str(item.get("@type", ""))
                if "Product" in item_type or "ItemPage" in item_type:
                    title = item.get("name") or item.get("title")
                    images = item.get("image") or []
                    if isinstance(images, str):
                        images = [images]
                    elif isinstance(images, dict):
                        images = [images.get("url", "")]

                    brand_info = item.get("brand")
                    brand = brand_info.get("name") if isinstance(brand_info, dict) else brand_info

                    offers = item.get("offers")
                    price = None
                    if isinstance(offers, dict):
                        p = offers.get("price")
                        curr = offers.get("priceCurrency", "")
                        if p:
                            price = f"{curr} {p}".strip()
                    elif isinstance(offers, list) and len(offers) > 0:
                        p = offers[0].get("price")
                        curr = offers[0].get("priceCurrency", "")
                        if p:
                            price = f"{curr} {p}".strip()

                    if images:
                        return {
                            "title": title or "E-Commerce Garment",
                            "brand": brand,
                            "price": price,
                            "site_name": "Product Schema",
                            "images": [img for img in images if img],
                        }
        except Exception:
            continue

    return None


def parse_opengraph(soup: BeautifulSoup, base_url: str) -> Optional[Dict[str, Any]]:
    """Extract metadata using OpenGraph and Twitter card meta tags."""
    title_tag = (
        soup.find("meta", property="og:title")
        or soup.find("meta", attrs={"name": "twitter:title"})
        or soup.find("title")
    )
    title = ""
    if title_tag:
        title = title_tag.get("content", "") or title_tag.text

    img_tags = soup.find_all("meta", property="og:image") or soup.find_all("meta", attrs={"name": "twitter:image"})
    images = []
    for tag in img_tags:
        content = tag.get("content", "")
        if content:
            images.append(clean_image_url(content, base_url))

    site_name_tag = soup.find("meta", property="og:site_name")
    site_name = site_name_tag.get("content") if site_name_tag else urlparse(base_url).netloc.replace("www.", "")

    if images:
        return {
            "title": title.strip() or "Imported Garment",
            "brand": site_name.capitalize(),
            "price": None,
            "site_name": site_name,
            "images": images,
        }

    return None


def parse_generic_images(soup: BeautifulSoup, base_url: str) -> List[str]:
    """Fallback: look for large product images in <img> tags."""
    images = []
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-large_image")
        if not src:
            continue
        full_url = clean_image_url(src, base_url)
        alt = (img.get("alt") or "").lower()
        cls = " ".join(img.get("class", [])).lower()
        img_id = (img.get("id") or "").lower()

        # Heuristic keywords for main product images
        if any(kw in alt or kw in cls or kw in img_id for kw in ["product", "garment", "pdp", "main", "detail", "hero", "front"]):
            images.append(full_url)
        elif any(ext in full_url.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"]) and not any(
            skip in full_url.lower() for skip in ["logo", "icon", "banner", "avatar", "badge", "svg"]
        ):
            images.append(full_url)

    return list(dict.fromkeys(images))[:10]  # Deduplicate keeping order


async def extract_garment_from_url(url: str, selected_image_index: int = 0) -> Dict[str, Any]:
    """
    Extract garment details and high-resolution garment image from URL.
    Downloads the image, saves locally into UPLOAD_DIR/garments, and returns structured data.
    """
    clean_url = url.strip()
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = "https://" + clean_url

    parsed_domain = urlparse(clean_url).netloc.lower()

    # Check if URL is direct image link
    is_direct_image = any(clean_url.lower().rsplit("?", 1)[0].endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])

    extracted_data = None

    if is_direct_image:
        extracted_data = {
            "title": f"Garment from {parsed_domain}",
            "brand": parsed_domain.replace("www.", "").capitalize(),
            "price": None,
            "site_name": parsed_domain.replace("www.", ""),
            "images": [clean_url],
        }
    else:
        try:
            content, content_type, final_url = await fetch_page(clean_url)

            if "image/" in content_type:
                extracted_data = {
                    "title": f"Garment from {parsed_domain}",
                    "brand": parsed_domain.replace("www.", "").capitalize(),
                    "price": None,
                    "site_name": parsed_domain.replace("www.", ""),
                    "images": [final_url],
                }
            else:
                html = content if isinstance(content, str) else content.decode("utf-8", errors="ignore")
                soup = BeautifulSoup(html, "html.parser")

                # Try domain-specific parsers first
                if "myntra.com" in parsed_domain:
                    extracted_data = parse_myntra(html, final_url)
                elif "amazon." in parsed_domain:
                    extracted_data = parse_amazon(html, final_url)

                # Fallback 1: JSON-LD Product schema
                if not extracted_data:
                    extracted_data = parse_json_ld(soup)

                # Fallback 2: OpenGraph / Twitter metadata
                if not extracted_data:
                    extracted_data = parse_opengraph(soup, final_url)

                # Fallback 3: Generic image heuristics
                if not extracted_data:
                    fallback_imgs = parse_generic_images(soup, final_url)
                    if fallback_imgs:
                        extracted_data = {
                            "title": soup.title.string.strip() if soup.title and soup.title.string else "Extracted Garment",
                            "brand": parsed_domain.replace("www.", "").capitalize(),
                            "price": None,
                            "site_name": parsed_domain.replace("www.", ""),
                            "images": fallback_imgs,
                        }

        except Exception as e:
            logger.error(f"Failed to fetch page {clean_url}: {e}")
            raise ValueError(f"Could not reach or parse product link: {str(e)}")

    if not extracted_data or not extracted_data.get("images"):
        raise ValueError("No valid garment image could be extracted from the provided URL.")

    all_images = extracted_data["images"]
    chosen_image_url = all_images[selected_image_index] if selected_image_index < len(all_images) else all_images[0]

    # Download chosen garment image
    try:
        async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15.0, verify=False) as client:
            img_resp = await client.get(chosen_image_url)
            img_resp.raise_for_status()
            img_bytes = img_resp.content

        # Process & validate image with Pillow
        img = Image.open(io.BytesIO(img_bytes))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Save to UPLOAD_DIR/garments
        garment_id = f"link_{uuid.uuid4().hex[:10]}"
        output_filename = f"{garment_id}.jpg"
        output_path = UPLOAD_DIR / "garments" / output_filename
        output_path.parent.mkdir(parents=True, exist_ok=True)

        img.save(output_path, format="JPEG", quality=92)
        local_garment_url = f"/uploads/garments/{output_filename}"

        title = extracted_data.get("title") or "Imported Garment"
        category = infer_category(title)

        return {
            "success": True,
            "id": garment_id,
            "title": title,
            "brand": extracted_data.get("brand") or "Fashion Store",
            "price": extracted_data.get("price"),
            "site_name": extracted_data.get("site_name") or parsed_domain,
            "category": category,
            "garment_url": local_garment_url,
            "source_url": clean_url,
            "all_images": all_images[:6],  # limit to top 6 images for selection
            "width": img.width,
            "height": img.height,
        }

    except Exception as e:
        logger.error(f"Failed to download extracted image {chosen_image_url}: {e}")
        raise ValueError(f"Extracted image could not be downloaded: {str(e)}")
