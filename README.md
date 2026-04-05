# DreamWeaver

AI-powered video generation platform — turn your ideas into stories and videos in minutes.

**"从想法到视频"** — input a topic, and AI generates the outline, story, keyframe images, and final video for you.

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI + SQLAlchemy + SQLite |
| Text AI | DeepSeek |
| Image/Video AI | MiniMax |

---

## Project Structure

```
dreamweaver-frontend/   React frontend (Vite dev server on :5173)
dreamweaver-backend/     FastAPI backend (uvicorn on :8000)
CLAUDE.md               Development guide & architecture docs
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- DeepSeek API key
- MiniMax API key

### Frontend

```bash
cd dreamweaver-frontend
npm install
npm run dev       # http://localhost:5173
```

### Backend

```bash
cd dreamweaver-backend
# Activate venv first
./.venv/Scripts/python.exe -m pip install -r requirements.txt
./.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Configuration

Create `dreamweaver-backend/.env`:

```
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
DATABASE_URL=sqlite:///./dreamweaver.db
SECRET_KEY=your-secret-key
DEEPSEEK_API_KEY=your-deepseek-key
MODEL_OUTLINE=deepseek-xxx
MODEL_STORY=deepseek-xxx
MODEL_KEYFRAMES=deepseek-xxx
MINIMAX_API_KEY=your-minimax-key
MINIMAX_IMAGE_MODEL=image-01
MINIMAX_VIDEO_MODEL=video-01
```

---

## Feature Pipeline

```
主题输入 → AI大纲生成 → AI故事生成 → AI关键帧生成 → AI视频生成
  INPUT    →   OUTLINE    →    STORY     →   KEYFRAMES    →   VIDEO
```

- **Input**: Choose a template or write freely, press Enter or click to start
- **Outline**: View/edit chapter outline, save versions
- **Story**: Read/edit the generated long-form story, save versions
- **Keyframes**: View 3 AI-generated scene images with descriptions
- **Video**: Watch and download the final AI-generated video

Additional features:
- User authentication (register, login, avatar, password change)
- Project save & load
- Version history per project
- Responsive design (desktop + mobile)

---

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register |
| `/auth/login` | POST | Login |
| `/auth/me` | GET | Current user |
| `/api/projects` | GET | List projects |
| `/api/projects/{id}` | GET | Load project |
| `/api/generate/outline` | POST | Generate outline |
| `/api/generate/story` | POST | Generate story |
| `/api/generate/keyframes` | POST | Generate keyframes |
| `/api/generate/video` | POST | Generate video |

See `dreamweaver-backend/API_INTERFACE.md` for full API documentation.

---

## Development Notes

- Frontend Vite proxy maps `/dreamweaver-api/*` → `http://127.0.0.1:8000/*`
- Media files (avatars, generated images/videos) are served statically from `dreamweaver-backend/media/`
- Database uses lazy migrations (ALTER TABLE on startup if columns missing)
- All auth-protected endpoints require `Authorization: Bearer <token>` header
