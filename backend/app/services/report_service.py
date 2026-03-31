from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from decimal import Decimal
from datetime import date, timedelta
from calendar import monthrange
from ..models.balance_snapshot import BalanceSnapshot
from ..models.bank_account import BankAccount
from ..models.company import Company
from .dashboard_service import _sum_at


def _company_sum_at(db: Session, company_id: int, target_date: date) -> Decimal:
    subq = (
        db.query(
            BalanceSnapshot.bank_account_id,
            func.max(BalanceSnapshot.snapshot_date).label("max_date"),
        )
        .filter(
            BalanceSnapshot.snapshot_date <= target_date,
            BalanceSnapshot.company_id == company_id,
        )
        .group_by(BalanceSnapshot.bank_account_id)
        .subquery()
    )
    val = (
        db.query(func.sum(BalanceSnapshot.balance_myr))
        .join(subq, and_(
            BalanceSnapshot.bank_account_id == subq.c.bank_account_id,
            BalanceSnapshot.snapshot_date == subq.c.max_date,
        ))
        .scalar()
    )
    return val or Decimal("0")


def _company_liquid_at(db: Session, company_id: int, target_date: date) -> Decimal:
    subq = (
        db.query(
            BalanceSnapshot.bank_account_id,
            func.max(BalanceSnapshot.snapshot_date).label("max_date"),
        )
        .filter(
            BalanceSnapshot.snapshot_date <= target_date,
            BalanceSnapshot.company_id == company_id,
        )
        .group_by(BalanceSnapshot.bank_account_id)
        .subquery()
    )
    val = (
        db.query(func.sum(BalanceSnapshot.balance_myr))
        .join(subq, and_(
            BalanceSnapshot.bank_account_id == subq.c.bank_account_id,
            BalanceSnapshot.snapshot_date == subq.c.max_date,
        ))
        .join(BankAccount, BalanceSnapshot.bank_account_id == BankAccount.id)
        .filter(BankAccount.is_liquid == True)
        .scalar()
    )
    return val or Decimal("0")


def _company_fixed_at(db: Session, company_id: int, target_date: date) -> Decimal:
    total = _company_sum_at(db, company_id, target_date)
    liquid = _company_liquid_at(db, company_id, target_date)
    return total - liquid


def _pct(current: Decimal, previous: Decimal):
    if not previous or previous == 0:
        return None
    return round(float((current - previous) / previous * 100), 2)


def weekly_report(db: Session, report_date: date = None) -> list[dict]:
    today = report_date or date.today()
    week_ago = today - timedelta(days=7)
    companies = db.query(Company).filter(Company.status == "active").all()
    rows = []
    for c in companies:
        current = _company_sum_at(db, c.id, today)
        previous = _company_sum_at(db, c.id, week_ago)
        liquid = _company_liquid_at(db, c.id, today)
        fixed = _company_fixed_at(db, c.id, today)
        rows.append({
            "company_id": c.id,
            "company_name": c.name,
            "company_short": c.short_name,
            "prev_balance": float(previous),
            "curr_balance": float(current),
            "change": float(current - previous),
            "change_pct": _pct(current, previous),
            "liquid_myr": float(liquid),
            "fixed_myr": float(fixed),
            "period_label": f"{week_ago.isoformat()} → {today.isoformat()}",
        })
    return rows


def monthly_report(db: Session, year: int, month: int) -> list[dict]:
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    prev_month = month - 1 or 12
    prev_year = year if month > 1 else year - 1
    prev_end = date(prev_year, prev_month, monthrange(prev_year, prev_month)[1])

    companies = db.query(Company).filter(Company.status == "active").all()
    rows = []
    for c in companies:
        month_start = _company_sum_at(db, c.id, start - timedelta(days=1))
        month_end = _company_sum_at(db, c.id, end)
        rows.append({
            "company_id": c.id,
            "company_name": c.name,
            "company_short": c.short_name,
            "month_start_balance": float(month_start),
            "month_end_balance": float(month_end),
            "change": float(month_end - month_start),
            "change_pct": _pct(month_end, month_start),
            "period_label": f"{year}-{month:02d}",
        })
    return rows


def yearly_report(db: Session, year: int) -> list[dict]:
    year_start = date(year, 1, 1)
    year_end = date(year, 12, 31)
    today = date.today()
    effective_end = min(year_end, today)

    companies = db.query(Company).filter(Company.status == "active").all()
    rows = []
    for c in companies:
        start_bal = _company_sum_at(db, c.id, year_start - timedelta(days=1))
        end_bal = _company_sum_at(db, c.id, effective_end)

        # Monthly balances for max/min
        monthly_vals = []
        for m in range(1, 13):
            last_day = monthrange(year, m)[1]
            d = date(year, m, last_day)
            if d > today:
                break
            monthly_vals.append(_company_sum_at(db, c.id, d))

        rows.append({
            "company_id": c.id,
            "company_name": c.name,
            "company_short": c.short_name,
            "year_start_balance": float(start_bal),
            "current_balance": float(end_bal),
            "change": float(end_bal - start_bal),
            "change_pct": _pct(end_bal, start_bal),
            "max_balance": float(max(monthly_vals)) if monthly_vals else None,
            "min_balance": float(min(monthly_vals)) if monthly_vals else None,
            "period_label": str(year),
        })
    return rows


def account_report(db: Session, date_from: date = None, date_to: date = None) -> list[dict]:
    today = date.today()
    target = date_to or today
    prev_target = date_from or (target - timedelta(days=7))

    accounts = db.query(BankAccount).filter(BankAccount.status == "active").all()
    rows = []
    for acc in accounts:
        subq_curr = (
            db.query(func.max(BalanceSnapshot.snapshot_date))
            .filter(
                BalanceSnapshot.bank_account_id == acc.id,
                BalanceSnapshot.snapshot_date <= target,
            )
            .scalar()
        )
        subq_prev = (
            db.query(func.max(BalanceSnapshot.snapshot_date))
            .filter(
                BalanceSnapshot.bank_account_id == acc.id,
                BalanceSnapshot.snapshot_date <= prev_target,
            )
            .scalar()
        )

        curr_snap = db.query(BalanceSnapshot).filter(
            BalanceSnapshot.bank_account_id == acc.id,
            BalanceSnapshot.snapshot_date == subq_curr,
        ).first() if subq_curr else None

        prev_snap = db.query(BalanceSnapshot).filter(
            BalanceSnapshot.bank_account_id == acc.id,
            BalanceSnapshot.snapshot_date == subq_prev,
        ).first() if subq_prev else None

        curr_myr = curr_snap.balance_myr if curr_snap else Decimal("0")
        prev_myr = prev_snap.balance_myr if prev_snap else Decimal("0")

        rows.append({
            "account_id": acc.id,
            "company_name": acc.company.name if acc.company else "",
            "account_display": acc.display_name or acc.account_name,
            "bank_name": acc.bank_name,
            "currency": acc.currency,
            "account_type": acc.account_type,
            "is_liquid": acc.is_liquid,
            "prev_balance_myr": float(prev_myr),
            "curr_balance_myr": float(curr_myr),
            "change": float(curr_myr - prev_myr),
            "change_pct": _pct(curr_myr, prev_myr),
            "last_snapshot_date": subq_curr.isoformat() if subq_curr else None,
            "days_since_update": (today - subq_curr).days if subq_curr else None,
        })
    return rows
