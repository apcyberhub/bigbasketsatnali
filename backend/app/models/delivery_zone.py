from sqlalchemy import Column, Integer, String, Numeric, Boolean, Text
from app.core.database import Base
from app.models.base import TimestampMixin


class DeliveryZone(Base, TimestampMixin):
    __tablename__ = "delivery_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    pincodes = Column(Text, nullable=False)  # Comma-separated or JSON list of 6-digit pincodes e.g. "123024, 123025"
    city = Column(String(100), default="Satnali", nullable=False)
    state = Column(String(100), default="Haryana", nullable=False)

    delivery_fee = Column(Numeric(10, 2), default=30.00, nullable=False)
    free_delivery_threshold = Column(Numeric(10, 2), default=499.00, nullable=False)
    minimum_order = Column(Numeric(10, 2), default=99.00, nullable=False)

    estimated_min_minutes = Column(Integer, default=30, nullable=False)
    estimated_max_minutes = Column(Integer, default=60, nullable=False)

    is_active = Column(Boolean, default=True, index=True, nullable=False)

    def __repr__(self):
        return f"<DeliveryZone id={self.id} name='{self.name}' fee={self.delivery_fee} active={self.is_active}>"
