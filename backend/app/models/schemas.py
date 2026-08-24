from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

ALLOWED_CATEGORIES = [
    "Salary",
    "Customer Payment",
    "Software",
    "Cloud & Hosting",
    "Office",
    "Office Supplies",
    "Transport",
    "Fuel",
    "Meals",
    "Logistics",
    "Taxes",
    "Employee Reimbursement",
    "Travel",
    "Marketing",
    "Utilities",
    "Other",
]

INCOME_CATEGORIES = {"Customer Payment"}


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    createdAt: datetime
    lastUploadFilename: Optional[str] = None
    lastUploadAt: Optional[datetime] = None
    transactionCount: int = 0


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class TransactionOut(BaseModel):
    id: str
    date: datetime
    transactionId: str
    type: Literal["Credit", "Debit"]
    description: str
    category: str
    paymentMethod: str
    amount: float
    signedAmount: float
    notes: Optional[str] = None
    sourceFile: Optional[str] = None


class PaginatedTransactions(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    limit: int


class DashboardSummary(BaseModel):
    totalIncome: float
    totalExpenses: float
    netCashFlow: float
    transactionCount: int
    healthScore: int
    healthScoreLabel: str
    healthScoreMessage: str


class CashFlowPoint(BaseModel):
    label: str
    income: float
    expenses: float


class CategoryBreakdownItem(BaseModel):
    category: str
    total: float
    count: int
    percentOfExpenses: Optional[float] = None


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
