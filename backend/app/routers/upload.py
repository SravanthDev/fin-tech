from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db import get_db
from app.deps import get_current_user
from app.services.ingestion import ingest_file_for_user

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_EXTENSIONS = (".xlsx", ".xls", ".csv")


@router.post("")
async def upload_financial_data(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only .xlsx, .xls, or .csv files are supported.")

    content = await file.read()
    try:
        count = await ingest_file_for_user(db, user["_id"], file.filename, content)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    return {"filename": file.filename, "transactionCount": count}
