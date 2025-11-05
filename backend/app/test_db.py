from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:1234@localhost:5432/chat_app"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as connection:
        print("Connected successfully to PostgreSQL!")
except Exception as e:
    print("Connection failed:", e)
