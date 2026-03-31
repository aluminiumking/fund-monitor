from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Boolean, Numeric, UniqueConstraint
from sqlalchemy.sql import func
from ..database import Base


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    currency = Column(String(10), nullable=False)     # USD / SGD etc.
    rate_to_myr = Column(Numeric(10, 6), nullable=False)
    is_default = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("date", "currency", name="uq_rate_date_currency"),
    )
