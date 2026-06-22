import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# WARNING: SQLite does not support easy schema migrations.
# Any column type changes, column deletions, or additions in your models
# will require dropping the tables manually (e.g. by deleting the local 'budget.db' file
# or executing DROP TABLE statements in the SQLite console) because there are no
# migrations configured for this local database.

DATABASE_URL = os.environ.get("POSTGRES_URL") or "sqlite:///./budget.db"

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Swap protocol from postgres:// to postgresql:// as required by SQLAlchemy
    # and handle fallback to pg8000 if psycopg2 is not available
    try:
        import psycopg2
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    except ImportError:
        # Fallback to pg8000 driver
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)
        elif DATABASE_URL.startswith("postgresql://"):
            DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
    connect_args = {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Safely creates tables on startup only if they do not exist
    Base.metadata.create_all(bind=engine, checkfirst=True)
