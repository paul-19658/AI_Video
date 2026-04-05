from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import CORS_ORIGINS, GENERATED_MEDIA_ROOT, GENERATED_MEDIA_URL_PREFIX
from app.routers import generation, auth, projects
from app.database import init_db

app = FastAPI(
    title="DreamWeaver API",
    description="AI Story-to-Video generation backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(generation.router)

# Mount static files for avatars
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
if os.path.exists(uploads_dir):
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Mount generated media (images/videos) under independent route
os.makedirs(GENERATED_MEDIA_ROOT, exist_ok=True)
app.mount(GENERATED_MEDIA_URL_PREFIX, StaticFiles(directory=GENERATED_MEDIA_ROOT), name="generated-media")


@app.on_event("startup")
async def startup_event():
    # Initialize database tables
    init_db()


@app.get("/")
async def root():
    return {"status": "ok", "message": "DreamWeaver API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
