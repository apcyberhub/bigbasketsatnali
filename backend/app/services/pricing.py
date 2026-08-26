from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple, Any
from sqlalchemy.orm import Session

from app.models.coupon import Coupon
from app.models.coupon_usage import CouponUsage
from app.models.delivery_zone import DeliveryZone
from app.models.setting import StoreSetting


def round_currency(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_subtotal(items: List[Any]) -> Decimal:
    """
    Calculate subtotal by summing database unit_price * quantity for each item.
    Never trusts client prices.
    """
    subtotal = Decimal("0.00")
    for item in items:
        # Works for CartItem (item.product.price) or OrderItem (item.unit_price)
        if hasattr(item, "product") and item.product:
            unit_price = Decimal(str(item.product.price))
        elif hasattr(item, "unit_price"):
            unit_price = Decimal(str(item.unit_price))
        else:
            unit_price = Decimal("0.00")
        
        qty = Decimal(str(item.quantity))
        subtotal += unit_price * qty

    return round_currency(subtotal)


def calculate_delivery_fee(delivery_zone: Optional[DeliveryZone], subtotal: Decimal, db: Optional[Session] = None) -> Tuple[Decimal, Decimal, bool]:
    """
    Calculates delivery fee based on delivery zone or global store settings.
    Returns (delivery_fee, free_threshold, is_free).
    """
    if delivery_zone:
        free_threshold = Decimal(str(delivery_zone.free_delivery_threshold))
        standard_fee = Decimal(str(delivery_zone.delivery_fee))
    else:
        # Fallback to database store settings or defaults
        free_threshold = Decimal("499.00")
        standard_fee = Decimal("30.00")
        if db:
            fee_setting = db.query(StoreSetting).filter(StoreSetting.key == "delivery_charge").first()
            if fee_setting:
                try:
                    standard_fee = Decimal(fee_setting.value)
                except Exception:
                    pass
            thresh_setting = db.query(StoreSetting).filter(StoreSetting.key == "free_delivery_threshold").first()
            if thresh_setting:
                try:
                    free_threshold = Decimal(thresh_setting.value)
                except Exception:
                    pass

    if subtotal >= free_threshold:
        return (Decimal("0.00"), free_threshold, True)
    else:
        return (round_currency(standard_fee), free_threshold, False)


def calculate_coupon_discount(coupon: Optional[Coupon], subtotal: Decimal) -> Decimal:
    """
    Calculates valid coupon discount amount.
    Supports percentage and fixed discounts, capped by maximum_discount.
    """
    if not coupon or not coupon.is_active:
        return Decimal("0.00")

    min_order = Decimal(str(coupon.minimum_order or 0))
    if subtotal < min_order:
        return Decimal("0.00")

    discount_val = Decimal(str(coupon.discount_value))

    if coupon.discount_type == "percentage":
        discount = (subtotal * discount_val) / Decimal("100.00")
    else:
        discount = discount_val

    # Apply maximum discount cap if defined
    if coupon.maximum_discount is not None and coupon.maximum_discount > 0:
        max_cap = Decimal(str(coupon.maximum_discount))
        discount = min(discount, max_cap)

    # Discount cannot exceed subtotal
    discount = min(discount, subtotal)
    return round_currency(discount)


def calculate_order_totals(
    cart_items: List[Any],
    delivery_zone: Optional[DeliveryZone],
    coupon: Optional[Coupon],
    db: Optional[Session] = None
) -> dict:
    """
    Centralized pricing calculator returning exact subtotal, discount, delivery fee, and grand total.
    """
    subtotal = calculate_subtotal(cart_items)
    discount = calculate_coupon_discount(coupon, subtotal) if coupon else Decimal("0.00")
    delivery_fee, free_threshold, is_free = calculate_delivery_fee(delivery_zone, subtotal, db)

    total_amount = subtotal - discount + delivery_fee
    if total_amount < Decimal("0.00"):
        total_amount = Decimal("0.00")

    amount_needed_for_free_delivery = Decimal("0.00")
    if not is_free and subtotal < free_threshold:
        amount_needed_for_free_delivery = free_threshold - subtotal

    min_order = Decimal(str(delivery_zone.minimum_order)) if delivery_zone else Decimal("0.00")
    meets_minimum_order = subtotal >= min_order
    amount_needed_for_min_order = min_order - subtotal if not meets_minimum_order else Decimal("0.00")

    return {
        "subtotal": round_currency(subtotal),
        "discount": round_currency(discount),
        "delivery_fee": round_currency(delivery_fee),
        "total_amount": round_currency(total_amount),
        "free_delivery_threshold": round_currency(free_threshold),
        "is_free_delivery": is_free,
        "amount_needed_for_free_delivery": round_currency(amount_needed_for_free_delivery),
        "minimum_order": round_currency(min_order),
        "meets_minimum_order": meets_minimum_order,
        "amount_needed_for_min_order": round_currency(amount_needed_for_min_order),
    }
