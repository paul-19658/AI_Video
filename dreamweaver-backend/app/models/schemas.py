from pydantic import BaseModel, Field
from typing import Optional


class OutlineRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)


class StoryOutline(BaseModel):
    title: str
    chapters: list[str]


class StoryRequest(BaseModel):
    outline: StoryOutline
    project_id: Optional[str] = None
    outline_id: Optional[str] = None  # 关联的大纲 ID
    prompt: Optional[str] = None  # 项目描述（创建新项目时用）


class KeyframeScene(BaseModel):
    description: str
    visual_prompt: str


class KeyframesRequest(BaseModel):
    long_story: str = Field(..., min_length=1)
    project_id: Optional[str] = None
    story_id: Optional[str] = None  # 关联的故事 ID


class KeyframeWithImage(BaseModel):
    id: str
    description: str
    visual_prompt: str
    image_url: str


class VideoRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    image_base64: Optional[str] = None
    project_id: Optional[str] = None
    keyframe_id: Optional[str] = None  # 关联的关键帧 ID


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)
