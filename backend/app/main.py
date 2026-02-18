import asyncio
import logging
import os
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from . import database, models
from .ws_manager import manager
from app.routes import chat, auth, messages, user

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

app = FastAPI()

# CORS: localhost + optional deployment origins from CORS_ORIGINS (comma-separated)
_cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_extra = os.getenv("CORS_ORIGINS")
if _extra:
    _cors_origins.extend(x.strip() for x in _extra.split(",") if x.strip())


class EnsureCORSHeadersMiddleware(BaseHTTPMiddleware):
    """Ensure CORS headers are on every response so preflight and errors never lack them."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        origin = request.headers.get("origin")
        if origin and origin in _cors_origins:
            response.headers.setdefault("Access-Control-Allow-Origin", origin)
            response.headers.setdefault("Access-Control-Allow-Credentials", "true")
            response.headers.setdefault("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
            response.headers.setdefault("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response


# Order: first added = runs last on response. Add EnsureCORS so every response gets CORS headers.
app.add_middleware(EnsureCORSHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Authorization"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])
app.include_router(user.router, prefix="/user", tags=["User"])

@app.get("/")
def home():
    return {"message": "Welcome to the Real-Time Chat API "}


@app.get("/health")
def health():
    """Liveness/readiness for Render; does not require DB so the service can bind to port."""
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    # Defer DB create_all to startup so the app can bind to port first; retry on transient DNS/connection errors.
    max_attempts = 5
    for attempt in range(1, max_attempts + 1):
        try:
            models.Base.metadata.create_all(bind=database.engine)
            logging.info("Database tables created/verified.")
            break
        except Exception as e:
            logging.warning("Database init attempt %s/%s failed: %s", attempt, max_attempts, e)
            if attempt == max_attempts:
                logging.error("Database unavailable after %s attempts. API will run but DB features will fail.", max_attempts)
                break
            time.sleep(2 * attempt)
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
