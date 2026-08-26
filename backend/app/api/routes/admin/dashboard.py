from datetime import datetime, time, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.schemas.admin_stats import DashboardStatsResponse
from app.schemas.order import OrderResponse
from app.schemas.product import ProductResponse
from app.schemas.common import APIResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/dashboard", tags=["Admin Dashboard"])


@router.get("/stats", response_model=APIResponse[DashboardStatsResponse])
def get_dashboard_stats(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve real-time KPI statistics and metrics for the admin dashboard.
    """
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min)

    # 1. Orders today
    orders_today = db.query(Order).filter(Order.created_at >= today_start).count()

    # 2. Revenue today (excluding cancelled)
    revenue_result = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.created_at >= today_start, Order.status != "cancelled")
        .scalar()
    )
    revenue_today = Decimal(str(revenue_result or 0.00))

    # 3. Total customers
    total_customers = db.query(User).filter(User.is_admin == False).count()

    # 4. Total products
    total_products = db.query(Product).filter(Product.is_active == True).count()

    # 5. Low stock products count
    low_stock_products = (
        db.query(Product)
        .filter(Product.is_active == True, Product.stock_quantity <= Product.low_stock_threshold)
        .count()
    )

    # 6. Pending orders count
    pending_orders = (
        db.query(Order)
        .filter(Order.status.in_(["pending", "confirmed", "processing", "packed"]))
        .count()
    )

    # 7. Recent 5 orders
    recent_orders_db = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )
    recent_orders = [OrderResponse.model_validate(o) for o in recent_orders_db]

    # 8. Low stock 5 items
    low_stock_items_db = (
        db.query(Product)
        .filter(Product.is_active == True, Product.stock_quantity <= Product.low_stock_threshold)
        .order_by(Product.stock_quantity.asc())
        .limit(5)
        .all()
    )
    low_stock_items = [ProductResponse.model_validate(p) for p in low_stock_items_db]

    return APIResponse(
        success=True,
        data=DashboardStatsResponse(
            orders_today=orders_today,
            revenue_today=revenue_today,
            total_customers=total_customers,
            total_products=total_products,
            low_stock_products=low_stock_products,
            pending_orders=pending_orders,
            recent_orders=recent_orders,
            low_stock_items=low_stock_items
        )
    )
