from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    admin_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    change_quantity = Column(Integer, nullable=False)  # positive for addition, negative for reduction
    previous_quantity = Column(Integer, nullable=False)
    new_quantity = Column(Integer, nullable=False)
    reason = Column(String(50), nullable=False, index=True)
    # 'stock_added', 'stock_removed', 'order_reserved', 'order_cancelled', 'manual_adjustment', 'damage_loss'
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    product = relationship("Product")
    admin_user = relationship("User")

    def __repr__(self):
        return f"<InventoryTransaction prod_id={self.product_id} change={self.change_quantity} reason='{self.reason}'>"
