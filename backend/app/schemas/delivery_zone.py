from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DeliveryZoneBase(BaseModel):
    name: str
    pincodes: str
    city: str = "Satnali"
    state: str = "Haryana"
    delivery_fee: Decimal = Decimal("30.00")
    free_delivery_threshold: Decimal = Decimal("499.00")
    minimum_order: Decimal = Decimal("99.00")
    estimated_min_minutes: int = 30
    estimated_max_minutes: int = 60
    is_active: bool = True


class DeliveryZoneCreate(DeliveryZoneBase):
    pass


class DeliveryZoneUpdate(BaseModel):
    name: Optional[str] = None
    pincodes: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    delivery_fee: Optional[Decimal] = None
    free_delivery_threshold: Optional[Decimal] = None
    minimum_order: Optional[Decimal] = None
    estimated_min_minutes: Optional[int] = None
    estimated_max_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class DeliveryZoneResponse(DeliveryZoneBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class DeliveryCheckResponse(BaseModel):
    available: bool
    message: Optional[str] = None
    zone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    delivery_fee: Optional[Decimal] = None
    free_delivery_threshold: Optional[Decimal] = None
    minimum_order: Optional[Decimal] = None
    estimated_delivery: Optional[str] = None
