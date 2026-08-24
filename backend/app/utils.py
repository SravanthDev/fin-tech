def format_inr(amount: float) -> str:
    sign = "-" if amount < 0 else ""
    value = abs(amount)
    if value >= 1_00_00_000:
        return f"{sign}₹{value / 1_00_00_000:.2f}Cr"
    if value >= 1_00_000:
        return f"{sign}₹{value / 1_00_000:.2f}L"
    return f"{sign}₹{value:,.0f}"


def serialize_transaction(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "date": doc["date"],
        "transactionId": doc["transactionId"],
        "type": doc["type"],
        "description": doc["description"],
        "category": doc.get("category") or "Other",
        "paymentMethod": doc.get("paymentMethod", "Bank Transfer"),
        "amount": doc["amount"],
        "signedAmount": doc["signedAmount"],
        "notes": doc.get("notes"),
        "sourceFile": doc.get("sourceFile"),
    }


def serialize_user(doc: dict, transaction_count: int = 0) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "email": doc["email"],
        "phone": doc.get("phone"),
        "createdAt": doc["createdAt"],
        "lastUploadFilename": doc.get("lastUploadFilename"),
        "lastUploadAt": doc.get("lastUploadAt"),
        "transactionCount": transaction_count,
    }
