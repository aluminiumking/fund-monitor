from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    short_name = Column(String(50), nullable=False)
    code = Column(String(20), unique=True, nullable=False, index=True)
    ssm_no = Column(String(50))
    default_currency = Column(String(10), default="MYR")
    status = Column(String(20), default="active")  # active / inactive
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    bank_accounts = relationship("BankAccount", back_populates="company", lazy="dynamic")
