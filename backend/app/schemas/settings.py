from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class StoreSettingsResponse(BaseModel):
    store_name: str = "Big Basket Satnali"
    store_phone: str = "9876543210"
    store_email: str = "support@bigbasket-satnali.com"
    store_address: str = "Main Market Road, Near Old Bus Stand, Satnali, Haryana - 123024"
    min_order_amount: Decimal = Decimal("99.00")
    delivery_fee: Decimal = Decimal("29.00")
    free_delivery_threshold: Decimal = Decimal("199.00")
    default_low_stock_threshold: int = 10


class StoreSettingsUpdate(BaseModel):
    store_name: Optional[str] = Field(None, min_length=2, max_length=100)
    store_phone: Optional[str] = Field(None, min_length=10, max_length=15)
    store_email: Optional[str] = None
    store_address: Optional[str] = None
    min_order_amount: Optional[Decimal] = Field(None, ge=0)
    delivery_fee: Optional[Decimal] = Field(None, ge=0)
    free_delivery_threshold: Optional[Decimal] = Field(None, ge=0)
    default_low_stock_threshold: Optional[int] = Field(None, ge=1)
