from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..core.dependencies import require_any_role
from ..services import dashboard_service as svc

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpi")
def get_kpi(db: Session = Depends(get_db), _: User = Depends(require_any_role)):
    return svc.get_kpi(db)


@router.get("/company-breakdown")
def get_company_breakdown(db: Session = Depends(get_db), _: User = Depends(require_any_role)):
    return svc.get_company_breakdown(db)


@router.get("/weekly-trend")
def get_weekly_trend(weeks: int = 12, db: Session = Depends(get_db), _: User = Depends(require_any_role)):
    return svc.get_weekly_trend(db, weeks)


@router.get("/monthly-trend")
def get_monthly_trend(months: int = 12, db: Session = Depends(get_db), _: User = Depends(require_any_role)):
    return svc.get_monthly_trend(db, months)


@router.get("/account-breakdown")
def get_account_breakdown(db: Session = Depends(get_db), _: User = Depends(require_any_role)):
    return svc.get_account_breakdown(db)


@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db), _: User = Depends(require_any_role)):
    return svc.get_alerts(db)
