from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Address(Base, TimestampMixin):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=False)
    landmark = Column(String(255), nullable=True)
    city = Column(String(100), default="Satnali", nullable=False)
    state = Column(String(100), default="Haryana", nullable=False)
    pincode = Column(String(10), nullable=False)
    address_type = Column(String(20), default="home", nullable=False)  # 'home', 'work', 'other'
    is_default = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="addresses")
    orders = relationship("Order", back_populates="address")

    def __repr__(self):
        return f"<Address id={self.id} user_id={self.user_id} type='{self.address_type}' default={self.is_default}>"
