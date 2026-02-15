from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.schemas import UserResponse

router = APIRouter()

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/list/all", response_model=List[UserResponse])
def list_users(exclude: str | None = None, db: Session = Depends(get_db)):
    """
    List all registered users. Use exclude=username to omit current user.
    """
    query = db.query(User)
    if exclude:
        query = query.filter(User.username != exclude)
    return query.order_by(User.username).all()


@router.get("/{username}", response_model=UserResponse)
def get_user(username: str, db: Session = Depends(get_db)):
    """
    Fetch a single user's details by username.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user