from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load .env from backend folder; override=True so .env wins over shell/Docker env
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_backend_dir, ".env"), override=True)


DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render and some platforms set postgres://; psycopg2 requires postgresql://
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    # Neon and other cloud DBs often require SSL
    if "sslmode=" not in SQLALCHEMY_DATABASE_URL and ("neon.tech" in SQLALCHEMY_DATABASE_URL or "neon.tech" in (DATABASE_URL or "")):
        SQLALCHEMY_DATABASE_URL += "?sslmode=require" if "?" not in SQLALCHEMY_DATABASE_URL else "&sslmode=require"
else:
    DB_USER = os.getenv("POSTGRES_USER", "postgres")
    DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "1234")
    DB_NAME = os.getenv("POSTGRES_DB", "chat_app")
    DB_HOST = os.getenv("POSTGRES_HOST", "postgres")
    DB_PORT = os.getenv("POSTGRES_PORT", "5432")
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
