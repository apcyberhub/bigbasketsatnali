from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class CustomerAdminResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    is_active: bool
    is_verified: bool
    is_admin: bool
    created_at: datetime
    orders_count: int = 0
    total_spent: Decimal = Decimal("0.00")

    model_config = ConfigDict(from_attributes=True)


class CustomerStatusUpdate(BaseModel):
    is_active: bool
