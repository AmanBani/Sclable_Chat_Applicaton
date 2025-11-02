from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import User
from ..utils.jwt_handler import create_access_token
from ..utils.password_handler import hash_password, verify_password
from ..schemas import UserCreate, UserResponse

router = APIRouter(tags=["Authentication"])


# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with hashed password.
    """
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = hash_password(user.password)
    db_user = User(username=user.username, password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    """
    Verify user and return JWT token.
    """
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(db_user.username)
    return {"access_token": token, "token_type": "bearer"}
