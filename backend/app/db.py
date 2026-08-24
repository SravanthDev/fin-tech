from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    settings = get_settings()
    return get_client()[settings.mongodb_db_name]


async def ensure_indexes() -> None:
    db = get_db()
    await db.transactions.create_index([("userId", 1), ("date", -1)])
    await db.transactions.create_index([("userId", 1), ("category", 1)])
    await db.transactions.create_index([("userId", 1), ("transactionId", 1)])
    await db.users.create_index("email", unique=True)
