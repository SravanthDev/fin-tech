from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db import get_db
from app.deps import get_current_user
from app.models.schemas import ProfileUpdateRequest
from app.utils import serialize_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("")
async def get_profile(user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    count = await db.transactions.count_documents({"userId": user["_id"]})
    return serialize_user(user, count)


@router.patch("")
async def update_profile(
    payload: ProfileUpdateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if updates:
        await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
    user_doc = await db.users.find_one({"_id": user["_id"]})
    count = await db.transactions.count_documents({"userId": user["_id"]})
    return serialize_user(user_doc, count)
