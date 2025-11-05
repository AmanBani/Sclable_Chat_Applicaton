# app/ws_manager.py
import os
import json
import redis.asyncio as redis
import asyncio
from fastapi import WebSocket
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import crud


class ConnectionManager:
    def __init__(self):
        # Active websocket connections: {username: WebSocket}
        self.active_connections: dict[str, WebSocket] = {}
        self.redis = None
        self.subscriber_task = None  # background listener

    async def get_redis(self):
        """Return a Redis connection (reuse if already open)."""
        if not self.redis:
            # ✅ Dynamically pick Redis host & port (works for both local and Docker)
            redis_host = os.getenv("REDIS_HOST", "localhost")
            redis_port = os.getenv("REDIS_PORT", "6379")
            redis_url = f"redis://{redis_host}:{redis_port}"

            self.redis = await redis.from_url(redis_url, decode_responses=True)
            print(f"🔌 Connected to Redis at {redis_url}")
        return self.redis

    # ✅ Connect user WebSocket
    async def connect(self, username: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[username] = websocket
        print(f"✅ {username} connected via WebSocket.")

    # ✅ Disconnect user WebSocket
    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
            print(f"❌ {username} disconnected.")

    # ✅ Send a message directly to one user
    async def send_personal_message(
        self, receiver_username: str, message_payload: str, message_id: int = None
    ):
        if receiver_username in self.active_connections:
            ws = self.active_connections[receiver_username]
            await ws.send_text(message_payload)

            # Update message status → delivered
            db = SessionLocal()
            try:
                if message_id:
                    crud.set_message_status(db, message_id, "delivered")

                # publish Redis delivery receipt
                redis_client = await self.get_redis()
                event = json.dumps({
                    "type": "delivery",
                    "message_id": message_id,
                    "receiver": receiver_username
                })
                await redis_client.publish("message_receipts", event)
            finally:
                db.close()

            return True
        return False  # not online

    # ✅ Broadcast to all local websocket connections
    async def broadcast(self, message: str):
        for username, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"⚠️ Failed to send to {username}: {e}")

    # ✅ Publish a message to a Redis channel
    async def publish_message(self, channel: str, message: str):
        redis_client = await self.get_redis()
        await redis_client.publish(channel, message)

    # ✅ Subscribe to Redis channel and forward to WebSocket clients
    async def subscribe_to_channel(self, channel: str):
        redis_client = await self.get_redis()
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(channel)

        print(f"📡 Subscribed to Redis channel: {channel}")

        async for msg in pubsub.listen():
            if msg and msg["type"] == "message":
                data = msg["data"]
                print(f"📩 Received from Redis: {data}")
                await self.broadcast(data)

    # ✅ Start background Redis listener once
    async def start_listener(self):
        if not self.subscriber_task:
            self.subscriber_task = asyncio.create_task(
                self.subscribe_to_channel("chat_channel")
            )
            print("🚀 Redis background listener started.")

    # ✅ Cache recent messages in Redis
    async def cache_message(self, user1: str, user2: str, message_data: dict):
        redis_client = await self.get_redis()

        # Sort users alphabetically for consistent key naming
        sorted_users = sorted([user1, user2])
        cache_key = f"chat:history:{sorted_users[0]}:{sorted_users[1]}"

        msg_json = json.dumps(message_data)
        await redis_client.rpush(cache_key, msg_json)

        # Keep only the last 100 messages
        await redis_client.ltrim(cache_key, -100, -1)
        print(f"💾 Cached message to Redis key: {cache_key}")


# Singleton instance
manager = ConnectionManager()
