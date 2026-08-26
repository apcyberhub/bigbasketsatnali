import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.api.routes import (
    health_router,
    auth_router,
    users_router,
    categories_router,
    products_router,
    cart_router,
    wishlist_router,
    addresses_router,
    orders_router,
    delivery_router,
    checkout_router,
    payments_router,
)
from app.api.routes.admin import admin_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("bigbasket.api")

# FastAPI App Factory
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade RESTful API for Big Basket Satnali Quick-Commerce Platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized Error Handling
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        code = detail.get("code", "HTTP_ERROR")
        message = detail.get("message", "An error occurred")
        details = detail.get("details", None)
    else:
        code = f"HTTP_{exc.status_code}"
        message = str(detail)
        details = None

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err["loc"] if loc != "body"])
        errors.append(f"{field}: {err['msg']}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid input provided.",
                "details": errors
            }
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled Server Error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "details": None
            }
        }
    )


# Register API Routers
api_prefix = settings.API_V1_STR
app.include_router(health_router, prefix=api_prefix)
app.include_router(auth_router, prefix=api_prefix)
app.include_router(users_router, prefix=api_prefix)
app.include_router(categories_router, prefix=api_prefix)
app.include_router(products_router, prefix=api_prefix)
app.include_router(cart_router, prefix=api_prefix)
app.include_router(wishlist_router, prefix=api_prefix)
app.include_router(addresses_router, prefix=api_prefix)
app.include_router(orders_router, prefix=api_prefix)
app.include_router(delivery_router, prefix=api_prefix)
app.include_router(checkout_router, prefix=api_prefix)
app.include_router(payments_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)

# Mount Static & Media Files for uploaded product images
import os
from fastapi.staticfiles import StaticFiles

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
assets_dir = os.path.join(root_dir, "assets")
uploads_dir = os.path.join(assets_dir, "uploads")
os.makedirs(uploads_dir, exist_ok=True)

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    app.mount("/media", StaticFiles(directory=assets_dir), name="media")


@app.get("/")
def root():
    return {
        "success": True,
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
