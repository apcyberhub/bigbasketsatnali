from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Refund(Base, TimestampMixin):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="CASCADE"), index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False)

    provider_refund_id = Column(String(100), index=True, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)

    # Status: requested, processed, failed, cancelled
    status = Column(String(50), default="processed", index=True, nullable=False)
    reason = Column(Text, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    payment = relationship("Payment", back_populates="refunds")
    order = relationship("Order", back_populates="refunds")
    admin_user = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<Refund id={self.id} payment_id={self.payment_id} amount={self.amount} status='{self.status}'>"
