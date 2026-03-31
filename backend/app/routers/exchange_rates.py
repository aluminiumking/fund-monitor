from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models.exchange_rate import ExchangeRate
from ..models.user import User
from ..schemas.exchange_rate import ExchangeRateCreate, ExchangeRateUpdate, ExchangeRateOut
from ..core.dependencies import require_manager_or_above, require_any_role

router = APIRouter(prefix="/exchange-rates", tags=["exchange-rates"])


@router.get("/", response_model=List[ExchangeRateOut])
def list_rates(
    currency: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_any_role),
):
    q = db.query(ExchangeRate)
    if currency:
        q = q.filter(ExchangeRate.currency == currency)
    if date_from:
        q = q.filter(ExchangeRate.date >= date_from)
    if date_to:
        q = q.filter(ExchangeRate.date <= date_to)
    return q.order_by(ExchangeRate.date.desc()).all()


@router.get("/latest/{currency}", response_model=ExchangeRateOut)
def get_latest_rate(currency: str, db: Session = Depends(get_db), _: User = Depends(require_any_role)):
    rate = db.query(ExchangeRate).filter(
        ExchangeRate.currency == currency
    ).order_by(ExchangeRate.date.desc()).first()
    if not rate:
        raise HTTPException(status_code=404, detail=f"No exchange rate found for {currency}")
    return rate


@router.post("/", response_model=ExchangeRateOut, status_code=status.HTTP_201_CREATED)
def create_rate(
    data: ExchangeRateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    existing = db.query(ExchangeRate).filter(
        ExchangeRate.date == data.date,
        ExchangeRate.currency == data.currency
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Rate already exists for this date and currency. Use PUT.")
    rate = ExchangeRate(**data.model_dump())
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return rate


@router.put("/{rate_id}", response_model=ExchangeRateOut)
def update_rate(
    rate_id: int,
    data: ExchangeRateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_above),
):
    rate = db.query(ExchangeRate).filter(ExchangeRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Exchange rate not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rate, field, value)
    db.commit()
    db.refresh(rate)
    return rate
