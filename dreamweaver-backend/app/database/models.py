"""
Database models for DreamWeaver
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=False)
    avatar = Column(String, nullable=True)  # 头像URL
    created_at = Column(DateTime, default=datetime.utcnow)
    
    projects = relationship("Project", back_populates="user")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    prompt = Column(String, nullable=False)
    title = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending/running/completed/failed
    current_step = Column(String, default="outline")  # outline/story/keyframes/video
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="projects")
    outline = relationship("Outline", back_populates="project", uselist=False)  # 最新版本
    outlines = relationship("Outline", back_populates="project")  # 所有版本
    story = relationship("Story", back_populates="project", uselist=False)  # 最新版本
    stories = relationship("Story", back_populates="project")  # 所有版本
    keyframes = relationship("Keyframe", back_populates="project")
    videos = relationship("Video", back_populates="project")


class Outline(Base):
    __tablename__ = "outlines"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    parent_id = Column(String, nullable=True)  # 父版本 ID，基于哪个版本
    title = Column(String, nullable=False)
    chapters = Column(Text, nullable=False)  # JSON array
    is_ai_generated = Column(Integer, default=1)  # 1=AI生成, 0=用户修改
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="outline")
    stories = relationship("Story", back_populates="outline")


class Story(Base):
    __tablename__ = "stories"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    outline_id = Column(String, ForeignKey("outlines.id"), nullable=False)  # 关联 Outline
    parent_id = Column(String, nullable=True)  # 父版本 ID
    content = Column(Text, nullable=False)
    is_ai_generated = Column(Integer, default=1)  # 1=AI生成, 0=用户修改
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="story")
    outline = relationship("Outline", back_populates="stories")
    keyframes = relationship("Keyframe", back_populates="story")


class Keyframe(Base):
    __tablename__ = "keyframes"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    story_id = Column(String, ForeignKey("stories.id"), nullable=False)  # 关联 Story
    parent_id = Column(String, nullable=True)  # 父版本 ID
    sequence = Column(Integer, nullable=False)  # 0, 1, 2
    description = Column(Text, nullable=True)
    visual_prompt = Column(Text, nullable=True)
    image_path = Column(String, nullable=True)
    source_image_url = Column(String, nullable=True)
    local_image_path = Column(String, nullable=True)
    download_status = Column(String, nullable=True)
    download_error = Column(Text, nullable=True)
    is_ai_generated = Column(Integer, default=1)  # 1=AI生成, 0=用户修改
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="keyframes")
    story = relationship("Story", back_populates="keyframes")
    videos = relationship("Video", back_populates="keyframe")


class Video(Base):
    __tablename__ = "videos"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    keyframe_id = Column(String, ForeignKey("keyframes.id"), nullable=True)
    video_path = Column(String, nullable=True)
    source_video_url = Column(String, nullable=True)
    local_video_path = Column(String, nullable=True)
    download_status = Column(String, nullable=True)
    download_error = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending/processing/completed/failed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="videos")
    keyframe = relationship("Keyframe", back_populates="videos")
