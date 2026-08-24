import asyncio
import json
from datetime import datetime

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import get_settings
from app.models.schemas import INCOME_CATEGORIES
from app.services.aggregation import compute_health_score, get_category_breakdown, get_summary
from app.services.groq_client import get_groq_client
from app.utils import format_inr

SYSTEM_PROMPT = (
    "You are the AI Finance Assistant inside 'Let's Talk Money', a private financial "
    "dashboard for a startup founder. Answer questions about the founder's own finances "
    "using ONLY the data returned by the tools available to you — never invent or estimate "
    "numbers. Always call a tool before answering a question that requires any figure. "
    "Distinguish clearly between income (customer payments), salaries, taxes, and general "
    "operating expenses. Use Indian Rupee formatting with lakh/crore shorthand (e.g. ₹89.50L, "
    "₹2.14Cr) exactly as given to you in tool results — do not re-derive your own shorthand. "
    "Be concise, warm, and direct, like a sharp CFO briefing a founder. If the data doesn't "
    "contain enough information to answer, say so plainly instead of guessing. Never use "
    "emojis in your responses."
)

TOOLS_SPEC = [
    {
        "type": "function",
        "function": {
            "name": "get_summary_totals",
            "description": "Get total income, total expenses, net cash flow, and transaction count, optionally within a date range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": ["string", "null"], "description": "ISO date, inclusive lower bound (optional)"},
                    "end_date": {"type": ["string", "null"], "description": "ISO date, inclusive upper bound (optional)"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_category_breakdown",
            "description": "Get spending AND income totals grouped by category (e.g. Salary, Software, Taxes, Transport, Customer Payment). Optionally filter to one category.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": ["string", "null"], "description": "Optional exact category name to filter to."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_transactions",
            "description": "Get the largest transactions by amount, optionally filtered by type (Credit/Debit) or category.",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {"type": ["string", "null"], "enum": ["Credit", "Debit", None]},
                    "category": {"type": ["string", "null"]},
                    "limit": {"type": ["integer", "null"], "default": 5},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_transactions",
            "description": "Search transactions by a keyword in their description, optionally filtered by type or category.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {"type": ["string", "null"]},
                    "type": {"type": ["string", "null"], "enum": ["Credit", "Debit", None]},
                    "category": {"type": ["string", "null"]},
                    "limit": {"type": ["integer", "null"], "default": 10},
                },
            },
        },
    },
]


def _parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


async def _tool_get_summary_totals(db: AsyncIOMotorDatabase, user_id: ObjectId, start_date=None, end_date=None):
    summary = await get_summary(db, user_id, _parse_date(start_date), _parse_date(end_date))
    score, label, message = compute_health_score(summary)
    return {
        "totalIncome": summary["totalIncome"],
        "totalIncomeFormatted": format_inr(summary["totalIncome"]),
        "totalExpenses": summary["totalExpenses"],
        "totalExpensesFormatted": format_inr(summary["totalExpenses"]),
        "netCashFlow": summary["netCashFlow"],
        "netCashFlowFormatted": format_inr(summary["netCashFlow"]),
        "transactionCount": summary["transactionCount"],
        "healthScore": score,
        "healthScoreLabel": label,
    }


async def _tool_get_category_breakdown(db: AsyncIOMotorDatabase, user_id: ObjectId, category=None):
    items = await get_category_breakdown(db, user_id, include_income=True)
    if category:
        items = [i for i in items if i["category"].lower() == category.lower()]
    for i in items:
        i["totalFormatted"] = format_inr(i["total"])
    return {"items": items}


async def _tool_get_top_transactions(db: AsyncIOMotorDatabase, user_id: ObjectId, type=None, category=None, limit=None):
    limit = min(limit or 5, 20)
    match: dict = {"userId": user_id}
    if type:
        match["type"] = type
    if category:
        match["category"] = category
    cursor = db.transactions.find(match).sort("amount", -1).limit(limit)
    docs = await cursor.to_list(limit)
    return {
        "items": [
            {
                "description": d["description"],
                "category": d.get("category", "Other"),
                "type": d["type"],
                "amount": d["amount"],
                "amountFormatted": format_inr(d["signedAmount"]),
                "date": d["date"].strftime("%Y-%m-%d"),
            }
            for d in docs
        ]
    }


async def _tool_search_transactions(db: AsyncIOMotorDatabase, user_id: ObjectId, keyword=None, type=None, category=None, limit=None):
    limit = min(limit or 10, 30)
    match: dict = {"userId": user_id}
    if keyword:
        match["description"] = {"$regex": keyword, "$options": "i"}
    if type:
        match["type"] = type
    if category:
        match["category"] = category
    cursor = db.transactions.find(match).sort("date", -1).limit(limit)
    docs = await cursor.to_list(limit)
    return {
        "items": [
            {
                "description": d["description"],
                "category": d.get("category", "Other"),
                "type": d["type"],
                "amountFormatted": format_inr(d["signedAmount"]),
                "date": d["date"].strftime("%Y-%m-%d"),
            }
            for d in docs
        ]
    }


TOOL_IMPL = {
    "get_summary_totals": _tool_get_summary_totals,
    "get_category_breakdown": _tool_get_category_breakdown,
    "get_top_transactions": _tool_get_top_transactions,
    "search_transactions": _tool_search_transactions,
}


async def run_chat(db: AsyncIOMotorDatabase, user_id: ObjectId, message: str, history: list[dict]) -> str:
    settings = get_settings()
    client = get_groq_client()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in history[-8:]:
        role = h.get("role")
        content = h.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    MAX_ROUNDS = 4
    for round_idx in range(MAX_ROUNDS):
        is_last_round = round_idx == MAX_ROUNDS - 1
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.groq_model,
            messages=messages,
            tools=TOOLS_SPEC,
            tool_choice="auto" if not is_last_round else "none",
            temperature=0.3,
        )
        reply_msg = response.choices[0].message

        if not reply_msg.tool_calls:
            return reply_msg.content or "I couldn't come up with an answer — could you rephrase that?"

        messages.append(
            {
                "role": "assistant",
                "content": reply_msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                    }
                    for tc in reply_msg.tool_calls
                ],
            }
        )

        for tc in reply_msg.tool_calls:
            name = tc.function.name
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            impl = TOOL_IMPL.get(name)
            if impl is None:
                result = {"error": f"Unknown tool {name}"}
            else:
                result = await impl(db, user_id, **args)
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": name,
                    "content": json.dumps(result, default=str),
                }
            )

    return "I wasn't able to pull that together — could you try rephrasing the question?"
