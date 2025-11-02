from sqlalchemy import UniqueConstraint,Text,Column,ForeignKey, Integer, String, DateTime
from datetime import datetime
from .database import Base
import pytz
from sqlalchemy.orm import relationship

ist = pytz.timezone("Asia/Kolkata")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(ist)) 
    # Relationship - messages sent and received
    sent_messages = relationship("Message", back_populates="sender_user", foreign_keys="Message.sender_id")
    received_messages = relationship("Message", back_populates="receiver_user", foreign_keys="Message.receiver_id")

# class Message(Base):
#     __tablename__ = "messages"

#     id = Column(Integer, primary_key=True, index=True)
#     sender_id = Column(Integer, ForeignKey("users.id"))
#     receiver_id = Column(Integer, ForeignKey("users.id"))
#     content = Column(String, nullable=False)
#     timestamp = Column(DateTime, default=lambda: datetime.now(ist)) 

#     # Correct relationship references
#     sender_user = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
#     receiver_user = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

    
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(ist)) 
    status = Column(String, default="sent", nullable=False)
    
    sender_user = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver_user = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    
class Conversation(Base):
    __tablename__ = "conversation"
    id = Column(Integer, primary_key=True,index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable= False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(ist)) 
    
    __table_args__ = (UniqueConstraint("user1_id", "user2_id", name="uq_conversation_pair"),)