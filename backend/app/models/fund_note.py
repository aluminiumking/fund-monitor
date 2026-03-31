from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class FundNote(Base):
    __tablename__ = "fund_notes"

    id = Column(Integer, primary_key=True, index=True)
    period_date = Column(Date, nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"))  # 可选
    direction = Column(String(20))   # increase / decrease / neutral
    amount_change = Column(Numeric(18, 2))
    currency = Column(String(10), default="MYR")
    notes = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company")
    bank_account = relationship("BankAccount", back_populates="fund_notes")
    creator = relationship("User")
