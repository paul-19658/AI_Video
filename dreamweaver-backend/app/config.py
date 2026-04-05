import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from backend directory
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
BACKEND_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,"
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
).split(",")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# LLM model names (adjust based on your API provider)
# 默认使用 deepseek-chat
MODEL_OUTLINE = os.getenv("MODEL_OUTLINE", "deepseek-chat")
MODEL_STORY = os.getenv("MODEL_STORY", "deepseek-chat")
MODEL_KEYFRAMES = os.getenv("MODEL_KEYFRAMES", "deepseek-chat")
MODEL_IMAGE = os.getenv("MODEL_IMAGE", "gemini-2.0-flash")
MODEL_VIDEO = os.getenv("MODEL_VIDEO", "veo-3.1-fast-generate-preview")

# 本地媒体落盘
PROJECT_ROOT = Path(__file__).resolve().parent.parent
UPLOADS_ROOT = os.getenv("UPLOADS_ROOT", str(PROJECT_ROOT / "uploads"))
GENERATED_MEDIA_ROOT = os.getenv("GENERATED_MEDIA_ROOT", str(PROJECT_ROOT / "media" / "generated"))
GENERATED_MEDIA_URL_PREFIX = os.getenv("GENERATED_MEDIA_URL_PREFIX", "/media/generated")
ASSET_DOWNLOAD_TIMEOUT_SECONDS = int(os.getenv("ASSET_DOWNLOAD_TIMEOUT_SECONDS", "120"))
ASSET_DOWNLOAD_RETRIES = int(os.getenv("ASSET_DOWNLOAD_RETRIES", "2"))

# MiniMax 图片生成（见 MINIMAX_IMAGE_API.md）
MINIMAX_IMAGE_MODEL = os.getenv("MINIMAX_IMAGE_MODEL", "image-01")
MINIMAX_IMAGE_ASPECT_RATIO = os.getenv("MINIMAX_IMAGE_ASPECT_RATIO", "16:9")
MINIMAX_IMAGE_RESPONSE_FORMAT = os.getenv("MINIMAX_IMAGE_RESPONSE_FORMAT", "url")
MINIMAX_IMAGE_N = int(os.getenv("MINIMAX_IMAGE_N", "1"))
MINIMAX_IMAGE_PROMPT_OPTIMIZER = os.getenv("MINIMAX_IMAGE_PROMPT_OPTIMIZER", "false").lower() == "true"
MINIMAX_IMAGE_AIGC_WATERMARK = os.getenv("MINIMAX_IMAGE_AIGC_WATERMARK", "false").lower() == "true"

# MiniMax 视频生成（见 MINIMAX_VIDEO_API.md）
MINIMAX_VIDEO_MODEL = os.getenv("MINIMAX_VIDEO_MODEL", "MiniMax-Hailuo-2.3")
MINIMAX_VIDEO_DURATION = int(os.getenv("MINIMAX_VIDEO_DURATION", "6"))
MINIMAX_VIDEO_RESOLUTION = os.getenv("MINIMAX_VIDEO_RESOLUTION", "1080P")
MINIMAX_VIDEO_POLL_INTERVAL = int(os.getenv("MINIMAX_VIDEO_POLL_INTERVAL", "10"))
MINIMAX_VIDEO_MAX_POLLS = int(os.getenv("MINIMAX_VIDEO_MAX_POLLS", "60"))
