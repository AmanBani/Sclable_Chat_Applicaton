from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import SessionLocal
from ..models import Message, User
from ..schemas import MessageCreate, MessageResponse, MessageHistoryResponse
from ..ws_manager import manager
import json
from .. import crud
import logging
logger = logging.getLogger(__name__)

router = APIRouter()

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ 1️⃣ Send a message and track its status
@router.post("/messages/send", response_model=MessageResponse)
async def send_message(message: MessageCreate, db: Session = Depends(get_db)):
    """Send a message via REST, save to DB, and broadcast via Redis/WebSocket with delivery status."""

    # Step 1: Ensure sender and receiver exist
    sender = db.query(User).filter(User.username == message.sender).first()
    if not sender:
        sender = User(username=message.sender)
        db.add(sender)
        db.commit()
        db.refresh(sender)

    receiver = db.query(User).filter(User.username == message.receiver).first()
    if not receiver:
        receiver = User(username=message.receiver)
        db.add(receiver)
        db.commit()
        db.refresh(receiver)

    # Step 2: Save message with "sent" status
    new_msg = Message(
        sender_id=sender.id,
        receiver_id=receiver.id,
        content=message.content,
        status="sent"  # new column in DB
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # Step 3: Publish via Redis + try direct delivery
    payload = f"{message.sender} -> {message.receiver}: {message.content}"

    await manager.publish_message("chat_channel", payload)

    # If receiver online → mark delivered and publish receipt
    delivered = await manager.send_personal_message(
        message.receiver, payload, message_id=new_msg.id
    )

    if delivered:
        new_msg.status = "delivered"
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)
        
        message_data = {
            "sender": message.sender,
            "receiver": message.receiver,
            "content": message.content,
            "status": "sent",
            "timestamp": str(new_msg.timestamp)
        }
        await manager.cache_message(message.sender, message.receiver,message_data)

        # publish delivery receipt to Redis
        redis_client = await manager.get_redis()
        await redis_client.publish(
            "message_receipts",
            json.dumps({
                "type": "delivery",
                "message_id": new_msg.id,
                "receiver": message.receiver
            })
        )

    return MessageResponse(
        sender=message.sender,
        receiver=message.receiver,
        content=message.content,
        status=new_msg.status,
        timestamp=new_msg.timestamp
    )


@router.get("/messages/conversation/{user1}/{user2}")
async def get_conversation(user1: str, user2: str, db: Session = Depends(get_db)):
    
    redis_client = await manager.get_redis()
    sorted_users = sorted([user1, user2])
    cache_key = f"chat:history:{sorted_users[0]}:{sorted_users[1]}"

    # Step 1️⃣: Try fetching from Redis cache
    cached_msgs = await redis_client.lrange(cache_key, 0, -1)

    if cached_msgs:
        logger.info("✅ Redis cache hit — serving messages from Redis")
        messages = []
        for msg in cached_msgs:
            try:
                messages.append(json.loads(msg))
            except json.JSONDecodeError:
                print("⚠️ Skipping corrupt cache entry")
        return {"conversation": messages}

    # Step 2️⃣: Cache miss — fetch from PostgreSQL
    logger.info("⚠️ Redis cache miss — fetching from PostgreSQL...")
    user1_obj = db.query(User).filter(User.username == user1).first()
    user2_obj = db.query(User).filter(User.username == user2).first()

    if not user1_obj or not user2_obj:
        raise HTTPException(status_code=404, detail="One or both users not found")

    db_messages = (
        db.query(Message)
        .filter(
            ((Message.sender_id == user1_obj.id) & (Message.receiver_id == user2_obj.id))
            | ((Message.sender_id == user2_obj.id) & (Message.receiver_id == user1_obj.id))
        )
        .order_by(Message.timestamp.asc())
        .all()
    )

    # Step 3️⃣: Format and cache in Redis
    messages = [
        {
            "sender": msg.sender_user.username,
            "receiver": msg.receiver_user.username,
            "content": msg.content,
            "status": msg.status,
            "timestamp": msg.timestamp.isoformat(),
        }
        for msg in db_messages
    ]

    for msg in messages:
        await redis_client.rpush(cache_key, json.dumps(msg))

    # Keep only last 50 messages
    await redis_client.ltrim(cache_key, -50, -1)
    # Optional: Expire cache after 1 hour
    await redis_client.expire(cache_key, 3600)

    print("💾 Cached conversation in Redis for next time")

    return {"conversation": messages}

    


# ✅ 3️⃣ Get all messages for a user
@router.get("/messages/{user_id}", response_model=MessageHistoryResponse)
def get_messages(user_id: str, db: Session = Depends(get_db)):
    """Fetch all messages sent or received by a specific user, including status."""

    user = db.query(User).filter(User.username == user_id).first()
    if not user:
        return {"messages": []}

    messages = db.query(Message).filter(
        (Message.sender_id == user.id) | (Message.receiver_id == user.id)
    ).all()

    message_list = []
    for msg in messages:
        sender_name = msg.sender_user.username if msg.sender_user else "Unknown"
        receiver_name = msg.receiver_user.username if msg.receiver_user else "Unknown"

        message_list.append(
            MessageResponse(
                sender=sender_name,
                receiver=receiver_name,
                content=msg.content,
                status=msg.status,
                timestamp=msg.timestamp
            )
        )

    return {"messages": message_list}


# ✅ 4️⃣ Mark a message as READ (when recipient views it)
@router.post("/messages/{message_id}/mark_read")
async def mark_message_read(message_id: int, db: Session = Depends(get_db)):
    """Mark message as read and notify sender via Redis."""

    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(404, "Message not found")

    msg.status = "read"
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # publish read receipt event
    redis_client = await manager.get_redis()
    await redis_client.publish(
        "message_receipts",
        json.dumps({
            "type": "read",
            "message_id": msg.id,
            "receiver": msg.receiver_user.username
        })
    )

    return {"message": "Marked as read", "message_id": message_id, "status": "read"}
