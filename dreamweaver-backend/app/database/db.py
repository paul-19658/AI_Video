"""
Database connection and session management
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dreamweaver.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    from app.database.models import Base
    Base.metadata.create_all(bind=engine)
    _run_lightweight_migrations()


def _run_lightweight_migrations():
    """Apply additive SQLite migrations for existing local databases."""
    if "sqlite" not in DATABASE_URL:
        return

    keyframe_columns = {
        "source_image_url": "ALTER TABLE keyframes ADD COLUMN source_image_url VARCHAR",
        "local_image_path": "ALTER TABLE keyframes ADD COLUMN local_image_path VARCHAR",
        "download_status": "ALTER TABLE keyframes ADD COLUMN download_status VARCHAR",
        "download_error": "ALTER TABLE keyframes ADD COLUMN download_error TEXT",
    }
    video_columns = {
        "source_video_url": "ALTER TABLE videos ADD COLUMN source_video_url VARCHAR",
        "local_video_path": "ALTER TABLE videos ADD COLUMN local_video_path VARCHAR",
        "download_status": "ALTER TABLE videos ADD COLUMN download_status VARCHAR",
        "download_error": "ALTER TABLE videos ADD COLUMN download_error TEXT",
    }

    with engine.begin() as conn:
        existing_keyframe = {row[1] for row in conn.execute(text("PRAGMA table_info(keyframes)"))}
        for col, ddl in keyframe_columns.items():
            if col not in existing_keyframe:
                conn.execute(text(ddl))

        existing_video = {row[1] for row in conn.execute(text("PRAGMA table_info(videos)"))}
        for col, ddl in video_columns.items():
            if col not in existing_video:
                conn.execute(text(ddl))
