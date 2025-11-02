# app/reset_db.py
from .database import Base, engine
from .models import User, Conversation, Message

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database reset complete")

if __name__ == "__main__":
    reset_database()
