from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.categorization import categorize_records
from app.services.excel_ingest import needs_categorization, parse_financial_file


async def ingest_file_for_user(db: AsyncIOMotorDatabase, user_id: ObjectId, filename: str, content: bytes) -> int:
    """Parses a financial file, categorizes any uncategorized rows, replaces the
    user's transaction set, and updates their upload metadata. Returns the
    number of transactions stored."""

    records = parse_financial_file(filename, content)
    if not records:
        raise ValueError("No usable transactions found in the uploaded file.")

    if needs_categorization(records):
        records = categorize_records(records)

    now = datetime.now(timezone.utc)
    docs = [
        {
            **r,
            "userId": user_id,
            "sourceFile": filename,
            "createdAt": now,
        }
        for r in records
    ]

    await db.transactions.delete_many({"userId": user_id})
    if docs:
        await db.transactions.insert_many(docs)

    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"lastUploadFilename": filename, "lastUploadAt": now}},
    )

    return len(docs)
