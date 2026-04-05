# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DreamWeaver is an AI video generation tool — a "从想法到视频" (from idea to video) pipeline:

1. Input topic → 2. Generate outline → 3. Generate story → 4. Generate keyframe images → 5. Generate video

**Stack**: React 18 + TypeScript + Vite (frontend) / FastAPI + SQLite + SQLAlchemy (backend)
**AI**: DeepSeek (text generation), MiniMax (image/video generation)

---

## Development Commands

### Frontend (`dreamweaver-frontend/`)

```bash
npm install
npm run dev      # Dev server at http://localhost:5173
npm run build     # Production build
npm run lint      # ESLint check
```

- Base path: `/dreamweaver/` (configured in vite.config.ts)
- Vite proxies `/dreamweaver-api/...` → `http://127.0.0.1:8000/...`

### Backend (`dreamweaver-backend/`)

**IMPORTANT: Always use the `.venv` virtual environment for all Python operations.**

```bash
# Activate venv first (Windows)
./.venv/Scripts/python.exe -m pip install -r requirements.txt

# Run dev server (from dreamweaver-backend/ directory)
./.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Or with Docker
docker build -t dreamweaver-backend .
docker run -p 8000:8000 dreamweaver-backend
```

### Database

- SQLite file: `dreamweaver-backend/dreamweaver.db`
- Uses lazy migration (ALTER TABLE on startup if columns missing)

### Virtual Environment

**Always** activate `.venv` before running Python commands or installing packages:

```bash
# Verify venv is active — should show .venv path
./.venv/Scripts/python.exe --version

# Install packages (always via .venv)
./.venv/Scripts/python.exe -m pip install <package>
```

Do NOT use global `python` or `pip` — always prefix with `./.venv/Scripts/`.

---

## Architecture

```
dreamweaver-frontend/
├── src/
│   ├── App.tsx           # Main state machine (steps: INPUT→OUTLINE→STORY→KEYFRAMES→VIDEO)
│   ├── services/api.ts   # Fetch wrapper with auto token injection
│   ├── components/        # UI components
│   └── types.ts          # TypeScript interfaces

dreamweaver-backend/
├── app/
│   ├── main.py           # FastAPI app entry, CORS, static file mounting
│   ├── config.py         # .env config (DB, AI keys, media paths)
│   ├── routers/
│   │   ├── auth.py       # /auth/* (register, login, avatar, change-password)
│   │   ├── projects.py   # /api/projects/* (CRUD, versions, save outline/story/keyframes)
│   │   └── generation.py # /api/generate/* (outline, story, keyframes, video)
│   ├── services/
│   │   ├── llm_service.py   # DeepSeek + MiniMax API calls
│   │   └── file_service.py  # Persist images/videos to local storage
│   ├── database/
│   │   ├── db.py         # SQLAlchemy session
│   │   └── models.py     # ORM models (User, Project, Outline, Story, Keyframe, Video)
│   └── models/
│       └── schemas.py    # Pydantic request/response schemas
└── media/generated/      # Persisted images/videos (auto-created)
    ├── images/{project_id}/{keyframe_id}.{ext}
    └── videos/{project_id}/{video_id}.{ext}
```

---

## Key Technical Notes

### Authentication

- Login endpoint (`POST /auth/login`) uses `application/x-www-form-urlencoded`, NOT JSON
- All other auth uses JSON
- Protected endpoints require `Authorization: Bearer <token>` header
- JWT token returned at login, frontend stores it

### API Endpoints

- Auth: `/auth/register`, `/auth/login`, `/auth/me`, `/auth/avatar`, `/auth/change-password`
- Projects: `/api/projects`, `/api/projects/{id}`, `/api/projects/{id}/versions`
- Generation: `/api/generate/outline`, `/api/generate/story`, `/api/generate/keyframes`, `/api/generate/video`

### Media Access

- Generated images/videos served at `/media/generated/...` (StaticFiles mount in main.py)
- Avatars served at `/uploads/...`

### Known Issues / Refactoring Needed

- `App.tsx` is ~71KB — should be split into per-step components
- Video generation uses synchronous polling (long requests block worker)
- No Alembic migrations — uses lazy ALTER TABLE on startup
- No automated tests

---

## Environment Variables

Backend `.env` at `dreamweaver-backend/.env`:

```
BACKEND_HOST, BACKEND_PORT, CORS_ORIGINS, DATABASE_URL, SECRET_KEY
DEEPSEEK_API_KEY, MODEL_OUTLINE, MODEL_STORY, MODEL_KEYFRAMES
MINIMAX_API_KEY, MINIMAX_IMAGE_MODEL, MINIMAX_VIDEO_MODEL, MINIMAX_VIDEO_*
GENERATED_MEDIA_ROOT, GENERATED_MEDIA_URL_PREFIX
```

Frontend uses Vite env vars (`VITE_*`) for proxy configuration.
