from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json

from app.models.schemas import (
    OutlineRequest,
    StoryRequest,
    KeyframesRequest,
    VideoRequest,
)
from app.services import llm_service
from app.services import file_service
from app.database import get_db, User, Project, Outline, Story, Keyframe, Video
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/generate", tags=["generation"])


@router.post("/outline")
def generate_outline(req: OutlineRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """生成大纲并保存到数据库"""
    if not req.prompt.strip():
        raise HTTPException(400, "Theme is required")
    
    try:
        # 生成大纲
        outline = llm_service.generate_outline(req.prompt)
        
        # 保存项目和大纲到数据库
        db_project = Project(
            user_id=current_user.id,
            prompt=req.prompt,
            title=outline.get("title", ""),
            status="completed",
            current_step="outline"
        )
        db.add(db_project)
        db.flush()  # 获取 project ID
        
        # 保存大纲
        db_outline = Outline(
            id=f"outline-{db_project.id}",
            project_id=db_project.id,
            title=outline.get("title", ""),
            chapters=json.dumps(outline.get("chapters", []), ensure_ascii=False),
        )
        db.add(db_outline)
        db.commit()
        db.refresh(db_project)
        
        return {
            "project_id": db_project.id,
            "outline": outline
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))


@router.post("/story")
def generate_story(req: StoryRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """生成故事并保存到数据库"""
    try:
        outline = {"title": req.outline.title, "chapters": req.outline.chapters}
        story = llm_service.generate_long_story(outline)
        
        # 如果提供了 project_id，更新项目；否则创建新项目
        if req.project_id:
            db_project = db.query(Project).filter(Project.id == req.project_id, Project.user_id == current_user.id).first()
            if not db_project:
                raise HTTPException(404, "Project not found")
        else:
            # 从大纲推断主题创建新项目
            db_project = Project(
                user_id=current_user.id,
                prompt=req.prompt or req.outline.title or "Untitled",
                title=req.outline.title or "",
                status="completed",
                current_step="story"
            )
            db.add(db_project)
            db.flush()
            
            # 保存大纲
            db_outline = Outline(
                id=f"outline-{db_project.id}",
                project_id=db_project.id,
                title=req.outline.title or "",
                chapters=json.dumps(req.outline.chapters, ensure_ascii=False),
            )
            db.add(db_outline)
        
        # 更新项目步骤
        db_project.current_step = "story"
        
        # 保存故事（同一项目固定 story_id，重复生成时覆盖更新，避免主键冲突）
        story_id = f"story-{db_project.id}"
        target_outline_id = req.outline_id or f"outline-{db_project.id}"
        db_story = db.query(Story).filter(
            Story.id == story_id,
            Story.project_id == db_project.id
        ).first()
        if db_story:
            db_story.outline_id = target_outline_id
            db_story.content = story
        else:
            db_story = Story(
                id=story_id,
                project_id=db_project.id,
                outline_id=target_outline_id,  # 关联大纲
                content=story,
            )
            db.add(db_story)
        db.commit()
        db.refresh(db_project)
        
        return {
            "project_id": db_project.id,
            "outline_id": db_story.outline_id,
            "story_id": db_story.id,
            "long_story": story
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))


@router.post("/keyframes")
def generate_keyframes(req: KeyframesRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """生成关键帧并保存到数据库"""
    try:
        scenes = llm_service.generate_keyframe_scenes(req.long_story)
        keyframes = []
        
        # 如果提供了 project_id，更新项目
        if req.project_id:
            db_project = db.query(Project).filter(Project.id == req.project_id, Project.user_id == current_user.id).first()
            if not db_project:
                raise HTTPException(404, "Project not found")
        else:
            # 创建新项目
            db_project = Project(
                user_id=current_user.id,
                prompt="Generated Project",
                status="completed",
                current_step="keyframes"
            )
            db.add(db_project)
            db.flush()
        
        # 更新项目步骤
        db_project.current_step = "keyframes"
        
        # 关联的故事 ID
        story_id = req.story_id or f"story-{db_project.id}"
        
        # 保存关键帧
        for i, s in enumerate(scenes):
            kf_id = f"kf-{db_project.id}-{i}"
            desc = s.get("description", "")
            prompt = s.get("visual_prompt", s.get("visualPrompt", ""))
            source_image_url = ""
            local_image_path = ""
            image_public_url = ""
            download_status = "failed"
            download_error = ""
            try:
                image_url = llm_service.generate_image(prompt)
                source_image_url, local_image_path, image_public_url = file_service.persist_generated_image(
                    project_id=db_project.id,
                    keyframe_id=kf_id,
                    image_ref=image_url,
                )
                download_status = "success"
            except Exception:
                image_url = ""
                download_error = "image_download_failed"
            
            db_keyframe = db.query(Keyframe).filter(
                Keyframe.id == kf_id,
                Keyframe.project_id == db_project.id
            ).first()
            if db_keyframe:
                db_keyframe.story_id = story_id
                db_keyframe.sequence = i
                db_keyframe.description = desc
                db_keyframe.visual_prompt = prompt
                db_keyframe.image_path = image_public_url or image_url
                db_keyframe.source_image_url = source_image_url or image_url
                db_keyframe.local_image_path = local_image_path
                db_keyframe.download_status = download_status
                db_keyframe.download_error = download_error or None
            else:
                db_keyframe = Keyframe(
                    id=kf_id,
                    project_id=db_project.id,
                    story_id=story_id,  # 关联故事
                    sequence=i,
                    description=desc,
                    visual_prompt=prompt,
                    image_path=image_public_url or image_url,
                    source_image_url=source_image_url or image_url,
                    local_image_path=local_image_path,
                    download_status=download_status,
                    download_error=download_error or None,
                )
                db.add(db_keyframe)
            keyframes.append({
                "id": db_keyframe.id,
                "story_id": story_id,
                "description": desc,
                "visual_prompt": prompt,
                "image_url": image_public_url or image_url,
                "source_image_url": source_image_url or image_url,
                "local_image_path": local_image_path,
                "download_status": download_status,
            })
        
        db.commit()
        
        return {
            "project_id": db_project.id,
            "story_id": story_id,
            "keyframes": keyframes
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))


@router.post("/video")
def generate_video(req: VideoRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """生成视频并保存到数据库"""
    try:
        source_video_url = llm_service.generate_video(req.prompt, req.image_base64)
        
        # 如果提供了 project_id，更新项目
        if req.project_id:
            db_project = db.query(Project).filter(Project.id == req.project_id, Project.user_id == current_user.id).first()
            if not db_project:
                raise HTTPException(404, "Project not found")
            db_project.current_step = "video"
        else:
            db_project = Project(
                user_id=current_user.id,
                prompt="Video Project",
                status="completed",
                current_step="video"
            )
            db.add(db_project)
            db.flush()

        video_id = f"video-{db_project.id}"
        local_video_path = ""
        video_public_url = source_video_url
        download_status = "failed"
        download_error = ""
        try:
            _, local_video_path, video_public_url = file_service.persist_generated_video(
                project_id=db_project.id,
                video_id=video_id,
                video_url=source_video_url,
            )
            download_status = "success"
        except Exception:
            download_error = "video_download_failed"
        
        # 保存视频记录
        db_video = db.query(Video).filter(
            Video.id == video_id,
            Video.project_id == db_project.id
        ).first()
        if db_video:
            db_video.video_path = video_public_url if isinstance(video_public_url, str) else ""
            db_video.source_video_url = source_video_url if isinstance(source_video_url, str) else ""
            db_video.local_video_path = local_video_path
            db_video.download_status = download_status
            db_video.download_error = download_error or None
            db_video.status = "completed"
        else:
            db_video = Video(
                id=video_id,
                project_id=db_project.id,
                video_path=video_public_url if isinstance(video_public_url, str) else "",
                source_video_url=source_video_url if isinstance(source_video_url, str) else "",
                local_video_path=local_video_path,
                download_status=download_status,
                download_error=download_error or None,
                status="completed",
            )
            db.add(db_video)
        db.commit()
        
        return {
            "project_id": db_project.id,
            "video_url": video_public_url,
            "source_video_url": source_video_url,
            "local_video_path": local_video_path,
            "download_status": download_status,
        }
    except HTTPException:
        raise
    except NotImplementedError as e:
        raise HTTPException(501, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))
