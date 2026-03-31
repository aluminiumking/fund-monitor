from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from ..database import get_db
from ..models.user import User
from ..core.dependencies import require_any_role
from ..services import report_service as svc

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/weekly")
def weekly_report(
    report_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_any_role),
):
    return svc.weekly_report(db, report_date)


@router.get("/monthly")
def monthly_report(
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_any_role),
):
    return svc.monthly_report(db, year, month)


@router.get("/yearly")
def yearly_report(
    year: int = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_any_role),
):
    return svc.yearly_report(db, year)


@router.get("/accounts")
def account_report(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_any_role),
):
    return svc.account_report(db, date_from, date_to)
