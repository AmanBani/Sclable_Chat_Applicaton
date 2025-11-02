import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from . import database, models
from .ws_manager import manager
from app.routes import chat, auth, messages, user

app = FastAPI()
models.Base.metadata.create_all(bind=database.engine)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])
app.include_router(user.router, prefix="/user", tags=["User"])

@app.get("/")
def home():
    return {"message": "Welcome to the Real-Time Chat API 🚀"}

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(manager.subscribe_to_channel("chat_channel"))

@app.websocket("/ws/user/{user_id}")
async def user_ws(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    print(f"User connected: {user_id}")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received from {user_id}: {data}")
            # You can add optional forwarding logic here if needed

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        print(f"User disconnected: {user_id}")
