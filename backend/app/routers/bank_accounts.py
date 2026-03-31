from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.bank_account import BankAccount
from ..models.company import Company
from ..models.user import User
from ..schemas.bank_account import BankAccountCreate, BankAccountUpdate, BankAccountOut
from ..core.dependencies import require_manager_or_above, require_any_role

router = APIRouter(prefix="/bank-accounts", tags=["bank-accounts"])


def _enrich(account: BankAccount) -> dict:
    d = {c.name: getattr(account, c.name) for c in account.__table__.columns}
    d["company_name"] = account.company.name if account.company else None
    d["display_name"] = account.display_name or account.account_name
    return d


@router.get("/", response_model=List[BankAccountOut])
def list_accounts(
    company_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    currency: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_any_role),
):
    q = db.query(BankAccount)
    if company_id:
        q = q.filter(BankAccount.company_id == company_id)
    if status:
        q = q.filter(BankAccount.status == status)
    if currency:
        q = q.filter(BankAccount.currency == currency)
    accounts = q.order_by(BankAccount.company_id, BankAccount.bank_name).all()
    return [_enrich(a) for a in accounts]


@router.get("/{account_id}", response_model=BankAccountOut)
def get_account(account_id: int, db: Session = Depends(get_db), _: User = Depends(require_any_role)):
    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return _enrich(account)


@router.post("/", response_model=BankAccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    data: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    if not db.query(Company).filter(Company.id == data.company_id).first():
        raise HTTPException(status_code=404, detail="Company not found")
    account = BankAccount(**data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return _enrich(account)


@router.put("/{account_id}", response_model=BankAccountOut)
def update_account(
    account_id: int,
    data: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return _enrich(account)
