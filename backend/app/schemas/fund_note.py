from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class FundNoteBase(BaseModel):
    period_date: date
    company_id: int
    bank_account_id: Optional[int] = None
    direction: Optional[str] = None    # increase / decrease / neutral
    amount_change: Optional[Decimal] = None
    currency: str = "MYR"
    notes: str


class FundNoteCreate(FundNoteBase):
    pass


class FundNoteUpdate(BaseModel):
    direction: Optional[str] = None
    amount_change: Optional[Decimal] = None
    notes: Optional[str] = None


class FundNoteOut(FundNoteBase):
    id: int
    created_by: Optional[int] = None
    creator_name: Optional[str] = None
    company_name: Optional[str] = None
    account_display: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
