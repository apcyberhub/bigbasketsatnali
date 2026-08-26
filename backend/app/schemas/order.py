from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.address import AddressResponse


class OrderCreate(BaseModel):
    address_id: int = Field(..., gt=0)
    payment_method: str = Field("Cash on Delivery", max_length=100)
    coupon_code: Optional[str] = None
    idempotency_key: Optional[str] = None


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: Optional[int] = None
    product_name: str
    product_weight: Optional[str] = None
    sku: Optional[str] = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    user_id: int
    address_id: Optional[int] = None
    address: Optional[AddressResponse] = None
    delivery_zone_id: Optional[int] = None
    subtotal: Decimal
    discount: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    coupon_id: Optional[int] = None
    coupon_code: Optional[str] = None
    estimated_delivery: Optional[str] = None
    status: str
    payment_status: str
    payment_method: str
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime
