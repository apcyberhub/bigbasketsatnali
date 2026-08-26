from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime
from app.core.database import Base
from app.models.base import TimestampMixin


class Coupon(Base, TimestampMixin):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    discount_type = Column(String(20), default="percentage", nullable=False)  # 'percentage' or 'fixed'
    discount_value = Column(Numeric(10, 2), nullable=False)
    minimum_order = Column(Numeric(10, 2), default=0, nullable=False)
    maximum_discount = Column(Numeric(10, 2), nullable=True)
    usage_limit = Column(Integer, default=1000, nullable=False)
    used_count = Column(Integer, default=0, nullable=False)
    per_user_limit = Column(Integer, default=1, nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)

    def __repr__(self):
        return f"<Coupon code='{self.code}' type='{self.discount_type}' val={self.discount_value}>"
