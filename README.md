# VOILE ✨

**AI-Powered Virtual Try-On Fashion Platform**

VOILE is a cutting-edge fashion technology platform that lets users virtually try on garments using AI. Upload a model photo and a garment image, and watch the AI seamlessly blend them into a realistic runway-ready look.

## 🏗️ Project Structure

```
Voile/
├── Aura/          # Frontend — React + Vite + TypeScript
│   ├── src/
│   │   ├── components/   # UI components (Studio steps, layouts)
│   │   ├── lib/          # Utilities and data
│   │   └── App.tsx       # Main application
│   └── ...
├── backend/       # Backend — Python FastAPI
│   ├── inference/        # AI inference providers (HuggingFace IDM-VTON)
│   ├── preprocessing/    # Image preprocessing pipeline
│   ├── main.py           # FastAPI application
│   ├── tasks.py          # Async job processing (Redis + RQ)
│   ├── database.py       # SQLite with WAL mode
│   └── ...
└── README.md
```

## 🚀 Getting Started

### Frontend
```bash
cd Aura
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Configure your API keys
uvicorn main:app --reload
```

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React, TypeScript, Vite, TailwindCSS |
| Backend    | Python, FastAPI, Redis, RQ, SQLite  |
| AI Engine  | HuggingFace IDM-VTON (Virtual Try-On) |

## 📄 License

MIT
