from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    slug = Column(String(280), unique=True, index=True, nullable=False)
    brand = Column(String(100), index=True, nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), index=True, nullable=False)
    subcategory_name = Column(String(100), index=True, nullable=True)

    # Monetary & Numerical fields (Strict Decimal/Numeric, never float)
    price = Column(Numeric(10, 2), index=True, nullable=False)
    mrp = Column(Numeric(10, 2), nullable=False)
    discount_percentage = Column(Integer, default=0, index=True, nullable=False)
    stock_quantity = Column(Integer, default=50, index=True, nullable=False)
    low_stock_threshold = Column(Integer, default=10, nullable=False)
    unit = Column(String(50), default="piece", nullable=False)
    weight = Column(String(50), nullable=True)

    # Visual & Presentation
    emoji = Column(String(20), default="🛒", nullable=False)
    badge = Column(String(50), nullable=True)
    eta = Column(String(50), default="10–15 mins", nullable=False)
    rating = Column(Numeric(3, 2), default=4.5, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)

    # JSON or serialized metadata
    tags = Column(Text, nullable=True)
    highlights = Column(Text, nullable=True)
    specifications = Column(Text, nullable=True)
    frequently_bought_with = Column(Text, nullable=True)

    # State flags
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)

    # Relationships
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
    wishlist_items = relationship("Wishlist", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product id={self.id} sku='{self.sku}' name='{self.name}'>"


class ProductImage(Base, TimestampMixin):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    image_url = Column(String(500), nullable=False)
    alt_text = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    product = relationship("Product", back_populates="images")

    def __repr__(self):
        return f"<ProductImage id={self.id} product_id={self.product_id}>"
