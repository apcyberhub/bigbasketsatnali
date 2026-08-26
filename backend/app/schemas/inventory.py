from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class InventoryUpdate(BaseModel):
    new_quantity: Optional[int] = Field(None, ge=0)
    change_quantity: Optional[int] = None
    reason: str = Field("manual_adjustment", pattern="^(stock_added|stock_removed|manual_adjustment|damage_loss|return_restock)$")
    notes: Optional[str] = Field(None, max_length=255)


class InventoryTransactionResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    admin_user_id: Optional[int]
    change_quantity: int
    previous_quantity: int
    new_quantity: int
    reason: str
    notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
