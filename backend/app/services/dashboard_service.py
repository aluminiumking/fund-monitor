from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from decimal import Decimal
from datetime import date, timedelta
from ..models.balance_snapshot import BalanceSnapshot
from ..models.bank_account import BankAccount
from ..models.company import Company


def get_latest_snapshot_per_account(db: Session) -> list[BalanceSnapshot]:
    """Get the most recent snapshot for each active bank account."""
    subq = (
        db.query(
            BalanceSnapshot.bank_account_id,
            func.max(BalanceSnapshot.snapshot_date).label("max_date"),
        )
        .group_by(BalanceSnapshot.bank_account_id)
        .subquery()
    )
    return (
        db.query(BalanceSnapshot)
        .join(subq, and_(
            BalanceSnapshot.bank_account_id == subq.c.bank_account_id,
            BalanceSnapshot.snapshot_date == subq.c.max_date,
        ))
        .join(BankAccount, BalanceSnapshot.bank_account_id == BankAccount.id)
        .filter(BankAccount.status == "active")
        .all()
    )


def get_kpi(db: Session) -> dict:
    snapshots = get_latest_snapshot_per_account(db)

    total_myr = Decimal("0")
    liquid_myr = Decimal("0")
    fixed_myr = Decimal("0")
    usd_original = Decimal("0")

    for s in snapshots:
        bal = s.balance_myr or Decimal("0")
        total_myr += bal
        if s.bank_account.is_liquid:
            liquid_myr += bal
        else:
            fixed_myr += bal
        if s.currency == "USD":
            usd_original += s.balance_original or Decimal("0")

    # Week-over-week
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    year_ago = today - timedelta(days=365)

    def sum_at_date(target_date: date) -> Decimal:
        subq = (
            db.query(
                BalanceSnapshot.bank_account_id,
                func.max(BalanceSnapshot.snapshot_date).label("max_date"),
            )
            .filter(BalanceSnapshot.snapshot_date <= target_date)
            .group_by(BalanceSnapshot.bank_account_id)
            .subquery()
        )
        rows = (
            db.query(func.sum(BalanceSnapshot.balance_myr))
            .join(subq, and_(
                BalanceSnapshot.bank_account_id == subq.c.bank_account_id,
                BalanceSnapshot.snapshot_date == subq.c.max_date,
            ))
            .scalar()
        )
        return rows or Decimal("0")

    prev_week = sum_at_date(week_ago)
    prev_month = sum_at_date(month_ago)
    prev_year = sum_at_date(year_ago)

    def pct_change(current, previous):
        if not previous or previous == 0:
            return None
        return float(((current - previous) / previous) * 100)

    return {
        "total_myr": float(total_myr),
        "liquid_myr": float(liquid_myr),
        "fixed_myr": float(fixed_myr),
        "usd_original": float(usd_original),
        "week_change": float(total_myr - prev_week),
        "week_change_pct": pct_change(total_myr, prev_week),
        "month_change": float(total_myr - prev_month),
        "month_change_pct": pct_change(total_myr, prev_month),
        "year_change": float(total_myr - prev_year),
        "year_change_pct": pct_change(total_myr, prev_year),
    }


def get_company_breakdown(db: Session) -> list[dict]:
    snapshots = get_latest_snapshot_per_account(db)
    company_map: dict[int, dict] = {}
    for s in snapshots:
        cid = s.company_id
        if cid not in company_map:
            company_map[cid] = {
                "company_id": cid,
                "company_name": s.company.name if s.company else str(cid),
                "company_short": s.company.short_name if s.company else str(cid),
                "total_myr": Decimal("0"),
                "liquid_myr": Decimal("0"),
                "fixed_myr": Decimal("0"),
            }
        bal = s.balance_myr or Decimal("0")
        company_map[cid]["total_myr"] += bal
        if s.bank_account.is_liquid:
            company_map[cid]["liquid_myr"] += bal
        else:
            company_map[cid]["fixed_myr"] += bal

    return [
        {**v, "total_myr": float(v["total_myr"]), "liquid_myr": float(v["liquid_myr"]), "fixed_myr": float(v["fixed_myr"])}
        for v in company_map.values()
    ]


def get_weekly_trend(db: Session, weeks: int = 12) -> list[dict]:
    today = date.today()
    result = []
    for i in range(weeks - 1, -1, -1):
        target = today - timedelta(weeks=i)
        week_label = target.strftime("W%W %Y")
        total = _sum_at(db, target)
        result.append({"date": target.isoformat(), "label": week_label, "total_myr": float(total)})
    return result


def get_monthly_trend(db: Session, months: int = 12) -> list[dict]:
    today = date.today()
    result = []
    for i in range(months - 1, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        from calendar import monthrange
        last_day = monthrange(year, month)[1]
        target = date(year, month, last_day)
        total = _sum_at(db, target)
        result.append({"date": target.isoformat(), "label": f"{year}-{month:02d}", "total_myr": float(total)})
    return result


def _sum_at(db: Session, target_date: date) -> Decimal:
    subq = (
        db.query(
            BalanceSnapshot.bank_account_id,
            func.max(BalanceSnapshot.snapshot_date).label("max_date"),
        )
        .filter(BalanceSnapshot.snapshot_date <= target_date)
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


def get_account_breakdown(db: Session) -> list[dict]:
    """Latest balance for every active account that has a snapshot."""
    snapshots = get_latest_snapshot_per_account(db)
    result = []
    for s in snapshots:
        acc = s.bank_account
        result.append({
            "account_id": acc.id,
            "company_name": s.company.name if s.company else "",
            "company_short": s.company.short_name if s.company else "",
            "account_name": acc.display_name or acc.account_name,
            "bank_name": acc.bank_name,
            "account_type": acc.account_type,
            "currency": s.currency,
            "balance_original": float(s.balance_original or 0),
            "balance_myr": float(s.balance_myr or 0),
            "is_liquid": acc.is_liquid,
            "snapshot_date": s.snapshot_date.isoformat(),
        })
    result.sort(key=lambda x: (x["company_name"], x["account_name"]))
    return result


def get_alerts(db: Session) -> list[dict]:
    alerts = []
    today = date.today()
    LOW_BALANCE_THRESHOLD = 10000  # MYR

    # Low balance alerts
    snapshots = get_latest_snapshot_per_account(db)
    for s in snapshots:
        if s.balance_myr and s.balance_myr < LOW_BALANCE_THRESHOLD:
            alerts.append({
                "type": "low_balance",
                "severity": "warning",
                "message": f"{s.bank_account.display_name or s.bank_account.account_name}: balance MYR {float(s.balance_myr):,.2f} is below threshold",
                "account_id": s.bank_account_id,
            })

    # FD expiry alerts (within 30 days)
    fd_accounts = db.query(BankAccount).filter(
        BankAccount.account_type == "fd",
        BankAccount.status == "active",
        BankAccount.fd_maturity_date != None,
        BankAccount.fd_maturity_date <= today + timedelta(days=30),
    ).all()
    for acc in fd_accounts:
        days_left = (acc.fd_maturity_date - today).days
        alerts.append({
            "type": "fd_expiry",
            "severity": "info" if days_left > 7 else "warning",
            "message": f"FD {acc.display_name or acc.account_name} matures in {days_left} day(s) on {acc.fd_maturity_date}",
            "account_id": acc.id,
        })

    # Stale data alerts (no snapshot for > 10 days)
    for s in snapshots:
        days_stale = (today - s.snapshot_date).days
        if days_stale > 10:
            alerts.append({
                "type": "stale_data",
                "severity": "info",
                "message": f"{s.bank_account.display_name or s.bank_account.account_name}: last updated {days_stale} days ago",
                "account_id": s.bank_account_id,
            })

    return alerts
