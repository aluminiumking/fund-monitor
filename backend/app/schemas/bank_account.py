from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class BankAccountBase(BaseModel):
    company_id: int
    bank_name: str
    account_name: str
    account_number: str
    display_name: Optional[str] = None
    currency: str = "MYR"
    account_type: str = "current"   # current / savings / fd / other
    is_liquid: bool = True
    open_date: Optional[date] = None
    fd_maturity_date: Optional[date] = None
    interest_rate: Optional[Decimal] = None
    status: str = "active"
    notes: Optional[str] = None


class BankAccountCreate(BankAccountBase):
    pass


class BankAccountUpdate(BaseModel):
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    display_name: Optional[str] = None
    currency: Optional[str] = None
    account_type: Optional[str] = None
    is_liquid: Optional[bool] = None
    fd_maturity_date: Optional[date] = None
    interest_rate: Optional[Decimal] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class BankAccountOut(BankAccountBase):
    id: int
    company_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
