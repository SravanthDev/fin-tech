from datetime import datetime, timedelta, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.schemas import INCOME_CATEGORIES

PERIOD_CONFIG = {
    "30d": {"days": 30, "granularity": "day", "date_format": "%b %d"},
    "3m": {"days": 90, "granularity": "week", "date_format": "%b %d"},
    "6m": {"days": 182, "granularity": "month", "date_format": "%b %Y"},
    "all": {"days": None, "granularity": "month", "date_format": "%b %Y"},
}


async def get_date_bounds(db: AsyncIOMotorDatabase, user_id: ObjectId) -> tuple[datetime | None, datetime | None]:
    first = await db.transactions.find({"userId": user_id}).sort("date", 1).limit(1).to_list(1)
    last = await db.transactions.find({"userId": user_id}).sort("date", -1).limit(1).to_list(1)
    if not first or not last:
        return None, None
    return first[0]["date"], last[0]["date"]


async def get_summary(
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> dict:
    match: dict = {"userId": user_id}
    date_filter = {}
    if start_date:
        date_filter["$gte"] = start_date
    if end_date:
        date_filter["$lte"] = end_date
    if date_filter:
        match["date"] = date_filter

    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
    ]
    rows = await db.transactions.aggregate(pipeline).to_list(None)

    total_income = 0.0
    total_expenses = 0.0
    count = 0
    for r in rows:
        count += r["count"]
        if r["_id"] == "Credit":
            total_income += r["total"]
        else:
            total_expenses += r["total"]

    net_cash_flow = total_income - total_expenses
    return {
        "totalIncome": total_income,
        "totalExpenses": total_expenses,
        "netCashFlow": net_cash_flow,
        "transactionCount": count,
    }


def compute_health_score(summary: dict) -> tuple[int, str, str]:
    income = summary["totalIncome"]
    expenses = summary["totalExpenses"]

    if income <= 0:
        return 0, "Needs attention", "No income recorded yet, so a health score can't be calculated."

    ratio = expenses / income
    raw_score = 100 - max(0, ratio - 1) * 50
    score = max(0, min(100, round(raw_score)))

    if score >= 80:
        label = "Excellent"
        message = "Your income comfortably covers your expenses."
    elif score >= 60:
        label = "Good"
        message = "You're on the right track, with a healthy income-to-expense balance."
    elif score >= 40:
        label = "Caution"
        message = "Expenses are outpacing income — worth keeping a close eye on burn."
    else:
        label = "Needs attention"
        message = "Expenses significantly exceed income, largely driven by salaries and operating costs."

    return score, label, message


async def get_cashflow_series(db: AsyncIOMotorDatabase, user_id: ObjectId, period: str) -> list[dict]:
    config = PERIOD_CONFIG.get(period, PERIOD_CONFIG["all"])
    match: dict = {"userId": user_id}
    if config["days"] is not None:
        first, last = await get_date_bounds(db, user_id)
        if last is None:
            return []
        start = last - timedelta(days=config["days"])
        match["date"] = {"$gte": start}

    granularity = config["granularity"]
    if granularity == "day":
        date_expr = {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}}
    elif granularity == "week":
        date_expr = {"$dateToString": {"format": "%Y-%U", "date": "$date"}}
    else:
        date_expr = {"$dateToString": {"format": "%Y-%m", "date": "$date"}}

    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": {"bucket": date_expr, "type": "$type"},
                "total": {"$sum": "$amount"},
                "firstDate": {"$min": "$date"},
            }
        },
        {"$sort": {"firstDate": 1}},
    ]
    rows = await db.transactions.aggregate(pipeline).to_list(None)

    buckets: dict[str, dict] = {}
    for r in rows:
        key = r["_id"]["bucket"]
        if key not in buckets:
            buckets[key] = {"income": 0.0, "expenses": 0.0, "firstDate": r["firstDate"]}
        if r["_id"]["type"] == "Credit":
            buckets[key]["income"] += r["total"]
        else:
            buckets[key]["expenses"] += r["total"]

    ordered_keys = sorted(buckets.keys(), key=lambda k: buckets[k]["firstDate"])
    result = []
    for key in ordered_keys:
        b = buckets[key]
        result.append(
            {
                "label": b["firstDate"].strftime(config["date_format"]),
                "income": b["income"],
                "expenses": b["expenses"],
            }
        )
    return result


async def get_category_breakdown(db: AsyncIOMotorDatabase, user_id: ObjectId, include_income: bool = False) -> list[dict]:
    match: dict = {"userId": user_id}
    if not include_income:
        match["category"] = {"$nin": list(INCOME_CATEGORIES)}
    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"total": -1}},
    ]
    rows = await db.transactions.aggregate(pipeline).to_list(None)
    total_expenses = sum(r["total"] for r in rows if r["_id"] not in INCOME_CATEGORIES) or 1
    return [
        {
            "category": r["_id"] or "Other",
            "total": r["total"],
            "count": r["count"],
            "percentOfExpenses": round((r["total"] / total_expenses) * 100, 1) if r["_id"] not in INCOME_CATEGORIES else None,
        }
        for r in rows
    ]


async def get_recent_transactions(db: AsyncIOMotorDatabase, user_id: ObjectId, limit: int = 5) -> list[dict]:
    cursor = db.transactions.find({"userId": user_id}).sort("date", -1).limit(limit)
    return await cursor.to_list(limit)


async def distinct_categories(db: AsyncIOMotorDatabase, user_id: ObjectId) -> list[str]:
    cats = await db.transactions.distinct("category", {"userId": user_id})
    return sorted(c for c in cats if c)
