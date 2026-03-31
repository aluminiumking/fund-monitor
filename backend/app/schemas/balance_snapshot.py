from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class BalanceSnapshotBase(BaseModel):
    snapshot_date: date
    company_id: Optional[int] = None
    bank_account_id: int
    currency: str
    balance_original: Decimal
    exchange_rate: Decimal = Decimal("1.0")
    balance_myr: Decimal
    data_source: str = "manual"    # bank_app / statement / manual
    notes: Optional[str] = None


class BalanceSnapshotCreate(BaseModel):
    snapshot_date: date
    bank_account_id: int
    currency: str
    balance_original: Decimal
    exchange_rate: Decimal = Decimal("1.0")
    balance_myr: Decimal
    data_source: str = "manual"
    notes: Optional[str] = None


class BalanceSnapshotUpdate(BaseModel):
    balance_original: Optional[Decimal] = None
    exchange_rate: Optional[Decimal] = None
    balance_myr: Optional[Decimal] = None
    data_source: Optional[str] = None
    notes: Optional[str] = None


class BalanceSnapshotOut(BalanceSnapshotBase):
    id: int
    is_audited: bool = False
    created_by: Optional[int] = None
    creator_name: Optional[str] = None
    audited_by: Optional[int] = None
    auditor_name: Optional[str] = None
    audited_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    company_name: Optional[str] = None
    account_display: Optional[str] = None

    class Config:
        from_attributes = True


class AuditSnapshotRequest(BaseModel):
    snapshot_ids: list[int]
