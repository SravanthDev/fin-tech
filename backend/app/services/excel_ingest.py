import io
from datetime import datetime, timezone

import pandas as pd

from app.models.schemas import ALLOWED_CATEGORIES

# Header aliases -> canonical field name. Matched case-insensitively after
# stripping whitespace, so spreadsheets with slightly different column names
# (e.g. "Txn Date", "Narration", "Debit/Credit") still map correctly.
COLUMN_ALIASES: dict[str, list[str]] = {
    "date": ["date", "txn date", "transaction date", "value date"],
    "transactionId": ["transaction id", "txn id", "reference", "reference no", "id"],
    "type": ["type", "debit/credit", "dr/cr", "transaction type"],
    "description": ["description", "narration", "particulars", "merchant", "details"],
    "category": ["category"],
    "paymentMethod": ["payment method", "mode", "payment mode", "channel"],
    "amount": ["amount (inr)", "amount", "amount inr", "value"],
    "notes": ["notes", "remarks", "note"],
    "signedAmount": ["signed amount (inr)", "signed amount", "net amount"],
}


def _normalize_header(header: str) -> str:
    return str(header).strip().lower()


def _detect_columns(df: pd.DataFrame) -> dict[str, str]:
    normalized = {_normalize_header(c): c for c in df.columns}
    detected: dict[str, str] = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized:
                detected[canonical] = normalized[alias]
                break
    return detected


def parse_financial_file(filename: str, content: bytes) -> list[dict]:
    """Parse an uploaded Excel/CSV file into normalized transaction dicts
    (without userId/sourceFile, which the caller attaches)."""

    lower = filename.lower()
    if lower.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(content))
    else:
        df = pd.read_excel(io.BytesIO(content), sheet_name="Transactions" if _has_transactions_sheet(content) else 0)

    columns = _detect_columns(df)
    if "date" not in columns or "amount" not in columns:
        raise ValueError("Could not detect required Date/Amount columns in the uploaded file.")

    records: list[dict] = []
    for idx, row in df.iterrows():
        date_val = row[columns["date"]]
        if pd.isna(date_val):
            continue
        date_dt = pd.to_datetime(date_val).to_pydatetime()
        if date_dt.tzinfo is None:
            date_dt = date_dt.replace(tzinfo=timezone.utc)

        amount_raw = row[columns["amount"]]
        if pd.isna(amount_raw):
            continue
        amount = abs(float(amount_raw))

        txn_type = None
        if "type" in columns:
            raw_type = str(row[columns["type"]]).strip().lower()
            if raw_type.startswith("cr") or raw_type in ("credit", "income"):
                txn_type = "Credit"
            elif raw_type.startswith("db") or raw_type in ("debit", "expense"):
                txn_type = "Debit"

        signed_amount = None
        if "signedAmount" in columns and not pd.isna(row[columns["signedAmount"]]):
            signed_amount = float(row[columns["signedAmount"]])
            if txn_type is None:
                txn_type = "Credit" if signed_amount >= 0 else "Debit"
        elif txn_type is not None:
            signed_amount = amount if txn_type == "Credit" else -amount
        else:
            # Fall back: assume debit unless the raw amount was already negative.
            signed_amount = float(amount_raw)
            txn_type = "Credit" if signed_amount >= 0 else "Debit"
            signed_amount = amount if txn_type == "Credit" else -amount

        category = None
        if "category" in columns and not pd.isna(row[columns["category"]]):
            raw_cat = str(row[columns["category"]]).strip()
            category = raw_cat if raw_cat in ALLOWED_CATEGORIES else raw_cat or None

        description = str(row[columns["description"]]).strip() if "description" in columns and not pd.isna(row[columns["description"]]) else "Transaction"
        transaction_id = str(row[columns["transactionId"]]).strip() if "transactionId" in columns and not pd.isna(row[columns["transactionId"]]) else f"TXN{idx + 1:05d}"
        payment_method = str(row[columns["paymentMethod"]]).strip() if "paymentMethod" in columns and not pd.isna(row[columns["paymentMethod"]]) else "Bank Transfer"
        notes = str(row[columns["notes"]]).strip() if "notes" in columns and not pd.isna(row[columns["notes"]]) else None

        records.append(
            {
                "date": date_dt,
                "transactionId": transaction_id,
                "type": txn_type,
                "description": description,
                "category": category,
                "paymentMethod": payment_method,
                "amount": amount,
                "signedAmount": signed_amount,
                "notes": notes,
            }
        )

    return records


def _has_transactions_sheet(content: bytes) -> bool:
    try:
        xl = pd.ExcelFile(io.BytesIO(content))
        return "Transactions" in xl.sheet_names
    except Exception:
        return False


def needs_categorization(records: list[dict]) -> bool:
    return any(not r.get("category") for r in records)
