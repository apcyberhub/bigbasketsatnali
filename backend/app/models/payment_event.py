from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="SET NULL"), index=True, nullable=True)

    event_type = Column(String(100), nullable=False)  # e.g., payment.captured, payment.failed
    provider_event_id = Column(String(100), unique=True, index=True, nullable=False)
    payload_reference = Column(Text, nullable=True)  # JSON or redacted metadata reference

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    payment = relationship("Payment", back_populates="events")

    def __repr__(self):
        return f"<PaymentEvent id={self.id} event='{self.event_type}' provider_event_id='{self.provider_event_id}'>"
