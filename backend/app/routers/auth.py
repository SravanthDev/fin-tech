from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db import get_db
from app.deps import get_current_user
from app.models.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import create_access_token, hash_password, verify_password
from app.services.ingestion import ingest_file_for_user
from app.utils import serialize_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

SEED_FILE = Path(__file__).resolve().parent.parent.parent / "seed_data" / "startup_bank_transactions.xlsx"


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    now = datetime.now(timezone.utc)
    result = await db.users.insert_one(
        {
            "name": payload.name.strip(),
            "email": payload.email.lower(),
            "passwordHash": hash_password(payload.password),
            "phone": None,
            "createdAt": now,
            "lastUploadFilename": None,
            "lastUploadAt": None,
        }
    )
    user_id = result.inserted_id

    if SEED_FILE.exists():
        try:
            content = SEED_FILE.read_bytes()
            await ingest_file_for_user(db, user_id, SEED_FILE.name, content)
        except Exception:
            pass

    user_doc = await db.users.find_one({"_id": user_id})
    count = await db.transactions.count_documents({"userId": user_id})
    token = create_access_token(str(user_id))
    return TokenResponse(accessToken=token, user=serialize_user(user_doc, count))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    user_doc = await db.users.find_one({"email": payload.email.lower()})
    if not user_doc or not verify_password(payload.password, user_doc["passwordHash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password.")

    count = await db.transactions.count_documents({"userId": user_doc["_id"]})
    token = create_access_token(str(user_doc["_id"]))
    return TokenResponse(accessToken=token, user=serialize_user(user_doc, count))


@router.get("/me")
async def me(user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    count = await db.transactions.count_documents({"userId": user["_id"]})
    return serialize_user(user, count)
