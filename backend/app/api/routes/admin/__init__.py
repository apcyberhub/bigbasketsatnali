from fastapi import APIRouter

from app.api.routes.admin.dashboard import router as dashboard_router
from app.api.routes.admin.products import router as products_router
from app.api.routes.admin.categories import router as categories_router
from app.api.routes.admin.inventory import router as inventory_router
from app.api.routes.admin.orders import router as orders_router
from app.api.routes.admin.customers import router as customers_router
from app.api.routes.admin.coupons import router as coupons_router
from app.api.routes.admin.reports import router as reports_router
from app.api.routes.admin.settings import router as settings_router
from app.api.routes.admin.audit_logs import router as audit_logs_router
from app.api.routes.admin.delivery_zones import router as delivery_zones_router
from app.api.routes.admin.payments import router as payments_router

admin_router = APIRouter(prefix="/admin")

admin_router.include_router(dashboard_router)
admin_router.include_router(products_router)
admin_router.include_router(categories_router)
admin_router.include_router(inventory_router)
admin_router.include_router(orders_router)
admin_router.include_router(customers_router)
admin_router.include_router(coupons_router)
admin_router.include_router(reports_router)
admin_router.include_router(settings_router)
admin_router.include_router(audit_logs_router)
admin_router.include_router(delivery_zones_router)
admin_router.include_router(payments_router)

__all__ = ["admin_router"]
