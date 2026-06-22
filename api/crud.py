from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from datetime import date, datetime
import calendar
from . import models, schemas

# Transactions CRUD

def get_transaction(db: Session, transaction_id: int):
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()

def get_transactions(db: Session, skip: int = 0, limit: int = 200, year: int = None, month: int = None, category: str = None):
    query = db.query(models.Transaction)
    if year:
        query = query.filter(extract('year', models.Transaction.date) == year)
    if month:
        query = query.filter(extract('month', models.Transaction.date) == month)
    if category:
        query = query.filter(models.Transaction.category == category)
    return query.order_by(models.Transaction.date.desc(), models.Transaction.created_at.desc()).offset(skip).limit(limit).all()

def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    db_transaction = models.Transaction(
        amount=transaction.amount,
        description=transaction.description,
        category=transaction.category,
        type=transaction.type,
        date=transaction.date
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def update_transaction(db: Session, transaction_id: int, transaction: schemas.TransactionUpdate):
    db_transaction = get_transaction(db, transaction_id)
    if not db_transaction:
        return None
    
    update_data = transaction.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
        
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def delete_transaction(db: Session, transaction_id: int):
    db_transaction = get_transaction(db, transaction_id)
    if not db_transaction:
        return None
    db.delete(db_transaction)
    db.commit()
    return db_transaction

# Goals CRUD

def get_goal(db: Session, goal_id: int):
    return db.query(models.Goal).filter(models.Goal.id == goal_id).first()

def get_goals(db: Session):
    return db.query(models.Goal).all()

def create_goal(db: Session, goal: schemas.GoalCreate):
    db_goal = models.Goal(
        title=goal.title,
        target=goal.target,
        saved=goal.saved,
        deadline=goal.deadline,
        emoji=goal.emoji
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def update_goal(db: Session, goal_id: int, goal: schemas.GoalUpdate):
    db_goal = get_goal(db, goal_id)
    if not db_goal:
        return None
    
    update_data = goal.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_goal, key, value)
        
    db.commit()
    db.refresh(db_goal)
    return db_goal

def delete_goal(db: Session, goal_id: int):
    db_goal = get_goal(db, goal_id)
    if not db_goal:
        return None
    db.delete(db_goal)
    db.commit()
    return db_goal

# Summary calculations

def get_monthly_summary(db: Session, year: int, month: int):
    # Total overall balance up to the end of the month
    all_income = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.type == 'income').scalar() or 0.0
    all_expense = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.type == 'expense').scalar() or 0.0
    total_balance = float(all_income) - float(all_expense)

    # Current month metrics
    month_income = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == 'income',
        extract('year', models.Transaction.date) == year,
        extract('month', models.Transaction.date) == month
    ).scalar() or 0.0
    
    month_expense = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == 'expense',
        extract('year', models.Transaction.date) == year,
        extract('month', models.Transaction.date) == month
    ).scalar() or 0.0
    
    month_income = float(month_income)
    month_expense = float(month_expense)

    # Category breakdown for current month (expenses only)
    category_totals = {}
    rows = db.query(models.Transaction.category, func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == 'expense',
        extract('year', models.Transaction.date) == year,
        extract('month', models.Transaction.date) == month
    ).group_by(models.Transaction.category).all()
    
    for cat, total in rows:
        category_totals[cat] = float(total or 0.0)

    # Top categories ranked
    top_categories = []
    if month_expense > 0:
        for cat, total in category_totals.items():
            top_categories.append({
                "category": cat,
                "amount": total,
                "percentage": round((total / month_expense) * 100, 1)
            })
        top_categories.sort(key=lambda x: x["amount"], reverse=True)

    # Line chart data (daily balance over the month)
    start_date = date(year, month, 1)
    prev_income = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == 'income',
        models.Transaction.date < start_date
    ).scalar() or 0.0
    prev_expense = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == 'expense',
        models.Transaction.date < start_date
    ).scalar() or 0.0
    running_balance = float(prev_income) - float(prev_expense)

    # Fetch all transactions of this month
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)
    
    month_transactions = db.query(models.Transaction).filter(
        models.Transaction.date >= start_date,
        models.Transaction.date <= end_date
    ).order_by(models.Transaction.date.asc()).all()

    # Group transactions by day
    tx_by_day = {}
    for tx in month_transactions:
        day = tx.date.day
        if day not in tx_by_day:
            tx_by_day[day] = []
        tx_by_day[day].append(tx)

    line_chart_data = []
    for d in range(1, last_day + 1):
        day_income = 0.0
        day_expense = 0.0
        if d in tx_by_day:
            for tx in tx_by_day[d]:
                if tx.type == 'income':
                    day_income += float(tx.amount)
                else:
                    day_expense += float(tx.amount)
        running_balance += day_income - day_expense
        line_chart_data.append({
            "day": d,
            "date": f"{year}-{month:02d}-{d:02d}",
            "balance": round(running_balance, 2),
            "income": round(day_income, 2),
            "expense": round(day_expense, 2)
        })

    # Weekly bar chart data
    weekly_data = {
        "Week 1": {"income": 0.0, "expense": 0.0},
        "Week 2": {"income": 0.0, "expense": 0.0},
        "Week 3": {"income": 0.0, "expense": 0.0},
        "Week 4": {"income": 0.0, "expense": 0.0}
    }
    for tx in month_transactions:
        day = tx.date.day
        if day <= 7:
            w = "Week 1"
        elif day <= 14:
            w = "Week 2"
        elif day <= 21:
            w = "Week 3"
        else:
            w = "Week 4"
        
        amount = float(tx.amount)
        if tx.type == 'income':
            weekly_data[w]["income"] += amount
        else:
            weekly_data[w]["expense"] += amount

    bar_chart_data = []
    for week_name, vals in weekly_data.items():
        bar_chart_data.append({
            "week": week_name,
            "income": round(vals["income"], 2),
            "expense": round(vals["expense"], 2)
        })

    return {
        "total_income": round(month_income, 2),
        "total_expense": round(month_expense, 2),
        "net_savings": round(month_income - month_expense, 2),
        "total_balance": round(total_balance, 2),
        "category_breakdown": category_totals,
        "line_chart_data": line_chart_data,
        "bar_chart_data": bar_chart_data,
        "top_categories": top_categories
    }
