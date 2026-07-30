# E-Commerce Garment Scraper Notes

**Last verified:** 2026-07-30 (live HTTP probes from this repo’s `link_parser.py`)  
**Endpoint:** `POST /api/v1/extract-garment` → `link_parser.extract_garment_from_url`  
**Stack:** `httpx` + `BeautifulSoup` only (no headless browser)

Target store list (product): **Myntra, Ajio, Amazon Fashion (amazon.in), Flipkart, Meesho, Nykaa Fashion, Tata CLiQ.**

---

## Parsing pipeline (order)

1. Direct image URL (`.jpg` / `.jpeg` / `.png` / `.webp`)
2. Domain-specific parser (if any)
3. JSON-LD `Product` / `ItemPage` schema
4. OpenGraph / Twitter meta tags
5. Generic `<img>` heuristics (weak; often grabs chrome/sprites)

---

## Per-site research

### Myntra — **WORKS (best)**

| | |
|--|--|
| **Structured data** | Yes: `window.__myx` / `pdpData` (custom). Also JSON-LD Product + OpenGraph. |
| **Strategy used** | Specialized `parse_myntra` first → high-res `myntassets` templates (`h_1440`, `w_1080`). |
| **Anti-bot** | Occasional captcha signals in HTML, but PDP HTML is still returned for many product URLs. |
| **Image type** | **Mostly lifestyle / model-on photos.** Gallery often includes multiple angles; first image is rarely a true flat-lay. **Not ideal VTON input** unless user picks a cleaner view. |
| **Live test** | TOXA tee: title + brand + price + 5 images @ 1080×1440. Roadster tee: same pattern. |

### Amazon Fashion (amazon.in) — **PARTIAL (improved)**

| | |
|--|--|
| **Structured data** | Product JSON-LD / usable OG **usually absent** on fashion PDPs. |
| **Strategy used** | Specialized `parse_amazon`: `#productTitle`, `#bylineInfo`, `.a-price`, `#landingImage` (`data-old-hires`, `data-a-dynamic-image`), regex over `colorImages` / `hiRes` media URLs. Filters nav sprites. |
| **Anti-bot** | Soft blocking / CAPTCHA possible at scale. Search + many PDPs still return full HTML with browser UA. |
| **Image type** | **Mixed.** Pack shots exist; many apparel listings lead with **model lifestyle** photos. Thumbnails are tiny; we prefer hi-res `media-amazon` URLs. |
| **Live test (before specialized parser)** | Generic path “succeeded” but saved **nav-sprite PNG** — invalid. |
| **After specialized parser (verified)** | `Lux Cozi Men Cotton Solid Regular Fit Polo Shirt` · brand Lux Cozi · price ₹859.00 · image 1200×1468 · `site_name` Amazon Fashion. |
| **Tradeoff** | No headless browser yet. If Amazon tightens bot checks, need Playwright + residential proxy (cost/complexity ↑). |

### Ajio — **BLOCKED**

| | |
|--|--|
| **Structured data** | Unknown from this environment (cannot fetch). |
| **Live result** | `403 Forbidden` on product + category URLs with plain HTTP. |
| **Likely need** | Headless browser and/or official APIs. Not implemented. |

### Flipkart — **BLOCKED / UNUSABLE**

| | |
|--|--|
| **Structured data** | Category/search often 403. Fake PDP URLs return generic shell with **no** LD/OG product data. |
| **Live result** | No reliable product image/title without browser session. |
| **Tradeoff** | Playwright + cookie/session handling; high maintenance. |

### Meesho — **BLOCKED**

| | |
|--|--|
| **Live result** | `403 Forbidden` on listing/product-like URLs. |
| **Likely need** | Headless + anti-bot mitigation. |

### Nykaa Fashion — **BLOCKED**

| | |
|--|--|
| **Live result** | `403 Forbidden` on site root and category pages. |
| **Likely need** | Headless browser. |

### Tata CLiQ — **BLOCKED (JS/Cloudflare shell)**

| | |
|--|--|
| **Live result** | Short HTML shell (`cloudflare` / enable-JS signals). OG falls back to site icon, not a garment. |
| **Likely need** | Headless browser that executes JS and passes challenge. |

---

## Cost / complexity tradeoffs (do not pick silently)

| Approach | Pros | Cons |
|----------|------|------|
| **Current: plain HTTP** | Free, simple, fast | Fails on Ajio/Flipkart/Meesho/Nykaa/Tata CLiQ; fragile on Amazon |
| **Headless (Playwright/Puppeteer)** | Can pass many JS walls | RAM/CPU, slower, ban risk, more ops, legal ToS grey area |
| **Official/affiliate APIs** | Stable metadata | Partnerships, keys, limited image rights |
| **User paste of direct image URL** | Always works when CDN allows | No price/title from PDP |

**Recommendation for portfolio demo:** keep HTTP scrapers for **Myntra** (+ improved Amazon), show blocked stores in UI as supported targets, document failures honestly, and allow **direct image URL** import as the reliable escape hatch.

---

## Lifestyle vs flat-lay (VTON validity)

| Source | Typical image | Valid isolated VTON garment? |
|--------|---------------|------------------------------|
| Myntra gallery | Model wearing item (+ other pieces) | **Often no** — lifestyle |
| Amazon Fashion | Model or pack shot | **Mixed** |
| Direct CDN / user upload | User-controlled | **Yes if flat-lay** |
| Generic OG/JSON-LD | Whatever merchant set as hero | **Often lifestyle** |

**Product implication:** multi-view picker in Step 2 is important; prefer product-only / ghost-mannequin when available. Long-term: garment isolation / segmentation before IDM-VTON.

---

## Not in target list (README legacy claims)

- **Zara** — bot challenge shell (`bm-verify`); not usable with plain HTTP.
- **Shopify stores** — often JSON-LD Product works when HTML is public; not specialized.
- **H&M** — not audited in this pass.

---

## How to re-test

```bash
cd backend && source .venv/bin/activate
python -c "
import asyncio
from link_parser import extract_garment_from_url

async def t(url):
    try:
        d = await extract_garment_from_url(url)
        print(d['title'], d.get('price'), d.get('site_name'), d['garment_url'], d.get('width'), d.get('height'))
    except Exception as e:
        print('FAIL', e)

asyncio.run(t('https://www.myntra.com/tshirts/toxa/toxa-unisex-typography-puff-print-half-sleeve-oversized-casual-t-shirt/44497035/buy'))
"
```
