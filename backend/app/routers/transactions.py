from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db import get_db
from app.deps import get_current_user
from app.services.aggregation import distinct_categories, get_summary
from app.utils import serialize_transaction

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("")
async def list_transactions(
    search: Optional[str] = None,
    category: Optional[str] = None,
    paymentMethod: Optional[str] = None,
    type: Optional[str] = Query(None, pattern="^(Credit|Debit)$"),
    startDate: Optional[datetime] = None,
    endDate: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=200),
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    match: dict = {"userId": user["_id"]}
    if category and category.lower() != "all":
        match["category"] = category
    if paymentMethod and paymentMethod.lower() != "all":
        match["paymentMethod"] = paymentMethod
    if type:
        match["type"] = type
    date_filter = {}
    if startDate:
        date_filter["$gte"] = startDate
    if endDate:
        date_filter["$lte"] = endDate
    if date_filter:
        match["date"] = date_filter
    if search:
        match["description"] = {"$regex": search, "$options": "i"}

    total = await db.transactions.count_documents(match)
    cursor = (
        db.transactions.find(match)
        .sort("date", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    docs = await cursor.to_list(limit)

    return {
        "items": [serialize_transaction(d) for d in docs],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/categories")
async def categories(user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    return {"categories": await distinct_categories(db, user["_id"])}


@router.get("/payment-methods")
async def payment_methods(user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    methods = await db.transactions.distinct("paymentMethod", {"userId": user["_id"]})
    return {"paymentMethods": sorted(m for m in methods if m)}


@router.get("/summary")
async def transactions_summary(
    startDate: Optional[datetime] = None,
    endDate: Optional[datetime] = None,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await get_summary(db, user["_id"], startDate, endDate)
