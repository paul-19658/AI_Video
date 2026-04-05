"""
Authentication routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
import os
import uuid
from datetime import datetime, timedelta

from app.database import get_db, User, Project
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.schemas import ChangePasswordRequest

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _normalize_avatar_url(avatar_url: str | None) -> str | None:
    if avatar_url and avatar_url.startswith("/dreamweaver/uploads/"):
        return avatar_url.replace("/dreamweaver/uploads/", "/uploads/", 1)
    return avatar_url


# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: EmailStr | None = None
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str | None = None
    avatar: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    # Force fresh query from database, bypassing any cache
    user = db.query(User).filter(User.id == user_id).execution_options(populate_existing=True).first()
    if user is None:
        raise credentials_exception
    user.avatar = _normalize_avatar_url(user.avatar)
    return user


# Routes
@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create user
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=get_password_hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


class UserUpdate(BaseModel):
    avatar: str | None = None
    email: str | None = None


@router.put("/me", response_model=UserResponse)
def update_me(user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
    if user_update.email is not None:
        current_user.email = user_update.email
    db.commit()
    db.refresh(current_user)
    return current_user


# Avatar upload
AVATAR_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "avatars")
os.makedirs(AVATAR_UPLOAD_DIR, exist_ok=True)


@router.post("/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload user avatar"""
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, GIF, or WebP images are allowed"
        )
    
    # Validate file size (max 10MB)
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 10MB"
        )
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(AVATAR_UPLOAD_DIR, filename)
    
    # Save file
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Update avatar using raw SQL to ensure it persists
    avatar_url = f"/uploads/avatars/{filename}"
    db.execute(
        text("UPDATE users SET avatar = :avatar WHERE id = :user_id"),
        {"avatar": avatar_url, "user_id": current_user.id}
    )
    db.commit()
    
    # Return a dictionary with the updated user info
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "avatar": avatar_url,
        "created_at": current_user.created_at
    }


@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify old password
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧密码不正确"
        )
    
    # Hash new password
    new_hash = get_password_hash(password_data.new_password)
    
    # Update password in database
    db.execute(
        text("UPDATE users SET password_hash = :new_hash WHERE id = :user_id"),
        {"new_hash": new_hash, "user_id": current_user.id}
    )
    db.commit()
    
    return {"message": "密码修改成功"}
