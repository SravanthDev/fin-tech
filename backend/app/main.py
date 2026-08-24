from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import ensure_indexes
from app.routers import auth, chat, dashboard, profile, transactions, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_indexes()
    yield


app = FastAPI(title="Let's Talk Money API", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(chat.router)
app.include_router(profile.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
