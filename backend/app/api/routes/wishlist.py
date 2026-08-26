from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.wishlist import Wishlist
from app.schemas.wishlist import WishlistItemResponse
from app.schemas.common import APIResponse
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("", response_model=APIResponse[List[WishlistItemResponse]])
def get_wishlist(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    items = (
        db.query(Wishlist)
        .filter(Wishlist.user_id == current_user.id)
        .order_by(Wishlist.created_at.desc())
        .all()
    )
    return APIResponse(
        success=True,
        data=[WishlistItemResponse.model_validate(item) for item in items]
    )


@router.post("/{product_id}", response_model=APIResponse[WishlistItemResponse], status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRODUCT_NOT_FOUND", "message": "Product not found."}
        )

    existing = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.product_id == product_id
    ).first()

    if existing:
        return APIResponse(
            success=True,
            data=WishlistItemResponse.model_validate(existing)
        )

    wish_item = Wishlist(user_id=current_user.id, product_id=product_id)
    db.add(wish_item)
    db.commit()
    db.refresh(wish_item)

    return APIResponse(
        success=True,
        data=WishlistItemResponse.model_validate(wish_item)
    )


@router.delete("/{product_id}", response_model=APIResponse[dict])
def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    item = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.product_id == product_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ITEM_NOT_FOUND", "message": "Product is not in your wishlist."}
        )

    db.delete(item)
    db.commit()

    return APIResponse(
        success=True,
        data={"message": "Product removed from wishlist."}
    )
