from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class CheckoutItemSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    product_name: str
    product_brand: Optional[str] = None
    product_weight: Optional[str] = None
    image_url: Optional[str] = None
    emoji: Optional[str] = "📦"
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    available_stock: Optional[int] = None
    in_stock: bool = True


class CheckoutSummaryRequest(BaseModel):
    address_id: Optional[int] = None
    coupon_code: Optional[str] = None


class CheckoutSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[CheckoutItemSummary]
    items_count: int
    subtotal: Decimal
    discount: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    coupon_code: Optional[str] = None
    coupon_discount_type: Optional[str] = None
    free_delivery_threshold: Decimal
    is_free_delivery: bool
    amount_needed_for_free_delivery: Decimal
    delivery_available: bool
    delivery_zone_name: Optional[str] = None
    estimated_delivery: Optional[str] = None
    minimum_order: Decimal
    meets_minimum_order: bool
    amount_needed_for_min_order: Decimal
    cod_available: bool = True
    has_out_of_stock_items: bool = False
    stock_warning: Optional[str] = None


class ApplyCouponRequest(BaseModel):
    coupon_code: str
    subtotal: Optional[Decimal] = None


class ApplyCouponResponse(BaseModel):
    valid: bool
    coupon_code: str
    discount_type: str
    discount_value: Decimal
    discount_amount: Decimal
    message: str


class OrderCreateRequest(BaseModel):
    address_id: int
    payment_method: str = "Cash on Delivery"
    coupon_code: Optional[str] = None
    idempotency_key: Optional[str] = None


class OrderCancelResponse(BaseModel):
    success: bool
    message: str
    order_id: int
    order_number: str
    status: str
