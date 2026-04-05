"""
Generated media storage utilities
"""
import base64
import os
import shutil
from pathlib import Path
from urllib.parse import urlparse
import requests

from app.config import (
    GENERATED_MEDIA_ROOT,
    GENERATED_MEDIA_URL_PREFIX,
    ASSET_DOWNLOAD_TIMEOUT_SECONDS,
    ASSET_DOWNLOAD_RETRIES,
)

_MEDIA_ROOT = Path(GENERATED_MEDIA_ROOT)
_IMAGES_ROOT = _MEDIA_ROOT / "images"
_VIDEOS_ROOT = _MEDIA_ROOT / "videos"


def _ensure_dirs(project_id: str):
    image_dir = _IMAGES_ROOT / project_id
    video_dir = _VIDEOS_ROOT / project_id
    image_dir.mkdir(parents=True, exist_ok=True)
    video_dir.mkdir(parents=True, exist_ok=True)
    return image_dir, video_dir


def _public_url(local_path: Path) -> str:
    rel = local_path.relative_to(_MEDIA_ROOT).as_posix()
    return f"{GENERATED_MEDIA_URL_PREFIX.rstrip('/')}/{rel}"


def _download_bytes(url: str) -> bytes:
    last_error = None
    for _ in range(ASSET_DOWNLOAD_RETRIES + 1):
        try:
            resp = requests.get(url, timeout=ASSET_DOWNLOAD_TIMEOUT_SECONDS)
            resp.raise_for_status()
            return resp.content
        except Exception as e:
            last_error = e
    raise RuntimeError(f"下载资源失败: {last_error}")


def persist_generated_image(project_id: str, keyframe_id: str, image_ref: str) -> tuple[str, str, str]:
    """
    Persist generated image to disk.
    Returns: (source_url_or_ref, local_absolute_path, public_url)
    """
    image_dir, _ = _ensure_dirs(project_id)
    local_path = image_dir / f"{keyframe_id}.png"

    if image_ref.startswith("data:image"):
        b64 = image_ref.split(",", 1)[-1]
        content = base64.b64decode(b64)
    elif image_ref.startswith("http://") or image_ref.startswith("https://"):
        content = _download_bytes(image_ref)
        ext = os.path.splitext(urlparse(image_ref).path)[1].lower()
        if ext in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            local_path = image_dir / f"{keyframe_id}{ext}"
    else:
        raise RuntimeError("不支持的图片资源格式，仅支持 data URL 或 http(s) URL。")

    with open(local_path, "wb") as f:
        f.write(content)
    return image_ref, str(local_path), _public_url(local_path)


def persist_generated_video(project_id: str, video_id: str, video_url: str) -> tuple[str, str, str]:
    """
    Download and persist generated video to disk.
    Returns: (source_url, local_absolute_path, public_url)
    """
    _, video_dir = _ensure_dirs(project_id)
    ext = os.path.splitext(urlparse(video_url).path)[1].lower()
    if ext not in {".mp4", ".webm", ".mov"}:
        ext = ".mp4"
    local_path = video_dir / f"{video_id}{ext}"

    content = _download_bytes(video_url)
    with open(local_path, "wb") as f:
        f.write(content)
    return video_url, str(local_path), _public_url(local_path)


def remove_project_generated_assets(project_id: str):
    image_dir = _IMAGES_ROOT / project_id
    video_dir = _VIDEOS_ROOT / project_id
    if image_dir.exists():
        shutil.rmtree(image_dir, ignore_errors=True)
    if video_dir.exists():
        shutil.rmtree(video_dir, ignore_errors=True)
