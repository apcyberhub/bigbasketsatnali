from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    provider = Column(String(50), default="razorpay", nullable=False)
    provider_order_id = Column(String(100), index=True, nullable=False)
    provider_payment_id = Column(String(100), index=True, nullable=True)

    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)

    # Status: created, authorized, captured, failed, refunded, partially_refunded
    status = Column(String(50), default="created", index=True, nullable=False)
    method = Column(String(50), nullable=True)  # upi, card, netbanking, wallet, emi

    signature_verified = Column(Boolean, default=False, nullable=False)
    failure_reason = Column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="payments")
    user = relationship("User", back_populates="payments")
    events = relationship("PaymentEvent", back_populates="payment", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="payment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Payment id={self.id} order_id={self.order_id} provider_order_id='{self.provider_order_id}' status='{self.status}'>"
