from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class TransactionBase(BaseModel):
    amount: float
    description: Optional[str] = None
    category: str
    type: str  # 'expense' or 'income'
    date: date

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None
    type: Optional[str] = None
    date: Optional[date] = None

class Transaction(TransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GoalBase(BaseModel):
    title: str
    target: float
    saved: float = 0.0
    deadline: Optional[date] = None
    emoji: Optional[str] = "🎯"

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target: Optional[float] = None
    saved: Optional[float] = None
    deadline: Optional[date] = None
    emoji: Optional[str] = None

class Goal(GoalBase):
    id: int

    class Config:
        from_attributes = True

class MonthlySummary(BaseModel):
    total_income: float
    total_expense: float
    net_savings: float
    total_balance: float
    category_breakdown: dict  # { category: amount }
    line_chart_data: list  # [ { day: 1, balance: 12000, income: 100, expense: 50 } ]
    bar_chart_data: list  # [ { week: "Week 1", income: 500, expense: 300 } ]
    top_categories: list  # [ { category: "food", amount: 150, percentage: 40 } ]
