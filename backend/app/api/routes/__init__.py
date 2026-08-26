from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.categories import router as categories_router
from app.api.routes.products import router as products_router
from app.api.routes.cart import router as cart_router
from app.api.routes.wishlist import router as wishlist_router
from app.api.routes.addresses import router as addresses_router
from app.api.routes.orders import router as orders_router
from app.api.routes.delivery import router as delivery_router
from app.api.routes.checkout import router as checkout_router
from app.api.routes.payments import router as payments_router

__all__ = [
    "health_router",
    "auth_router",
    "users_router",
    "categories_router",
    "products_router",
    "cart_router",
    "wishlist_router",
    "addresses_router",
    "orders_router",
    "delivery_router",
    "checkout_router",
    "payments_router",
]
