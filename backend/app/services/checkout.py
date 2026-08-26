import re
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Tuple, List
import random
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.address import Address
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.coupon import Coupon
from app.models.coupon_usage import CouponUsage
from app.models.delivery_zone import DeliveryZone
from app.models.inventory import InventoryTransaction
from app.services.pricing import calculate_order_totals, calculate_subtotal


def normalize_pincode(pincode: str) -> str:
    cleaned = re.sub(r"\D", "", pincode.strip())
    if len(cleaned) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_PINCODE", "message": "Please provide a valid 6-digit Indian pincode."}
        )
    return cleaned


def find_delivery_zone_for_pincode(pincode: str, db: Session) -> Optional[DeliveryZone]:
    """
    Search for an active DeliveryZone covering the given 6-digit pincode.
    """
    clean_pin = normalize_pincode(pincode)
    active_zones = db.query(DeliveryZone).filter(DeliveryZone.is_active == True).all()

    for zone in active_zones:
        # Pincodes stored as comma-separated or whitespace-separated list
        zone_pins = [re.sub(r"\D", "", p.strip()) for p in zone.pincodes.replace(",", " ").split() if p.strip()]
        if clean_pin in zone_pins:
            return zone

    return None


def validate_cart(user_id: int, db: Session) -> Cart:
    """
    Validates that user's cart is not empty, all products exist, are active, and have sufficient stock.
    """
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items or len(cart.items) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CART_EMPTY", "message": "Your shopping cart is empty."}
        )

    for item in cart.items:
        prod = item.product
        if not prod or not prod.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "PRODUCT_UNAVAILABLE", "message": f"Product '{item.product_id}' is currently unavailable."}
            )

        if prod.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INSUFFICIENT_STOCK",
                    "message": f"Only {prod.stock_quantity} units of '{prod.name}' are available. Please update your cart quantity."
                }
            )

    return cart


def validate_address(address_id: int, user_id: int, db: Session) -> Address:
    """
    Validates address exists and belongs to the authenticated user.
    """
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user_id).first()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ADDRESS_NOT_FOUND", "message": "Selected delivery address was not found."}
        )
    return address


def validate_and_apply_coupon(coupon_code: Optional[str], subtotal: Decimal, user_id: int, db: Session) -> Tuple[Optional[Coupon], Decimal]:
    """
    Validates coupon existence, active status, validity dates, minimum order, and global/per-user usage limits.
    Returns (Coupon, discount_amount).
    """
    if not coupon_code or not coupon_code.strip():
        return (None, Decimal("0.00"))

    code_clean = coupon_code.strip().upper()
    coupon = db.query(Coupon).filter(Coupon.code == code_clean).first()

    if not coupon or not coupon.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_COUPON", "message": f"Coupon code '{code_clean}' is invalid or inactive."}
        )

    now = datetime.now(timezone.utc)
    if coupon.start_date and coupon.start_date.replace(tzinfo=timezone.utc) > now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "COUPON_NOT_STARTED", "message": "This coupon promotion has not started yet."}
        )

    if coupon.end_date and coupon.end_date.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "COUPON_EXPIRED", "message": "This coupon code has expired."}
        )

    min_order = Decimal(str(coupon.minimum_order or 0))
    if subtotal < min_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "MINIMUM_ORDER_NOT_MET",
                "message": f"Coupon '{code_clean}' requires a minimum order value of ₹{min_order}."
            }
        )

    # Check global usage limit
    if coupon.used_count >= coupon.usage_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "USAGE_LIMIT_EXCEEDED", "message": "This coupon has reached its maximum global redemption limit."}
        )

    # Check per-user usage limit
    user_usage_count = db.query(CouponUsage).filter(
        CouponUsage.coupon_id == coupon.id,
        CouponUsage.user_id == user_id
    ).count()

    if user_usage_count >= coupon.per_user_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PER_USER_LIMIT_EXCEEDED", "message": f"You have already redeemed coupon '{code_clean}' the maximum allowed times."}
        )

    # Calculate discount amount
    from app.services.pricing import calculate_coupon_discount
    discount = calculate_coupon_discount(coupon, subtotal)
    return (coupon, discount)


def generate_unique_order_number(db: Session) -> str:
    """
    Generates a unique order number like BB202608210001
    """
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    for _ in range(10):
        rand_suffix = f"{random.randint(1000, 9999)}"
        candidate = f"BB{date_str}{rand_suffix}"
        existing = db.query(Order).filter(Order.order_number == candidate).first()
        if not existing:
            return candidate

    return f"BB{date_str}{int(datetime.now(timezone.utc).timestamp())}"


def create_order_atomic(
    user_id: int,
    address_id: int,
    payment_method: str = "Cash on Delivery",
    coupon_code: Optional[str] = None,
    idempotency_key: Optional[str] = None,
    db: Optional[Session] = None
) -> Order:
    """
    Executes atomic order creation inside a transactional block:
    1. Validates Idempotency key (returns existing order if duplicate)
    2. Validates Cart, Items, and Stock
    3. Validates Address and Delivery Zone coverage
    4. Validates Zone Minimum Order requirement
    5. Validates and Calculates Coupon Discount
    6. Calculates Server-Side Subtotal, Delivery Fee, Total
    7. Atomically reduces Stock & creates OrderItem snapshots
    8. Records Coupon Usage
    9. Clears Shopping Cart
    """
    # 1. Idempotency protection
    if idempotency_key:
        existing_order = db.query(Order).filter(
            Order.user_id == user_id,
            Order.idempotency_key == idempotency_key
        ).first()
        if existing_order:
            return existing_order

    # 2. Validate Cart & Items
    cart = validate_cart(user_id, db)

    # 3. Validate Address
    address = validate_address(address_id, user_id, db)

    # 4. Validate Delivery Zone
    delivery_zone = find_delivery_zone_for_pincode(address.pincode, db)
    if not delivery_zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "DELIVERY_UNAVAILABLE",
                "message": f"Delivery is currently unavailable to pincode {address.pincode}."
            }
        )

    # 5. Calculate Subtotal & Validate Minimum Order
    subtotal = calculate_subtotal(cart.items)
    min_order = Decimal(str(delivery_zone.minimum_order))
    if subtotal < min_order:
        needed = min_order - subtotal
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "MINIMUM_ORDER_NOT_MET",
                "message": f"Minimum order value for {delivery_zone.name} is ₹{min_order}. Please add ₹{needed} more to place your order."
            }
        )

    # 6. Validate Coupon
    coupon, discount = validate_and_apply_coupon(coupon_code, subtotal, user_id, db)

    # 7. Calculate Pricing Breakdown
    pricing = calculate_order_totals(cart.items, delivery_zone, coupon, db)
    delivery_fee = pricing["delivery_fee"]
    total_amount = pricing["total_amount"]
    eta_str = f"{delivery_zone.estimated_min_minutes}–{delivery_zone.estimated_max_minutes} minutes"

    # 8. Create Order Record
    # 8. Create Order Record
    # For COD, order is confirmed with pending cash collection.
    # For Online (Razorpay), initial order is created with pending payment, confirmed upon signature verification.
    is_cod = payment_method.strip().lower() in ["cash on delivery", "cod"]
    initial_status = "confirmed" if is_cod else "pending"
    initial_payment_status = "pending"

    order_number = generate_unique_order_number(db)
    order = Order(
        order_number=order_number,
        user_id=user_id,
        address_id=address.id,
        delivery_zone_id=delivery_zone.id,
        subtotal=subtotal,
        discount=discount,
        delivery_fee=delivery_fee,
        total_amount=total_amount,
        coupon_id=coupon.id if coupon else None,
        coupon_code=coupon.code if coupon else None,
        estimated_delivery=eta_str,
        idempotency_key=idempotency_key,
        status=initial_status,
        payment_status=initial_payment_status,
        payment_method=payment_method
    )
    db.add(order)
    db.flush()

    # 9. Create Order Items & Atomically Decrement Stock
    for item in cart.items:
        # Row-level locking for concurrency protection (with SQLite fallback)
        try:
            prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        except Exception:
            prod = db.query(Product).filter(Product.id == item.product_id).first()

        if not prod or prod.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INSUFFICIENT_STOCK", "message": f"Item '{item.product.name if item.product else item.product_id}' is out of stock."}
            )

        # Record snapshot
        item_unit_price = Decimal(str(prod.price))
        item_total_price = item_unit_price * Decimal(str(item.quantity))

        order_item = OrderItem(
            order_id=order.id,
            product_id=prod.id,
            product_name=prod.name,
            product_weight=prod.weight,
            sku=prod.sku,
            quantity=item.quantity,
            unit_price=item_unit_price,
            total_price=item_total_price
        )
        db.add(order_item)

        # Decrement stock and log transaction
        prev_stock = prod.stock_quantity
        prod.stock_quantity -= item.quantity
        db.add(InventoryTransaction(
            product_id=prod.id,
            admin_user_id=None,
            change_quantity=-item.quantity,
            previous_quantity=prev_stock,
            new_quantity=prod.stock_quantity,
            reason="order_deduction",
            notes=f"Deducted for Order #{order_number}"
        ))

    # 10. Record Coupon Usage
    if coupon:
        coupon.used_count += 1
        db.add(CouponUsage(
            coupon_id=coupon.id,
            user_id=user_id,
            order_id=order.id,
            discount_amount=discount
        ))

    # 11. Clear Cart
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

    db.commit()
    db.refresh(order)
    return order


def cancel_order_atomic(order_id: int, user_id: int, db: Session) -> Order:
    """
    Cancels an order if eligible (status in 'pending' or 'confirmed') and restocks products.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ORDER_NOT_FOUND", "message": "Order not found."}
        )

    # Validate ownership
    user = db.query(User).filter(User.id == user_id).first()
    if order.user_id != user_id and not (user and user.is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "PERMISSION_DENIED", "message": "You cannot cancel another customer's order."}
        )

    if order.status in ["out_for_delivery", "delivered", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "CANNOT_CANCEL",
                "message": f"Order #{order.order_number} cannot be cancelled because it is already {order.status.replace('_', ' ')}."
            }
        )

    # Restock products
    for item in order.items:
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).first()
            if prod:
                prev_stock = prod.stock_quantity
                prod.stock_quantity += item.quantity
                db.add(InventoryTransaction(
                    product_id=prod.id,
                    admin_user_id=None,
                    change_quantity=item.quantity,
                    previous_quantity=prev_stock,
                    new_quantity=prod.stock_quantity,
                    reason="return_restock",
                    notes=f"Restocked from cancelled Order #{order.order_number}"
                ))

    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return order
