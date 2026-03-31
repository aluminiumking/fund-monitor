from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CompanyBase(BaseModel):
    name: str
    short_name: str
    code: str
    ssm_no: Optional[str] = None
    default_currency: str = "MYR"
    status: str = "active"
    notes: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    ssm_no: Optional[str] = None
    default_currency: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class CompanyOut(CompanyBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
