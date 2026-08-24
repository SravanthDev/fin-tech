from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db import get_db
from app.deps import get_current_user
from app.services.aggregation import (
    compute_health_score,
    get_cashflow_series,
    get_category_breakdown,
    get_recent_transactions,
    get_summary,
)
from app.utils import serialize_transaction

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    data = await get_summary(db, user["_id"])
    score, label, message = compute_health_score(data)
    return {
        **data,
        "healthScore": score,
        "healthScoreLabel": label,
        "healthScoreMessage": message,
    }


@router.get("/cashflow")
async def cashflow(
    period: str = Query("6m", pattern="^(30d|3m|6m|all)$"),
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    series = await get_cashflow_series(db, user["_id"], period)
    return {"period": period, "points": series}


@router.get("/spending-breakdown")
async def spending_breakdown(user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    return {"items": await get_category_breakdown(db, user["_id"])}


@router.get("/recent-transactions")
async def recent_transactions(
    limit: int = Query(5, ge=1, le=20),
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs = await get_recent_transactions(db, user["_id"], limit)
    return {"items": [serialize_transaction(d) for d in docs]}
