from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, func
from .database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String, nullable=True)
    category = Column(String(50), nullable=True)  # 'food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'other', 'income'
    type = Column(String(10), nullable=False)  # 'expense' or 'income'
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    target = Column(Numeric(10, 2), nullable=False)
    saved = Column(Numeric(10, 2), server_default="0.00", default=0.00)
    deadline = Column(Date, nullable=True)
    emoji = Column(String(10), nullable=True)
