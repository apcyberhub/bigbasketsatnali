from decimal import Decimal
from typing import List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.product import ProductResponse


class CartItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(1, ge=1, le=50)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, le=50)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product: ProductResponse
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: int
    user_id: int
    items: List[CartItemResponse] = []
    subtotal: Decimal
    discount_savings: Decimal
    delivery_fee: Decimal
    grand_total: Decimal
    total_items_count: int

    model_config = ConfigDict(from_attributes=True)
