# app/routes/messages.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import SessionLocal
from .. import crud, models, schemas
import asyncio
import json
from ..ws_manager import manager

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class SendToUser(BaseModel):
    sender_username: str
    receiver_username: str
    content: str

@router.post("/messages/send")
async def send_message(payload: SendToUser, db: Session = Depends(get_db)):
    # 1) ensure both users exist (create if not)
    sender = crud.get_user_by_username(db, payload.sender_username)
    if not sender:
        # create user
        sender = models.User(username=payload.sender_username, password="default")
        db.add(sender)
        db.commit()
        db.refresh(sender)

    receiver = crud.get_user_by_username(db, payload.receiver_username)
    if not receiver:
        receiver = models.User(username=payload.receiver_username, password="default")
        db.add(receiver)
        db.commit()
        db.refresh(receiver)

    # 2) get or create conversation
    conv = crud.get_or_create_conversation(db, sender.id, receiver.id)

    # 3) create message in DB
    msg = crud.create_message(db, conv.id, sender.id, receiver.id, payload.content)

    # 4) publish to Redis channel for receiver (per-user channel)
    data = {
        "conversation_id": conv.id,
        "message_id": msg.id,
        "from": sender.username,
        "to": receiver.username,
        "content": msg.content,
        "timestamp": str(msg.timestamp)
    }
    # publish asynchronously so endpoint returns quickly
    asyncio.create_task(manager.publish_message(f"user_{receiver.id}", json.dumps(data)))

    return {"status": "sent", "data": data}


@router.get("/messages/history/{username_a}/{username_b}")
def history(username_a: str, username_b: str, db: Session = Depends(get_db), limit: int = 100, offset: int = 0):
    user_a = crud.get_user_by_username(db, username_a)
    user_b = crud.get_user_by_username(db, username_b)
    if not user_a or not user_b:
        return {"conversation_id": None, "messages": []}

    conv = crud.get_or_create_conversation(db, user_a.id, user_b.id)
    msgs = crud.get_conversation_messages(db, conv.id, limit=limit, offset=offset)
    # convert messages to simple dicts
    out = []
    for m in msgs:
        out.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "timestamp": str(m.timestamp)
        })
    return {"conversation_id": conv.id, "messages": out}
