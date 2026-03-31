from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    bank_name = Column(String(100), nullable=False)
    account_name = Column(String(200), nullable=False)
    account_number = Column(String(50), nullable=False)
    display_name = Column(String(100))
    currency = Column(String(10), default="MYR")       # MYR / USD
    account_type = Column(String(20), default="current")  # current / savings / fd / other
    is_liquid = Column(Boolean, default=True)             # 可动用资金
    open_date = Column(Date)
    fd_maturity_date = Column(Date)                       # 定期到期日
    interest_rate = Column(Numeric(5, 2))                 # 利率 %
    status = Column(String(20), default="active")
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="bank_accounts")
    snapshots = relationship("BalanceSnapshot", back_populates="bank_account", lazy="dynamic")
    fund_notes = relationship("FundNote", back_populates="bank_account", lazy="dynamic")
