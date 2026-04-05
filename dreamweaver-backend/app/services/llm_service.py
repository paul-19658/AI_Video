import json
import base64
import re
import time
import httpx
from typing import Optional

import google.generativeai as genai
import openai
import requests

from app.config import (
    GEMINI_API_KEY,
    DEEPSEEK_API_KEY,
    MINIMAX_API_KEY,
    MODEL_OUTLINE,
    MODEL_STORY,
    MODEL_KEYFRAMES,
    MODEL_IMAGE,
    MINIMAX_IMAGE_MODEL,
    MINIMAX_IMAGE_ASPECT_RATIO,
    MINIMAX_IMAGE_RESPONSE_FORMAT,
    MINIMAX_IMAGE_N,
    MINIMAX_IMAGE_PROMPT_OPTIMIZER,
    MINIMAX_IMAGE_AIGC_WATERMARK,
    MINIMAX_VIDEO_MODEL,
    MINIMAX_VIDEO_DURATION,
    MINIMAX_VIDEO_RESOLUTION,
    MINIMAX_VIDEO_POLL_INTERVAL,
    MINIMAX_VIDEO_MAX_POLLS,
)


def _get_deepseek_client():
    if not DEEPSEEK_API_KEY:
        raise RuntimeError("未配置 DEEPSEEK_API_KEY")
    client = openai.OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com/v1"
    )
    return client


def _get_gemini_model(name: str):
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel(name)


def _generate_with_model(model_name: str, prompt: str, response_format: str = "text", temperature: float = 0.7) -> str:
    """Generate content using configured model (MiniMax or DeepSeek)"""
    if model_name.startswith("MiniMax"):
        return _generate_with_minimax(prompt, response_format, temperature)
    else:
        return _generate_with_deepseek(model_name, prompt, response_format, temperature)


def _generate_with_minimax(prompt: str, response_format: str = "text", temperature: float = 0.7) -> str:
    """Generate content using MiniMax API (using requests)"""
    extra_data = {}
    if response_format == "json":
        extra_data["response_format"] = {"type": "json_object"}
    
    resp = requests.post(
        'https://api.minimax.chat/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {MINIMAX_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'model': 'MiniMax-M2.5',
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': temperature,
            'max_tokens': 8000,
            **extra_data
        },
        timeout=60
    )
    
    if resp.status_code != 200:
        raise Exception(f"MiniMax API error: {resp.status_code}")
    
    data = resp.json()
    return data['choices'][0]['message']['content']


def _generate_with_deepseek(model_name: str, prompt: str, response_format: str = "text", temperature: float = 0.7) -> str:
    """Generate content using DeepSeek API"""
    client = _get_deepseek_client()

    messages = [
        {"role": "user", "content": prompt}
    ]

    params = {
        "model": model_name,
        "messages": messages,
        "temperature": temperature,
    }

    if response_format == "json":
        params["response_format"] = {"type": "json_object"}

    try:
        response = client.chat.completions.create(**params)
        content = response.choices[0].message.content
        if content is None:
            raise Exception("Empty response from model")
        return content
    except Exception as e:
        # DeepSeek 鉴权异常时，自动回退到 MiniMax，避免主链路中断
        msg = str(e).lower()
        auth_failed = (
            "authentication fails" in msg
            or "invalid api key" in msg
            or "unauthorized" in msg
            or "governor" in msg
            or "authentication" in msg
        )
        if auth_failed and MINIMAX_API_KEY:
            return _generate_with_minimax(prompt, response_format, temperature)
        raise


def generate_outline(theme: str) -> dict:
    """Generate story outline from theme."""
    import logging
    logger = logging.getLogger(__name__)
    
    prompt = f'''基于这个主题创建专业的电影故事大纲："{theme}"。
请以结构化的JSON格式返回大纲，包含"title"和"chapters"数组（包含5个关键章节描述）。
确保"chapters"是字符串数组，而不是对象数组。
只返回有效的JSON，不要markdown或额外文本。'''
    
    try:
        response_text = _generate_with_model(MODEL_OUTLINE, prompt, response_format="json", temperature=0.7)
    except Exception as e:
        logger.error(f"Error generating outline: {e}")
        raise Exception(f"生成大纲失败: {str(e)}")
    
    text = response_text.strip()
    logger.info(f"Raw response: {text[:200]}...")
    
    # Handle potential markdown code blocks
    if "```" in text:
        text = re.sub(r"```json?\s*", "", text).replace("```", "").strip()
    
    try:
        result = json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}, text: {text}")
        raise Exception(f"解析响应失败: {str(e)}")
    
    # Ensure chapters is an array of strings, not objects
    if "chapters" in result and isinstance(result["chapters"], list):
        processed_chapters = []
        for chapter in result["chapters"]:
            if isinstance(chapter, str):
                processed_chapters.append(chapter)
            elif isinstance(chapter, dict):
                # If it's an object, extract the text content
                if "chapter" in chapter:
                    processed_chapters.append(str(chapter["chapter"]))
                elif "description" in chapter:
                    processed_chapters.append(str(chapter["description"]))
                else:
                    # Get the first value from the object
                    processed_chapters.append(str(next(iter(chapter.values()))))
            else:
                processed_chapters.append(str(chapter))
        result["chapters"] = processed_chapters
    
    return result


def generate_long_story(outline: dict) -> str:
    """Generate long-form story from outline."""
    chapters = outline.get("chapters", [])
    title = outline.get("title", "Untitled")
    prompt = f'''基于以下名为"{title}"的大纲，写一个详细、引人入胜的长篇叙述。
确保故事具有情感共鸣和生动的视觉描述。
章节: {', '.join(chapters)}'''
    
    response_text = _generate_with_model(MODEL_STORY, prompt, temperature=0.8)
    return response_text or ""


def generate_keyframe_scenes(long_story: str) -> list[dict]:
    """Extract key visual moments from story."""
    prompt = f'''分析这个故事并识别3个关键的视觉时刻来概括叙述。
对每个时刻，请提供：
1. "description": 场景的简短描述。
2. "visual_prompt": 用于AI图像生成器创建电影级16:9视觉效果的高度详细提示。
只返回包含"description"和"visual_prompt"键的3个对象的JSON数组。不要markdown或额外文本。

故事:
{long_story[:12000]}'''  # Truncate very long stories
    
    response_text = _generate_with_model(MODEL_KEYFRAMES, prompt, response_format="json", temperature=0.7)
    text = response_text.strip()
    if "```" in text:
        text = re.sub(r"```json?\s*", "", text).replace("```", "").strip()
    data = json.loads(text)
    return data if isinstance(data, list) else [data]


def generate_image(prompt: str) -> str:
    """
    文生图：MiniMax /v1/image_generation。
    默认返回 URL；若配置 response_format=base64，则返回 data URL。
    """
    if not MINIMAX_API_KEY:
        raise RuntimeError("未配置 MINIMAX_API_KEY，无法生成图片。")

    full_prompt = (
        f"Cinematic high-quality digital art: {prompt}. "
        "Cinematic lighting, 8k resolution, photorealistic, wide angle."
    )
    payload = {
        "model": MINIMAX_IMAGE_MODEL,
        "prompt": full_prompt[:1500],
        "aspect_ratio": MINIMAX_IMAGE_ASPECT_RATIO,
        "response_format": MINIMAX_IMAGE_RESPONSE_FORMAT,
        "n": MINIMAX_IMAGE_N,
        "prompt_optimizer": MINIMAX_IMAGE_PROMPT_OPTIMIZER,
        "aigc_watermark": MINIMAX_IMAGE_AIGC_WATERMARK,
    }

    resp = requests.post(
        "https://api.minimaxi.com/v1/image_generation",
        headers={
            "Authorization": f"Bearer {MINIMAX_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"MiniMax 图片生成失败: HTTP {resp.status_code} {resp.text}")

    result = resp.json()
    base_resp = result.get("base_resp") or {}
    status_code = base_resp.get("status_code")
    if status_code not in (0, "0"):
        status_msg = base_resp.get("status_msg") or "unknown error"
        raise RuntimeError(f"MiniMax 图片生成失败: {status_msg} (code={status_code})")

    data = result.get("data") or {}
    if MINIMAX_IMAGE_RESPONSE_FORMAT == "base64":
        image_b64_list = data.get("images_base64") or data.get("image_base64")
        if isinstance(image_b64_list, list) and image_b64_list:
            return f"data:image/png;base64,{image_b64_list[0]}"
        if isinstance(image_b64_list, str) and image_b64_list:
            return f"data:image/png;base64,{image_b64_list}"
        raise RuntimeError(f"MiniMax 返回中缺少 base64 图像数据: {result}")

    image_urls = data.get("image_urls") or []
    if image_urls:
        return image_urls[0]
    raise RuntimeError(f"MiniMax 返回中缺少 image_urls: {result}")


def generate_video(prompt: str, image_base64: Optional[str] = None) -> str:
    """
    文生视频 / 图生视频：MiniMax 异步 API（创建任务 → 轮询 → 取下载链接）。
    需在环境变量中配置 MINIMAX_API_KEY。详见 MINIMAX_VIDEO_API.md。
    """
    if not MINIMAX_API_KEY:
        raise RuntimeError("未配置 MINIMAX_API_KEY，无法生成视频。")

    base = "https://api.minimaxi.com"
    headers = {
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict = {
        "prompt": prompt,
        "model": MINIMAX_VIDEO_MODEL,
        "duration": MINIMAX_VIDEO_DURATION,
        "resolution": MINIMAX_VIDEO_RESOLUTION,
    }
    if image_base64:
        img = image_base64.strip()
        if not img.startswith("data:"):
            img = f"data:image/png;base64,{img}"
        payload["first_frame_image"] = img

    resp = requests.post(
        f"{base}/v1/video_generation",
        headers=headers,
        json=payload,
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"MiniMax 创建视频任务失败: HTTP {resp.status_code} {resp.text}")

    body = resp.json()
    task_id = body.get("task_id")
    if not task_id:
        raise RuntimeError(f"响应中无 task_id: {body}")

    query_url = f"{base}/v1/query/video_generation"
    file_id: Optional[str] = None
    for attempt in range(MINIMAX_VIDEO_MAX_POLLS):
        if attempt > 0:
            time.sleep(MINIMAX_VIDEO_POLL_INTERVAL)
        q = requests.get(
            query_url,
            headers=headers,
            params={"task_id": task_id},
            timeout=60,
        )
        if q.status_code != 200:
            raise RuntimeError(f"查询任务状态失败: HTTP {q.status_code} {q.text}")
        qj = q.json()
        status = (qj.get("status") or "").strip()
        if status.lower() == "success":
            file_id = qj.get("file_id")
            break
        if status.lower() == "fail":
            err = qj.get("error_message") or qj.get("message") or "未知错误"
            raise RuntimeError(f"视频生成失败: {err}")

    if not file_id:
        raise RuntimeError("视频生成超时，请稍后重试或调大 MINIMAX_VIDEO_MAX_POLLS。")

    fr = requests.get(
        f"{base}/v1/files/retrieve",
        headers=headers,
        params={"file_id": file_id},
        timeout=60,
    )
    if fr.status_code != 200:
        raise RuntimeError(f"获取视频文件信息失败: HTTP {fr.status_code} {fr.text}")
    fj = fr.json()
    download_url = (fj.get("file") or {}).get("download_url")
    if not download_url:
        raise RuntimeError(f"响应中无 download_url: {fj}")
    return download_url
