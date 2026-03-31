from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class ExchangeRateBase(BaseModel):
    date: date
    currency: str
    rate_to_myr: Decimal
    is_default: bool = False
    notes: Optional[str] = None


class ExchangeRateCreate(ExchangeRateBase):
    pass


class ExchangeRateUpdate(BaseModel):
    rate_to_myr: Optional[Decimal] = None
    is_default: Optional[bool] = None
    notes: Optional[str] = None


class ExchangeRateOut(ExchangeRateBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
