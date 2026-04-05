"""
Project management routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db, User, Project, Outline, Story, Keyframe, Video
from app.services import file_service

router = APIRouter(prefix="/api/projects", tags=["projects"])


# Pydantic models
class ProjectCreate(BaseModel):
    prompt: str


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    prompt: str
    title: Optional[str]
    status: str
    current_step: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OutlineResponse(BaseModel):
    id: str
    project_id: str
    parent_id: Optional[str] = None
    title: str
    chapters: str
    is_ai_generated: int = 1
    created_at: datetime

    class Config:
        from_attributes = True


class StoryResponse(BaseModel):
    id: str
    project_id: str
    outline_id: Optional[str] = None
    parent_id: Optional[str] = None
    content: str
    is_ai_generated: int = 1
    created_at: datetime

    class Config:
        from_attributes = True


class KeyframeResponse(BaseModel):
    id: str
    project_id: str
    story_id: Optional[str] = None
    parent_id: Optional[str] = None
    sequence: int
    description: Optional[str]
    visual_prompt: Optional[str]
    image_path: Optional[str]
    is_ai_generated: int = 1
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectDetailResponse(BaseModel):
    id: str
    prompt: str
    title: Optional[str]
    status: str
    current_step: str
    created_at: datetime
    updated_at: datetime
    outline: Optional[OutlineResponse] = None
    story: Optional[StoryResponse] = None
    keyframes: List[KeyframeResponse] = []

    class Config:
        from_attributes = True


# 保存版本的请求模型
class SaveOutlineVersionRequest(BaseModel):
    title: str
    chapters: list
    parent_id: Optional[str] = None
    is_ai_generated: int = 0


class SaveStoryVersionRequest(BaseModel):
    content: str
    outline_id: str
    parent_id: Optional[str] = None
    is_ai_generated: int = 0


class SaveKeyframeVersionRequest(BaseModel):
    description: str
    visual_prompt: str
    image_path: Optional[str] = None
    story_id: str
    parent_id: Optional[str] = None
    is_ai_generated: int = 0


# Import dependencies
from app.routers.auth import get_current_user


# Routes
@router.get("", response_model=List[ProjectResponse])
def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all projects for current user"""
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.created_at.desc()).all()

    # Dynamically compute current_step based on actual data (instead of relying on stored field)
    result = []
    for p in projects:
        # Check if project has video
        video = db.query(Video).filter(Video.project_id == p.id).first()
        if video:
            p.current_step = "video"
        else:
            # Check if project has keyframes
            kf = db.query(Keyframe).filter(Keyframe.project_id == p.id).first()
            if kf:
                p.current_step = "keyframes"
            else:
                # Check if project has story
                story = db.query(Story).filter(Story.project_id == p.id).first()
                if story:
                    p.current_step = "story"
                else:
                    # Check if project has outline
                    outline = db.query(Outline).filter(Outline.project_id == p.id).first()
                    p.current_step = "outline" if outline else "outline"
        result.append(p)

    return result


@router.post("", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project"""
    db_project = Project(
        user_id=current_user.id,
        prompt=project.prompt,
        status="pending",
        current_step="outline"
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/{project_id}/versions")
def get_project_versions(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取项目版本树"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 获取所有大纲版本
    outlines = db.query(Outline).filter(
        Outline.project_id == project_id
    ).order_by(Outline.created_at.desc()).all()
    
    # 获取所有故事版本（带 outline 信息）
    stories = db.query(Story).filter(
        Story.project_id == project_id
    ).order_by(Story.created_at.desc()).all()
    
    # 获取所有关键帧版本（带 story 信息）
    keyframes = db.query(Keyframe).filter(
        Keyframe.project_id == project_id
    ).order_by(Keyframe.created_at.desc()).all()
    
    return {
        "outlines": [{"id": o.id, "title": o.title, "parent_id": o.parent_id, "is_ai_generated": o.is_ai_generated, "created_at": o.created_at.isoformat()} for o in outlines],
        "stories": [{"id": s.id, "outline_id": s.outline_id, "parent_id": s.parent_id, "is_ai_generated": s.is_ai_generated, "created_at": s.created_at.isoformat(), "content_preview": s.content[:100]} for s in stories],
        "keyframes": [{"id": k.id, "story_id": k.story_id, "parent_id": k.parent_id, "is_ai_generated": k.is_ai_generated, "created_at": k.created_at.isoformat()} for k in keyframes],
    }


@router.get("/{project_id}/outlines/{outline_id}")
def get_outline_version(
    project_id: str,
    outline_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific outline version by ID"""
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    outline = db.query(Outline).filter(
        Outline.id == outline_id, Outline.project_id == project_id
    ).first()
    if not outline:
        raise HTTPException(status_code=404, detail="Outline not found")

    return {
        "id": outline.id,
        "project_id": outline.project_id,
        "parent_id": outline.parent_id,
        "title": outline.title,
        "chapters": outline.chapters,
        "is_ai_generated": outline.is_ai_generated,
        "created_at": outline.created_at.isoformat()
    }


@router.get("/{project_id}/stories/{story_id}")
def get_story_version(
    project_id: str,
    story_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific story version by ID"""
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    story = db.query(Story).filter(
        Story.id == story_id, Story.project_id == project_id
    ).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    return {
        "id": story.id,
        "project_id": story.project_id,
        "outline_id": story.outline_id,
        "parent_id": story.parent_id,
        "content": story.content,
        "is_ai_generated": story.is_ai_generated,
        "created_at": story.created_at.isoformat()
    }


@router.get("/{project_id}/keyframes/{keyframe_id}")
def get_keyframe_version(
    project_id: str,
    keyframe_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific keyframe version by ID"""
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    keyframe = db.query(Keyframe).filter(
        Keyframe.id == keyframe_id, Keyframe.project_id == project_id
    ).first()
    if not keyframe:
        raise HTTPException(status_code=404, detail="Keyframe not found")

    return {
        "id": keyframe.id,
        "project_id": keyframe.project_id,
        "story_id": keyframe.story_id,
        "parent_id": keyframe.parent_id,
        "sequence": keyframe.sequence,
        "description": keyframe.description,
        "visual_prompt": keyframe.visual_prompt,
        "image_path": keyframe.image_path,
        "is_ai_generated": keyframe.is_ai_generated,
        "created_at": keyframe.created_at.isoformat()
    }


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get project details - returns latest versions"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get latest outline - find outline that is not parent of any other outline
    all_outlines = db.query(Outline).filter(
        Outline.project_id == project_id
    ).all()
    parent_ids = {o.parent_id for o in all_outlines if o.parent_id is not None}
    outlines = [o for o in all_outlines if o.id not in parent_ids]
    outline = sorted(outlines, key=lambda x: x.created_at, reverse=True)[0] if outlines else None

    # Get latest story based on latest outline - same leaf-node logic
    # Filter by project_id to ensure we get the correct story for this project
    story = None
    if outline:
        all_stories = db.query(Story).filter(
            Story.outline_id == outline.id,
            Story.project_id == project_id  # Add project filter to avoid cross-project contamination
        ).all()
        parent_ids = {s.parent_id for s in all_stories if s.parent_id is not None}
        stories = [s for s in all_stories if s.id not in parent_ids]
        story = sorted(stories, key=lambda x: x.created_at, reverse=True)[0] if stories else None

    # Get keyframes based on latest story
    # Latest = keyframes that are not parent of any other keyframe (leaf nodes in version tree)
    keyframes = []
    print(f"DEBUG: story={story.id if story else None}, outline={outline.id if outline else None}")
    if story:
        # Query keyframes by story.id, but also check outline.id as fallback for legacy data
        # (some stored keyframes incorrectly have story_id = outline_id)
        all_keyframes = db.query(Keyframe).filter(
            (Keyframe.story_id == story.id) | (Keyframe.story_id == outline.id)
        ).all()
        print(f"DEBUG: all_keyframes count={len(all_keyframes)}")
        # Find keyframes that are NOT parents of any other keyframe
        parent_ids = {kf.parent_id for kf in all_keyframes if kf.parent_id is not None}
        latest_keyframes = [kf for kf in all_keyframes if kf.id not in parent_ids]
        # Sort by sequence and limit to 3
        keyframes = sorted(latest_keyframes, key=lambda k: k.sequence)[:3]
        print(f"DEBUG: final keyframes count={len(keyframes)}")
    
    return ProjectDetailResponse(
        id=project.id,
        prompt=project.prompt,
        title=project.title,
        status=project.status,
        current_step=project.current_step,
        created_at=project.created_at,
        updated_at=project.updated_at,
        outline=OutlineResponse(**{
            "id": outline.id,
            "project_id": outline.project_id,
            "parent_id": outline.parent_id,
            "title": outline.title,
            "chapters": outline.chapters,
            "is_ai_generated": outline.is_ai_generated,
            "created_at": outline.created_at
        }) if outline else None,
        story=StoryResponse(**{
            "id": story.id,
            "project_id": story.project_id,
            "outline_id": story.outline_id,
            "parent_id": story.parent_id,
            "content": story.content,
            "is_ai_generated": story.is_ai_generated,
            "created_at": story.created_at
        }) if story else None,
        keyframes=[KeyframeResponse(
            id=kf.id,
            project_id=kf.project_id,
            story_id=kf.story_id,
            parent_id=kf.parent_id,
            sequence=kf.sequence,
            description=kf.description,
            visual_prompt=kf.visual_prompt,
            image_path=kf.image_path,
            is_ai_generated=kf.is_ai_generated,
            created_at=kf.created_at
        ) for kf in keyframes]
    )


@router.post("/{project_id}/outline")
def save_outline_version(
    project_id: str,
    data: SaveOutlineVersionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a new outline version"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    import json
    db_outline = Outline(
        project_id=project_id,
        parent_id=data.parent_id,
        title=data.title,
        chapters=json.dumps(data.chapters),
        is_ai_generated=data.is_ai_generated
    )
    db.add(db_outline)
    db.commit()
    db.refresh(db_outline)
    
    return {"id": db_outline.id, "message": "Outline saved"}


@router.post("/{project_id}/story")
def save_story_version(
    project_id: str,
    data: SaveStoryVersionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a new story version"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_story = Story(
        project_id=project_id,
        outline_id=data.outline_id,
        parent_id=data.parent_id,
        content=data.content,
        is_ai_generated=data.is_ai_generated
    )
    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    
    return {"id": db_story.id, "message": "Story saved"}


@router.post("/{project_id}/keyframes")
def save_keyframe_version(
    project_id: str,
    data: SaveKeyframeVersionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a new keyframe version"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get max sequence
    max_seq = db.query(Keyframe).filter(
        Keyframe.story_id == data.story_id,
        Keyframe.parent_id == data.parent_id
    ).count()
    
    db_keyframe = Keyframe(
        project_id=project_id,
        story_id=data.story_id,
        parent_id=data.parent_id,
        sequence=max_seq,
        description=data.description,
        visual_prompt=data.visual_prompt,
        image_path=data.image_path,
        is_ai_generated=data.is_ai_generated
    )
    db.add(db_keyframe)
    db.commit()
    db.refresh(db_keyframe)
    
    return {"id": db_keyframe.id, "message": "Keyframe saved"}


@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete related data
    db.query(Outline).filter(Outline.project_id == project_id).delete()
    db.query(Story).filter(Story.project_id == project_id).delete()
    db.query(Keyframe).filter(Keyframe.project_id == project_id).delete()
    db.query(Video).filter(Video.project_id == project_id).delete()
    
    # Delete project
    db.delete(project)
    db.commit()
    file_service.remove_project_generated_assets(project_id)
    
    return {"message": "Project deleted"}


@router.get("/{project_id}/progress")
def get_progress(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get project progress"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "status": project.status,
        "current_step": project.current_step,
        "prompt": project.prompt,
        "title": project.title
    }
