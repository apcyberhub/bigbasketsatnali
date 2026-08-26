from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False)
    address_id = Column(Integer, ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True)
    delivery_zone_id = Column(Integer, ForeignKey("delivery_zones.id", ondelete="SET NULL"), nullable=True)

    # Monetary fields
    subtotal = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=0, nullable=False)
    delivery_fee = Column(Numeric(10, 2), default=0, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)

    # Coupon & Delivery metadata
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="SET NULL"), nullable=True)
    coupon_code = Column(String(50), nullable=True)
    estimated_delivery = Column(String(100), default="30–60 minutes", nullable=True)
    idempotency_key = Column(String(100), unique=True, index=True, nullable=True)

    # Status tracking
    status = Column(String(30), default="pending", index=True, nullable=False)
    # 'pending', 'confirmed', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled'
    payment_status = Column(String(30), default="pending", nullable=False)
    # 'pending', 'paid', 'failed', 'refunded'
    payment_method = Column(String(100), default="Cash on Delivery", nullable=False)

    # Relationships
    user = relationship("User", back_populates="orders")
    address = relationship("Address", back_populates="orders")
    delivery_zone = relationship("DeliveryZone")
    coupon = relationship("Coupon")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order id={self.id} number='{self.order_number}' status='{self.status}' total={self.total_amount}>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    # Snapshot fields (Preserves history if product changes later)
    product_name = Column(String(255), nullable=False)
    product_weight = Column(String(50), nullable=True)
    sku = Column(String(100), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

    def __repr__(self):
        return f"<OrderItem id={self.id} order_id={self.order_id} name='{self.product_name}' qty={self.quantity}>"
