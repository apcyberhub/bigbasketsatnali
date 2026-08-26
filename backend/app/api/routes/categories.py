from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryResponse, CategoryTreeResponse
from app.schemas.common import APIResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=APIResponse[List[CategoryResponse]])
def get_categories(
    db: Session = Depends(get_db)
):
    """
    Retrieve all active top-level categories and subcategories.
    """
    categories = (
        db.query(Category)
        .filter(Category.is_active == True)
        .order_by(Category.sort_order.asc(), Category.name.asc())
        .all()
    )
    return APIResponse(
        success=True,
        data=[CategoryResponse.model_validate(c) for c in categories]
    )


@router.get("/tree", response_model=APIResponse[List[CategoryTreeResponse]])
def get_category_tree(
    db: Session = Depends(get_db)
):
    """
    Retrieve nested parent categories with subcategories.
    """
    parent_categories = (
        db.query(Category)
        .filter(Category.is_active == True, Category.parent_id == None)
        .order_by(Category.sort_order.asc(), Category.name.asc())
        .all()
    )
    return APIResponse(
        success=True,
        data=[CategoryTreeResponse.model_validate(c) for c in parent_categories]
    )


@router.get("/{category_id}", response_model=APIResponse[CategoryResponse])
def get_category_by_id(
    category_id: int,
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id, Category.is_active == True).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CATEGORY_NOT_FOUND", "message": "Category not found"}
        )
    return APIResponse(
        success=True,
        data=CategoryResponse.model_validate(category)
    )


@router.get("/slug/{slug}", response_model=APIResponse[CategoryResponse])
def get_category_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.slug == slug, Category.is_active == True).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CATEGORY_NOT_FOUND", "message": f"Category '{slug}' not found"}
        )
    return APIResponse(
        success=True,
        data=CategoryResponse.model_validate(category)
    )
