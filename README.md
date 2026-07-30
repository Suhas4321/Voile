<p align="center">
  <img src="https://img.shields.io/badge/FIT%20MIRRORS-AI%20Fashion-black?style=for-the-badge&labelColor=0a0a0a&color=D4AF37" alt="FitMirrors Badge" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/AI-IDM--VTON-FF6F00?style=for-the-badge&logo=huggingface&logoColor=white" alt="IDM-VTON" />
</p>

<h1 align="center">FIT MIRRORS ✦ AI Virtual Try-On Studio</h1>

<p align="center">
  <em>Haute couture meets generative AI — upload a photo, pick a garment, see yourself wearing it in seconds.</em>
</p>

<p align="center">
  <a href="#-demo-video">Demo Video</a> •
  <a href="#-what-is-fitmirrors">What is FitMirrors?</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-features">Features</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-tech-details">Tech Details</a> •
  <a href="#-project-structure">Structure</a>
</p>

---

## 🎬 Demo Video

<p align="center">
  <em>Demo video coming soon — see FitMirrors virtual fitting studio in action!</em>
</p>

---

## 🪞 What is FitMirrors?

**FitMirrors** is a full-stack AI-powered virtual try-on platform that lets you see how any garment looks on your body — without physically wearing it. Upload a clear photo of yourself (or use a preset model), select a garment from the curated luxury collection or upload your own, and the AI generates a photorealistic image of you wearing that outfit.

This isn't a simple overlay or crop-and-paste. FitMirrors uses **IDM-VTON** (Image-based Diffusion Model for Virtual Try-On), a state-of-the-art generative AI model hosted on Hugging Face, to understand body shape, garment draping, fabric texture, lighting, and shadows — producing results that look like real photographs.

**Who is this for?**
- 🛍️ **Online shoppers** — see how clothes actually look on you before buying
- 👗 **Fashion designers** — quickly visualize designs on different body types
- 🏪 **E-commerce stores** — offer virtual fitting rooms to reduce returns
- 🎨 **Creatives** — experiment with outfit combinations and styling

---

## 🔮 How It Works

FitMirrors follows a **4-step studio workflow** designed to feel like a luxury fitting experience:

| Step | Name | What Happens |
|------|------|-------------|
| **01** | **Model Studio** | Upload a full-body photo or choose from preset models. The system accepts front-facing shots for optimal results. |
| **02** | **Wardrobe Closet** | Browse the curated garment collection or upload your own clothing item (JPEG, PNG, or WebP). |
| **03** | **Neural Fitting** | The AI engine processes both images — analyzing body pose, garment shape, and fabric — then renders the try-on. Progress is shown in real-time. |
| **04** | **Runway Showcase** | View the photorealistic result with a before/after comparison. Save your favorite fits or regenerate with different settings. |

---

## ✨ Features

### Frontend — *Aura*
- **Immersive glassmorphism UI** with ambient backgrounds, particle fields, and cursor spark trails
- **Kinetic typography** hero section with character-by-character blur-in animation
- **E-Commerce Link Import** — paste any product link or image URL directly into the hero or wardrobe modal to import items
- **3 lighting themes** — Neutral, Golden Hour, and Cyberpunk — with auto-rotation
- **Tilt-responsive cards** and shimmer-sweep glass panels throughout
- **Saved Fits drawer** — bookmark and revisit your favorite try-ons
- **FitMirrors Stylist** — floating AI assistant widget
- **Ambient audio toggle** for an immersive studio experience
- **Scroll progress bar** and smooth section navigation
- **Fully responsive** — works seamlessly on desktop, tablet, and mobile

### Backend
- **E-Commerce Garment Scraper** — automated link parsing & high-res image extraction for Myntra, Zara, Amazon, Ajio, Shopify, JSON-LD schema, and OpenGraph tags
- **Async job processing** — submit a try-on, poll for results; never blocks the UI
- **Provider abstraction** — swap AI engines (HuggingFace, fal.ai, self-hosted) without touching app code
- **Smart retry logic** — exponential backoff with quota-aware short-circuiting
- **Rate limiting** — configurable per-IP hourly limits (default: 10 requests/hour)
- **Image validation** — file type, size (10 MB max), and content inspection via Pillow
- **Automatic cleanup** — expired jobs and uploads are periodically purged
- **Zero-cost operation** — uses HF free tier + FakeRedis fallback; runs on 8 GB RAM

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | Frontend dev server |
| **Python** | 3.10+ | Backend runtime |
| **Redis** | 7+ | Job queue *(optional — falls back to in-memory FakeRedis)* |

### 1. Clone the repo

```bash
git clone https://github.com/Suhas4321/FitMirrors.git
cd FitMirrors
```

### 2. Start the Frontend

```bash
cd Aura
npm install
npm run dev
```

The frontend will be available at **http://localhost:5173**

### 3. Start the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env to add your HF_TOKEN (optional but recommended for higher AI quota)

# Launch the server
uvicorn main:app --reload
```

The API will be available at **http://localhost:8000**  
Interactive API docs at **http://localhost:8000/docs**

### 4. (Optional) Start a Redis worker

If you have Redis installed and want real background job processing:

```bash
# In a separate terminal, inside backend/
source .venv/bin/activate
rq worker --with-scheduler
```

> **Note:** Without Redis, the backend automatically falls back to **FakeRedis** and runs inference as a background task within the FastAPI process. This works fine for development.

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/try-on` | Submit a try-on job (multipart: `model_image` + `garment_image`) → returns `job_id` |
| `POST` | `/api/v1/extract-garment` | Extract garment image & metadata from e-commerce product URL (JSON: `{ "url": "..." }`) |
| `GET` | `/api/v1/jobs/{job_id}` | Poll job status → `pending` / `processing` / `completed` / `failed` |
| `GET` | `/api/v1/health` | Health check with Redis connectivity status |

### Example: Submit a Try-On

```bash
curl -X POST http://localhost:8000/api/v1/try-on \
  -F "model_image=@photo.jpg" \
  -F "garment_image=@shirt.png"
```

```json
{ "job_id": "a3f8c1d2e4...", "status": "pending" }
```

### Example: Poll for Result

```bash
curl http://localhost:8000/api/v1/jobs/a3f8c1d2e4...
```

```json
{
  "job_id": "a3f8c1d2e4...",
  "status": "completed",
  "result_image_url": "/uploads/results/output.png",
  "progress_message": "Try-on complete",
  "error_message": null
}
```

### Example: Extract Garment from E-Commerce Link

```bash
curl -X POST http://localhost:8000/api/v1/extract-garment \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.myntra.com/tshirts/brand/product/12345"}'
```

```json
{
  "success": true,
  "id": "link_a1b2c3d4e5",
  "title": "Oversized Cotton Graphic T-Shirt",
  "brand": "Roadster",
  "price": "₹799",
  "site_name": "Myntra",
  "category": "T-Shirt / Top",
  "garment_url": "/uploads/garments/link_a1b2c3d4e5.jpg",
  "source_url": "https://www.myntra.com/tshirts/brand/product/12345"
}
```

---

## 🔧 Tech Details

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                Browser (FitMirrors)                 │
│  React 18 + TypeScript + Vite + Tailwind CSS         │
│  Glassmorphism UI · Particle effects · Ambient audio │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (multipart uploads + JSON polling)
┌──────────────────────▼──────────────────────────────┐
│                  FastAPI Backend                     │
│  Image validation · Rate limiting · Job management   │
│  SQLite (WAL mode) · Redis/FakeRedis queue           │
└──────────────────────┬──────────────────────────────┘
                       │ Gradio Client API
┌──────────────────────▼──────────────────────────────┐
│          HuggingFace IDM-VTON Space                  │
│  Diffusion-based virtual try-on (ZeroGPU)            │
│  Auto-masking · 30-step denoising · 4K output        │
└─────────────────────────────────────────────────────┘
```

### Frontend Stack

| Technology | Role |
|-----------|------|
| **React 18** | Component framework with hooks |
| **TypeScript** | Type safety across all components |
| **Vite 5** | Lightning-fast HMR dev server and build tool |
| **Tailwind CSS 3** | Utility-first styling with custom design tokens |
| **Lucide React** | Consistent icon system |
| **Custom CSS** | Glassmorphism, kinetic animations, ambient effects |

### Backend Stack

| Technology | Role |
|-----------|------|
| **FastAPI** | Async HTTP framework with auto-generated OpenAPI docs |
| **SQLite (WAL)** | Lightweight job persistence with concurrent read support |
| **Redis + RQ** | Distributed job queue (with FakeRedis fallback) |
| **Pillow** | Image validation and content inspection |
| **BeautifulSoup4 + HTTPX** | E-commerce web scraping & garment image extraction |
| **gradio_client** | Communication with HuggingFace Spaces |
| **python-dotenv** | Environment configuration |

### AI Model

FitMirrors uses [**IDM-VTON**](https://huggingface.co/spaces/yisol/IDM-VTON) (Image-based Diffusion Model for Virtual Try-On) — a research model that:

- Takes a person image + garment flat-lay image as input
- Generates a new image showing the person wearing the garment
- Handles body pose estimation, garment warping, and texture rendering
- Runs on HuggingFace's free ZeroGPU infrastructure

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VTON_PROVIDER` | `hf_dev` | AI provider: `hf_dev` or `fal` |
| `HF_SPACE_ID` | `yisol/IDM-VTON` | HuggingFace Space for inference |
| `HF_TOKEN` | *(empty)* | HF token for 8× more daily GPU quota |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `RATE_LIMIT_PER_HOUR` | `10` | Max try-on requests per IP per hour |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allowed origin |

---

## 📁 Project Structure

```
FitMirrors/
├── Aura/                          # Frontend application
│   ├── index.html                 # Entry HTML with meta tags & fonts
│   ├── package.json               # Dependencies and scripts
│   ├── tailwind.config.js         # Custom design tokens and theme
│   ├── vite.config.ts             # Vite configuration with path aliases
│   └── src/
│       ├── App.tsx                # Root component — state management & routing
│       ├── main.tsx               # React DOM entry point
│       ├── index.css              # Global styles, glassmorphism, animations
│       ├── lib/
│       │   ├── data.ts            # Static data, types, garment/model presets
│       │   └── motion.ts          # Animation utilities
│       └── components/
│           ├── HeroHeader.tsx         # Kinetic headline + metrics bar
│           ├── TopGlassNav.tsx        # Floating glass navigation bar
│           ├── AmbientBackground.tsx  # Dynamic gradient backgrounds
│           ├── ParticleField.tsx      # Floating particle effects
│           ├── CursorSparkTrail.tsx   # Cursor trailing sparkles
│           ├── AuraStylist.tsx        # FitMirrors AI assistant widget
│           ├── ScrollProgressBar.tsx  # Page scroll indicator
│           ├── AmbientAudioToggle.tsx # Sound toggle control
│           ├── LightingDrawer.tsx     # Theme/lighting selector
│           ├── SavedFitsDrawer.tsx    # Saved try-on results panel
│           ├── ui/
│           │   ├── GlassPrimitives.tsx  # Reusable glass panel components
│           │   └── MotionWrappers.tsx   # Reveal & TiltCard wrappers
│           └── studio/
│               ├── StudioWorkspace.tsx      # 4-step pipeline container
│               ├── Step1ModelStudio.tsx      # Photo upload / model selection
│               ├── Step2WardrobeCloset.tsx   # Garment browsing & upload
│               ├── Step3NeuralFitting.tsx    # AI processing with progress
│               └── Step4RunwayShowcase.tsx   # Result viewer & comparison
│
├── backend/                       # Python FastAPI backend
│   ├── main.py                    # FastAPI app, routes, middleware
│   ├── config.py                  # Centralized env-based configuration
│   ├── database.py                # SQLite with WAL mode for job tracking
│   ├── link_parser.py             # E-commerce link scraper & garment extractor
│   ├── tasks.py                   # Background job runner (RQ integration)
│   ├── validation.py              # Image upload validation (type, size, content)
│   ├── rate_limit.py              # Per-IP sliding window rate limiter
│   ├── cleanup.py                 # Expired job & file cleanup utility
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment variable template
│   ├── inference/
│   │   ├── base.py                # Abstract VTONProvider interface
│   │   ├── hf_provider.py         # HuggingFace Space integration (IDM-VTON)
│   │   └── fal_provider.py        # fal.ai provider stub
│   └── preprocessing/
│       ├── garment_isolation.py   # Garment background removal
│       └── user_photo_matting.py  # Person photo matting
│
├── .gitignore
└── README.md
```

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">
  <strong>Built with ☕ and generative AI</strong><br>
  <sub>FitMirrors © 2026</sub>
</p>

