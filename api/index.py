from dotenv import load_dotenv
load_dotenv(".env.local")


from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from .database import get_db, init_db
from . import crud, schemas, models

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health")
def health():
    return {"status": "healthy"}

# Transactions

@app.post("/api/transactions", response_model=schemas.Transaction)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    return crud.create_transaction(db, transaction)

@app.get("/api/transactions", response_model=List[schemas.Transaction])
def get_transactions(
    skip: int = 0,
    limit: int = 200,
    year: Optional[int] = None,
    month: Optional[int] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_transactions(db, skip=skip, limit=limit, year=year, month=month, category=category)

@app.put("/api/transactions/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(transaction_id: int, transaction: schemas.TransactionUpdate, db: Session = Depends(get_db)):
    db_tx = crud.update_transaction(db, transaction_id, transaction)
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return db_tx

@app.delete("/api/transactions/{transaction_id}", response_model=schemas.Transaction)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_tx = crud.delete_transaction(db, transaction_id)
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return db_tx

# Goals

@app.post("/api/goals", response_model=schemas.Goal)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db)):
    return crud.create_goal(db, goal)

@app.get("/api/goals", response_model=List[schemas.Goal])
def get_goals(db: Session = Depends(get_db)):
    return crud.get_goals(db)

@app.put("/api/goals/{goal_id}", response_model=schemas.Goal)
def update_goal(goal_id: int, goal: schemas.GoalUpdate, db: Session = Depends(get_db)):
    db_goal = crud.update_goal(db, goal_id, goal)
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return db_goal

@app.delete("/api/goals/{goal_id}", response_model=schemas.Goal)
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    db_goal = crud.delete_goal(db, goal_id)
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return db_goal

# Summary

@app.get("/api/summary", response_model=schemas.MonthlySummary)
def get_summary(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db)
):
    today = date.today()
    if year is None:
        year = today.year
    if month is None:
        month = today.month
    return crud.get_monthly_summary(db, year, month)
