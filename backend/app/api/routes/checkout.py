from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.address import Address
from app.models.cart import Cart
from app.models.setting import StoreSetting
from app.schemas.common import ApiResponse
from app.schemas.checkout import (
    CheckoutSummaryRequest,
    CheckoutSummaryResponse,
    CheckoutItemSummary,
    ApplyCouponRequest,
    ApplyCouponResponse
)
from app.services.pricing import calculate_order_totals, calculate_subtotal
from app.services.checkout import (
    validate_cart,
    find_delivery_zone_for_pincode,
    validate_and_apply_coupon
)

router = APIRouter(prefix="/checkout", tags=["Checkout"])


@router.post("/summary", response_model=ApiResponse[CheckoutSummaryResponse])
def get_checkout_summary(
    payload: Optional[CheckoutSummaryRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates the customer's cart, checks selected address delivery zone, applies coupon,
    and returns authoritative, server-calculated checkout totals.
    """
    if payload is None:
        payload = CheckoutSummaryRequest()
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart or not cart.items or len(cart.items) == 0:
        return ApiResponse.ok(data=CheckoutSummaryResponse(
            items=[],
            items_count=0,
            subtotal=Decimal("0.00"),
            discount=Decimal("0.00"),
            delivery_fee=Decimal("0.00"),
            total_amount=Decimal("0.00"),
            coupon_code=None,
            coupon_discount_type=None,
            free_delivery_threshold=Decimal("299.00"),
            is_free_delivery=False,
            amount_needed_for_free_delivery=Decimal("299.00"),
            delivery_available=True,
            delivery_zone_name=None,
            estimated_delivery="15–30 minutes",
            minimum_order=Decimal("99.00"),
            meets_minimum_order=False,
            amount_needed_for_min_order=Decimal("99.00"),
            cod_available=True,
            has_out_of_stock_items=False,
            stock_warning=None
        ))

    # Prepare item summaries and stock checks
    items_summary = []
    has_out_of_stock = False
    stock_warnings = []

    for item in cart.items:
        prod = item.product
        if not prod or not prod.is_active:
            has_out_of_stock = True
            stock_warnings.append(f"An item in your cart is no longer available.")
            continue

        in_stock = prod.stock_quantity >= item.quantity
        if not in_stock:
            has_out_of_stock = True
            stock_warnings.append(f"Only {prod.stock_quantity} units of '{prod.name}' available in stock.")

        unit_price = Decimal(str(prod.price))
        total_price = unit_price * Decimal(str(item.quantity))
        image_url = prod.images[0].image_url if prod.images else None

        items_summary.append(CheckoutItemSummary(
            product_id=prod.id,
            product_name=prod.name,
            product_brand=prod.brand,
            product_weight=prod.weight,
            image_url=image_url,
            emoji=getattr(prod, "emoji", None) or "📦",
            quantity=item.quantity,
            unit_price=unit_price,
            total_price=total_price,
            available_stock=prod.stock_quantity,
            in_stock=in_stock
        ))

    # Resolve delivery zone
    delivery_zone = None
    delivery_available = True
    if payload.address_id:
        address = db.query(Address).filter(
            Address.id == payload.address_id,
            Address.user_id == current_user.id
        ).first()
        if address:
            delivery_zone = find_delivery_zone_for_pincode(address.pincode, db)
            if not delivery_zone:
                delivery_available = False

    # Check coupon
    subtotal = calculate_subtotal(cart.items)
    coupon = None
    coupon_discount_type = None
    if payload.coupon_code:
        try:
            coupon, _ = validate_and_apply_coupon(payload.coupon_code, subtotal, current_user.id, db)
            if coupon:
                coupon_discount_type = f"{coupon.discount_value}% OFF" if coupon.discount_type == "percentage" else f"₹{coupon.discount_value} OFF"
        except HTTPException:
            coupon = None

    # Calculate authoritative pricing
    pricing = calculate_order_totals(cart.items, delivery_zone, coupon, db)

    # Check COD setting
    cod_setting = db.query(StoreSetting).filter(StoreSetting.key == "cod_enabled").first()
    cod_available = True
    if cod_setting and cod_setting.value.lower() in ["false", "0", "disabled", "no"]:
        cod_available = False

    eta_str = f"{delivery_zone.estimated_min_minutes}–{delivery_zone.estimated_max_minutes} minutes" if delivery_zone else "15–30 minutes"
    warning_text = " • ".join(stock_warnings) if stock_warnings else None

    return ApiResponse.ok(data=CheckoutSummaryResponse(
        items=items_summary,
        items_count=len(items_summary),
        subtotal=pricing["subtotal"],
        discount=pricing["discount"],
        delivery_fee=pricing["delivery_fee"],
        total_amount=pricing["total_amount"],
        coupon_code=coupon.code if coupon else None,
        coupon_discount_type=coupon_discount_type,
        free_delivery_threshold=pricing["free_delivery_threshold"],
        is_free_delivery=pricing["is_free_delivery"],
        amount_needed_for_free_delivery=pricing["amount_needed_for_free_delivery"],
        delivery_available=delivery_available,
        delivery_zone_name=delivery_zone.name if delivery_zone else None,
        estimated_delivery=eta_str,
        minimum_order=pricing["minimum_order"],
        meets_minimum_order=pricing["meets_minimum_order"],
        amount_needed_for_min_order=pricing["amount_needed_for_min_order"],
        cod_available=cod_available,
        has_out_of_stock_items=has_out_of_stock,
        stock_warning=warning_text
    ))


@router.post("/apply-coupon", response_model=ApiResponse[ApplyCouponResponse])
def apply_checkout_coupon(
    payload: ApplyCouponRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates coupon against current user and cart subtotal.
    """
    cart = validate_cart(current_user.id, db)
    subtotal = calculate_subtotal(cart.items)

    coupon, discount = validate_and_apply_coupon(payload.coupon_code, subtotal, current_user.id, db)

    msg = f"Coupon '{coupon.code}' applied! You saved ₹{discount}."
    return ApiResponse.ok(data=ApplyCouponResponse(
        valid=True,
        coupon_code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        discount_amount=discount,
        message=msg
    ))
