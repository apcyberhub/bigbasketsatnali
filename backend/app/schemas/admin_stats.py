from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.order import OrderResponse
from app.schemas.product import ProductResponse


class DashboardStatsResponse(BaseModel):
    orders_today: int
    revenue_today: Decimal
    total_customers: int
    total_products: int
    low_stock_products: int
    pending_orders: int
    recent_orders: List[OrderResponse] = []
    low_stock_items: List[ProductResponse] = []
