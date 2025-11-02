# app/schemas.py
from pydantic import BaseModel
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    
class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        orm_mode = True

class MessageBase(BaseModel):
    username: str
    content: str
    
class MessageCreate(BaseModel):
    sender: str
    receiver: str
    content: str

class MessageResponse(BaseModel):
    sender: str
    receiver: str
    content: str
    status: str  
    timestamp: datetime

    class Config:
        orm_mode = True  



class Message(MessageBase):
    id :int
    timestamp : datetime
    
    class Config:
        from_attributes = True

class MessageDB(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    reciever_id: int
    content: str
    timestamp : datetime
    
    class Config:
        from_attributes = True
        
class SendToUser(BaseModel):
    sender_username: str
    receiver_username: str
    content: str
    

    
class MessageHistoryResponse(BaseModel):
    messages: list[MessageResponse]

    class Config:
        orm_mode = True





