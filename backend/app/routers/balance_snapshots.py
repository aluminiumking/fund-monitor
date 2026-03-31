from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date, datetime
from ..database import get_db
from ..models.balance_snapshot import BalanceSnapshot
from ..models.bank_account import BankAccount
from ..models.audit_log import AuditLog
from ..models.user import User
from ..schemas.balance_snapshot import (
    BalanceSnapshotCreate, BalanceSnapshotUpdate, BalanceSnapshotOut, AuditSnapshotRequest
)
from ..core.dependencies import require_manager_or_above, require_staff_or_above, require_any_role

router = APIRouter(prefix="/balance-snapshots", tags=["balance-snapshots"])


def _enrich(s: BalanceSnapshot) -> dict:
    d = {c.name: getattr(s, c.name) for c in s.__table__.columns}
    d["company_name"] = s.company.name if s.company else None
    d["account_display"] = (
        s.bank_account.display_name or s.bank_account.account_name
    ) if s.bank_account else None
    d["creator_name"] = s.creator.full_name or s.creator.username if s.creator else None
    d["auditor_name"] = s.auditor.full_name or s.auditor.username if s.auditor else None
    return d


@router.get("/", response_model=List[BalanceSnapshotOut])
def list_snapshots(
    company_id: Optional[int] = Query(None),
    bank_account_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    is_audited: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_any_role),
):
    q = db.query(BalanceSnapshot)
    if company_id:
        q = q.filter(BalanceSnapshot.company_id == company_id)
    if bank_account_id:
        q = q.filter(BalanceSnapshot.bank_account_id == bank_account_id)
    if date_from:
        q = q.filter(BalanceSnapshot.snapshot_date >= date_from)
    if date_to:
        q = q.filter(BalanceSnapshot.snapshot_date <= date_to)
    if is_audited is not None:
        q = q.filter(BalanceSnapshot.is_audited == is_audited)
    snapshots = q.order_by(BalanceSnapshot.snapshot_date.desc()).all()
    return [_enrich(s) for s in snapshots]


@router.get("/{snapshot_id}", response_model=BalanceSnapshotOut)
def get_snapshot(snapshot_id: int, db: Session = Depends(get_db), _: User = Depends(require_any_role)):
    s = db.query(BalanceSnapshot).filter(BalanceSnapshot.id == snapshot_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return _enrich(s)


@router.post("/", response_model=BalanceSnapshotOut, status_code=status.HTTP_201_CREATED)
def create_snapshot(
    data: BalanceSnapshotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_above),
):
    # Check for duplicate (same account + date)
    existing = db.query(BalanceSnapshot).filter(
        BalanceSnapshot.bank_account_id == data.bank_account_id,
        BalanceSnapshot.snapshot_date == data.snapshot_date,
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"A snapshot already exists for this account on {data.snapshot_date}. Use PUT to update."
        )
    account = db.query(BankAccount).filter(BankAccount.id == data.bank_account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    payload = data.model_dump()
    payload["company_id"] = account.company_id  # auto-derive from account
    snapshot = BalanceSnapshot(**payload, created_by=current_user.id)
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return _enrich(snapshot)


@router.put("/{snapshot_id}", response_model=BalanceSnapshotOut)
def update_snapshot(
    snapshot_id: int,
    data: BalanceSnapshotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_above),
):
    s = db.query(BalanceSnapshot).filter(BalanceSnapshot.id == snapshot_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    if s.is_audited and current_user.role not in ("super_admin", "finance_manager"):
        raise HTTPException(status_code=403, detail="Cannot modify audited snapshot without manager role")

    old_vals = {f: str(getattr(s, f)) for f in ["balance_original", "exchange_rate", "balance_myr"]}
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    db.commit()

    # Write audit log
    new_vals = {f: str(getattr(s, f)) for f in ["balance_original", "exchange_rate", "balance_myr"]}
    log = AuditLog(user_id=current_user.id, action="update", table_name="balance_snapshots",
                   record_id=s.id, old_value=old_vals, new_value=new_vals)
    db.add(log)
    db.commit()
    db.refresh(s)
    return _enrich(s)


@router.post("/audit", response_model=List[BalanceSnapshotOut])
def audit_snapshots(
    data: AuditSnapshotRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    snapshots = db.query(BalanceSnapshot).filter(BalanceSnapshot.id.in_(data.snapshot_ids)).all()
    for s in snapshots:
        s.is_audited = True
        s.audited_by = current_user.id
        s.audited_at = datetime.utcnow()
    db.commit()
    return [_enrich(s) for s in snapshots]
