from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # e.g. "product_created", "stock_updated", "order_status_changed"
    entity_type = Column(String(50), nullable=False, index=True)  # e.g. "product", "order", "category", "customer", "coupon"
    entity_id = Column(String(50), nullable=True, index=True)
    details = Column(Text, nullable=True)  # JSON or descriptive text
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    admin_user = relationship("User")

    def __repr__(self):
        return f"<AdminAuditLog id={self.id} action='{self.action}' entity='{self.entity_type}:{self.entity_id}'>"
