from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.cart import Cart, CartItem
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemResponse, CartResponse
from app.schemas.common import APIResponse
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/cart", tags=["Cart"])


def _calculate_cart_summary(cart: Cart) -> CartResponse:
    subtotal = Decimal("0.00")
    total_mrp = Decimal("0.00")
    total_items = 0
    item_responses = []

    for item in cart.items:
        prod = item.product
        item_total = item.unit_price * item.quantity
        subtotal += item_total
        total_mrp += (prod.mrp if prod else item.unit_price) * item.quantity
        total_items += item.quantity

        item_responses.append(
            CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                product=prod,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item_total
            )
        )

    discount_savings = max(Decimal("0.00"), total_mrp - subtotal)
    delivery_fee = Decimal("0.00") if (subtotal >= Decimal("199.00") or subtotal == Decimal("0.00")) else Decimal("29.00")
    grand_total = subtotal + delivery_fee

    return CartResponse(
        id=cart.id,
        user_id=cart.user_id,
        items=item_responses,
        subtotal=subtotal,
        discount_savings=discount_savings,
        delivery_fee=delivery_fee,
        grand_total=grand_total,
        total_items_count=total_items
    )


def _get_or_create_user_cart(user_id: int, db: Session) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


@router.get("", response_model=APIResponse[CartResponse])
def get_cart(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    cart = _get_or_create_user_cart(current_user.id, db)
    return APIResponse(
        success=True,
        data=_calculate_cart_summary(cart)
    )


@router.post("/items", response_model=APIResponse[CartResponse], status_code=status.HTTP_201_CREATED)
def add_item_to_cart(
    item_in: CartItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    cart = _get_or_create_user_cart(current_user.id, db)

    # Validate product and stock
    product = db.query(Product).filter(Product.id == item_in.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRODUCT_NOT_FOUND", "message": "Product is unavailable."}
        )

    if product.stock_quantity < item_in.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INSUFFICIENT_STOCK", "message": f"Only {product.stock_quantity} units available in stock."}
        )

    # Check if item already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product.id
    ).first()

    if existing_item:
        new_qty = existing_item.quantity + item_in.quantity
        if new_qty > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INSUFFICIENT_STOCK", "message": f"Cannot add more than {product.stock_quantity} units."}
            )
        existing_item.quantity = new_qty
        existing_item.unit_price = product.price
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=item_in.quantity,
            unit_price=product.price
        )
        db.add(new_item)

    db.commit()
    db.refresh(cart)

    return APIResponse(
        success=True,
        data=_calculate_cart_summary(cart)
    )


@router.put("/items/{item_id}", response_model=APIResponse[CartResponse])
def update_cart_item_quantity(
    item_id: int,
    item_in: CartItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    cart = _get_or_create_user_cart(current_user.id, db)
    item = db.query(CartItem).filter(
        (CartItem.id == item_id) | (CartItem.product_id == item_id),
        CartItem.cart_id == cart.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ITEM_NOT_FOUND", "message": "Cart item not found."}
        )

    if item_in.quantity <= 0:
        db.delete(item)
        db.commit()
        db.refresh(cart)
        return APIResponse(
            success=True,
            data=_calculate_cart_summary(cart)
        )

    if item.product and item.product.stock_quantity < item_in.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INSUFFICIENT_STOCK", "message": f"Only {item.product.stock_quantity} units available."}
        )

    item.quantity = item_in.quantity
    if item.product:
        item.unit_price = item.product.price
    db.commit()
    db.refresh(cart)

    return APIResponse(
        success=True,
        data=_calculate_cart_summary(cart)
    )


@router.delete("/items/{item_id}", response_model=APIResponse[CartResponse])
def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    cart = _get_or_create_user_cart(current_user.id, db)
    item = db.query(CartItem).filter(
        (CartItem.id == item_id) | (CartItem.product_id == item_id),
        CartItem.cart_id == cart.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ITEM_NOT_FOUND", "message": "Cart item not found."}
        )

    db.delete(item)
    db.commit()
    db.refresh(cart)

    return APIResponse(
        success=True,
        data=_calculate_cart_summary(cart)
    )


@router.delete("", response_model=APIResponse[dict])
def clear_cart(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    cart = _get_or_create_user_cart(current_user.id, db)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()

    return APIResponse(
        success=True,
        data={"message": "Cart cleared successfully."}
    )
