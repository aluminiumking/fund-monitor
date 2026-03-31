from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date,
    Boolean, Numeric, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class BalanceSnapshot(Base):
    __tablename__ = "balance_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False, index=True)
    currency = Column(String(10), nullable=False)
    balance_original = Column(Numeric(18, 2), nullable=False)   # 原币余额
    exchange_rate = Column(Numeric(10, 6), default=1.0)         # 对 MYR 汇率
    balance_myr = Column(Numeric(18, 2), nullable=False)        # 折算 MYR
    data_source = Column(String(50), default="manual")          # bank_app / statement / manual
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_audited = Column(Boolean, default=False)
    audited_by = Column(Integer, ForeignKey("users.id"))
    audited_at = Column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("snapshot_date", "bank_account_id", name="uq_snapshot_date_account"),
    )

    bank_account = relationship("BankAccount", back_populates="snapshots")
    company = relationship("Company")
    creator = relationship("User", foreign_keys=[created_by])
    auditor = relationship("User", foreign_keys=[audited_by])
