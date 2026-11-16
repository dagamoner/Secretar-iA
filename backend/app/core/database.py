from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Engine configuration
db_url = settings.DATABASE_URL
connect_args = {}

try:
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        engine = create_engine(db_url, connect_args=connect_args)
    else:
        engine = create_engine(db_url, pool_pre_ping=True)
except Exception:
    # Graceful fallback to local sqlite if postgresql driver is not installed on the host
    fallback_url = "sqlite:///./secretaria_local.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(fallback_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
