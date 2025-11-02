# app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(username=user.username, password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_message(db: Session, message: schemas.MessageCreate):
    sender = db.query(models.User).filter(models.User.username == message.sender).first()
    receiver = db.query(models.User).filter(models.User.username == message.receiver).first()
    if not sender or not receiver:
        raise ValueError("Sender or receiver does not exist")

    db_message = models.Message(
        sender_id=sender.id,
        receiver_id=receiver.id,
        content=message.content,
        status="sent"
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def set_message_status(db: Session, message_id: int, status: str):
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        return None
    msg.status = status
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

def get_message_by_id(db: Session, message_id: int):
    return db.query(models.Message).filter(models.Message.id == message_id).first()



def get_messages(db: Session, limit:int = 40):
    return db.query(models.Message).all()

def get_user_by_username(db: Session,username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db:Session, user:schemas.UserCreate):
    db_user = models.User(username=user.username, password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_or_create_conversation(db: Session, user_a_id:int, user_b_id:int):
    a, b  = (user_a_id, user_b_id) if user_a_id <= user_b_id else (user_b_id, user_a_id)
    conv = db.query(models.Conversation).filter(
        models.Conversation.user1_id == a,
        models.Conversation.user2_id == b,
    ).first()
    if conv:
        return conv
    conv = models.Conversation(user1_id=a, user2_id=b)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

def get_conversation_messages(db: Session, conversation_id: int, limit: int = 100, offset: int = 0):
    return db.query(models.Message).filter(models.Message.conversation_id == conversation_id).order_by(models.Message.timestamp.asc()).limit(limit).offset(offset).all()


def get_conversation(db: Session, user1: str, user2: str):
    u1 = db.query(models.User).filter(models.User.username == user1).first()
    u2 = db.query(models.User).filter(models.User.username == user2).first()
    if not u1 or not u2:
        return []
    messages = (
        db.query(models.Message)
        .filter(
            ((models.Message.sender_id == u1.id) & (models.Message.receiver_id == u2.id))
            | ((models.Message.sender_id == u2.id) & (models.Message.receiver_id == u1.id))
        )
        .order_by(models.Message.timestamp.asc())
        .all()
    )
    return messages



def get_user_messages(db: Session, username: str):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        return []
    messages = (
        db.query(models.Message)
        .filter(
            (models.Message.sender_id == user.id)
            | (models.Message.receiver_id == user.id)
        )
        .order_by(models.Message.timestamp.asc())
        .all()
    )
    return messages