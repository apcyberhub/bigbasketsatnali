from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CouponBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    discount_type: str = Field("percentage", pattern="^(percentage|fixed)$")
    discount_value: Decimal = Field(..., gt=0)
    minimum_order: Decimal = Field(Decimal("0.00"), ge=0)
    maximum_discount: Optional[Decimal] = Field(None, ge=0)
    usage_limit: int = Field(1000, ge=1)
    per_user_limit: int = Field(1, ge=1)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    description: Optional[str] = None
    discount_type: Optional[str] = Field(None, pattern="^(percentage|fixed)$")
    discount_value: Optional[Decimal] = Field(None, gt=0)
    minimum_order: Optional[Decimal] = Field(None, ge=0)
    maximum_discount: Optional[Decimal] = None
    usage_limit: Optional[int] = Field(None, ge=1)
    per_user_limit: Optional[int] = Field(None, ge=1)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class CouponResponse(CouponBase):
    id: int
    used_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
