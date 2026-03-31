from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

ROLES = ["super_admin", "finance_manager", "finance_staff", "view_only"]


class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    status: str = "active"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None


class UserOut(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
