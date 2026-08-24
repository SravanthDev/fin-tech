import json

from app.config import get_settings
from app.models.schemas import ALLOWED_CATEGORIES
from app.services.groq_client import get_groq_client

BATCH_SIZE = 40

SYSTEM_PROMPT = (
    "You are a financial transaction categorizer for a startup's bank statement. "
    "You MUST assign each transaction exactly one category from this fixed list, "
    "with no other values allowed: " + ", ".join(ALLOWED_CATEGORIES) + ". "
    "Respond ONLY with a JSON array of strings (no other text), one category per "
    "transaction, in the exact same order as the input list."
)


def _format_transaction(record: dict) -> str:
    sign = "+" if record["type"] == "Credit" else "-"
    return f"{record['description']} | {sign}{record['amount']} | {record['paymentMethod']}"


def categorize_batch(records: list[dict]) -> list[str]:
    """Categorize a batch of transactions via Groq, constrained to ALLOWED_CATEGORIES.
    Falls back to 'Other' for any entry that fails to parse or validate."""

    if not records:
        return []

    settings = get_settings()
    client = get_groq_client()

    lines = [f"{i + 1}. {_format_transaction(r)}" for i, r in enumerate(records)]
    user_prompt = "Categorize these transactions:\n" + "\n".join(lines)

    try:
        completion = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0,
        )
        raw = completion.choices[0].message.content or "[]"
        start = raw.find("[")
        end = raw.rfind("]")
        parsed = json.loads(raw[start : end + 1]) if start != -1 and end != -1 else []
    except Exception:
        parsed = []

    results: list[str] = []
    for i in range(len(records)):
        category = parsed[i] if i < len(parsed) else None
        if isinstance(category, str) and category.strip() in ALLOWED_CATEGORIES:
            results.append(category.strip())
        else:
            results.append("Other")
    return results


def categorize_records(records: list[dict]) -> list[dict]:
    """Fills in category for any record missing one, batching calls to Groq."""

    to_categorize_idx = [i for i, r in enumerate(records) if not r.get("category")]
    for start in range(0, len(to_categorize_idx), BATCH_SIZE):
        batch_idx = to_categorize_idx[start : start + BATCH_SIZE]
        batch_records = [records[i] for i in batch_idx]
        categories = categorize_batch(batch_records)
        for i, category in zip(batch_idx, categories):
            records[i]["category"] = category
    return records
