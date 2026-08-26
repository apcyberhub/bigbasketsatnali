from decimal import Decimal
import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc

from app.core.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import (
    ProductResponse,
    ProductListResponse,
    SearchSuggestionItem,
    SearchSuggestionsResponse
)
from app.schemas.common import APIResponse, PaginationMeta

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=APIResponse[ProductListResponse])
def get_products(
    category: Optional[str] = Query(None, description="Category slug or ID"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory name"),
    brand: Optional[str] = Query(None, description="Filter by brand (single or comma-separated)"),
    min_price: Optional[Decimal] = Query(None, ge=0),
    max_price: Optional[Decimal] = Query(None, ge=0),
    min_rating: Optional[Decimal] = Query(None, ge=0, le=5),
    discount: Optional[int] = Query(None, ge=0, le=100),
    in_stock: Optional[bool] = Query(None),
    availability: Optional[str] = Query(None, description="all, in_stock, out_of_stock"),
    search: Optional[str] = Query(None, max_length=100),
    sort: Optional[str] = Query("relevance", description="relevance, price-low, price-high, discount, rating, newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieve paginated product catalog with multi-attribute filtering, multi-field search, and sorting.
    """
    query = db.query(Product).filter(Product.is_active == True)

    # 1. Filter Category (by slug or id)
    if category and category != "all":
        if category.isdigit():
            query = query.filter(Product.category_id == int(category))
        else:
            cat_obj = db.query(Category).filter(Category.slug == category).first()
            if cat_obj:
                query = query.filter(Product.category_id == cat_obj.id)

    # 2. Filter Subcategory
    if subcategory and subcategory.strip() and subcategory.lower() != "all":
        query = query.filter(Product.subcategory_name.ilike(f"%{subcategory.strip()}%"))

    # 3. Filter Brand (supports single brand or comma-separated brands)
    if brand and brand.strip() and brand.lower() != "all":
        brand_list = [b.strip() for b in brand.split(",") if b.strip()]
        if len(brand_list) == 1:
            query = query.filter(Product.brand.ilike(f"%{brand_list[0]}%"))
        elif len(brand_list) > 1:
            brand_conditions = [Product.brand.ilike(f"%{b}%") for b in brand_list]
            query = query.filter(or_(*brand_conditions))

    # 4. Price range validation
    if min_price is not None and min_price >= 0:
        query = query.filter(Product.price >= min_price)
    if max_price is not None and max_price >= 0:
        query = query.filter(Product.price <= max_price)

    # 5. Rating filter
    if min_rating is not None and min_rating > 0:
        query = query.filter(Product.rating >= min_rating)

    # 6. Discount percentage filter (e.g. 10+, 20+, 30+, 50+)
    if discount is not None and discount > 0:
        query = query.filter(Product.discount_percentage >= discount)

    # 7. Stock & Availability filter
    if availability == "in_stock" or in_stock is True:
        query = query.filter(Product.stock_quantity > 0)
    elif availability == "out_of_stock":
        query = query.filter(Product.stock_quantity <= 0)

    # 8. Multi-field Case-Insensitive Search
    if search and search.strip():
        term = f"%{search.strip()}%"
        # Find matching categories first for category-name searches
        matching_cat_ids = [c.id for c in db.query(Category.id).filter(
            or_(Category.name.ilike(term), Category.slug.ilike(term))
        ).all()]

        search_conditions = [
            Product.name.ilike(term),
            Product.brand.ilike(term),
            Product.sku.ilike(term),
            Product.subcategory_name.ilike(term),
            Product.tags.ilike(term),
            Product.description.ilike(term)
        ]
        if matching_cat_ids:
            search_conditions.append(Product.category_id.in_(matching_cat_ids))

        query = query.filter(or_(*search_conditions))

    # 9. Sorting
    if sort == "price-low":
        query = query.order_by(Product.price.asc())
    elif sort == "price-high":
        query = query.order_by(Product.price.desc())
    elif sort == "discount":
        query = query.order_by(Product.discount_percentage.desc())
    elif sort == "rating":
        query = query.order_by(Product.rating.desc(), Product.review_count.desc())
    elif sort == "newest":
        query = query.order_by(Product.created_at.desc(), Product.id.desc())
    else:  # relevance
        query = query.order_by(Product.is_featured.desc(), Product.rating.desc(), Product.id.asc())

    total_count = query.count()
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return APIResponse(
        success=True,
        data=ProductListResponse(
            items=[ProductResponse.model_validate(p) for p in items],
            pagination=PaginationMeta(
                total_count=total_count,
                page=page,
                limit=limit,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_prev=page > 1
            )
        )
    )


@router.get("/suggestions", response_model=APIResponse[SearchSuggestionsResponse])
def get_search_suggestions(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Autocomplete suggestions returning matching products, matching categories, and brand tags.
    """
    clean_q = q.strip()
    term = f"%{clean_q}%"

    # 1. Matching Products
    products = (
        db.query(Product)
        .filter(
            Product.is_active == True,
            or_(
                Product.name.ilike(term),
                Product.brand.ilike(term),
                Product.sku.ilike(term),
                Product.tags.ilike(term),
                Product.subcategory_name.ilike(term)
            )
        )
        .limit(limit)
        .all()
    )

    product_items = []
    for p in products:
        img_url = p.images[0].image_url if p.images and len(p.images) > 0 else None
        cat_name = p.category.name if p.category else None
        product_items.append(SearchSuggestionItem(
            id=p.id,
            name=p.name,
            brand=p.brand,
            emoji=p.emoji or "📦",
            image_url=img_url,
            selling_price=p.price,
            mrp=p.mrp,
            weight=p.weight,
            category_name=cat_name
        ))

    # 2. Matching Categories
    categories = [
        c.name for c in db.query(Category.name)
        .filter(Category.is_active == True, Category.name.ilike(term))
        .limit(4)
        .all()
    ]

    # 3. Matching Brands
    brands = [
        b[0] for b in db.query(Product.brand)
        .filter(Product.is_active == True, Product.brand.ilike(term))
        .distinct()
        .limit(4)
        .all()
        if b[0]
    ]

    # 4. Popular / Trending Suggestions
    popular_tags = ["Milk", "Atta 5kg", "Amul Butter", "Cadbury Silk", "Tomatoes", "Maggi"]

    return APIResponse(
        success=True,
        data=SearchSuggestionsResponse(
            query=clean_q,
            products=product_items,
            categories=categories,
            brands=brands,
            popular_tags=popular_tags
        )
    )


@router.get("/brands", response_model=APIResponse[List[str]])
def get_catalog_brands(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Retrieve unique available brands, optionally filtered by category.
    """
    query = db.query(Product.brand).filter(Product.is_active == True)
    if category and category != "all":
        if category.isdigit():
            query = query.filter(Product.category_id == int(category))
        else:
            cat_obj = db.query(Category).filter(Category.slug == category).first()
            if cat_obj:
                query = query.filter(Product.category_id == cat_obj.id)

    brands = [b[0] for b in query.distinct().all() if b[0]]
    brands.sort()
    return APIResponse(
        success=True,
        data=brands
    )


@router.get("/search", response_model=APIResponse[List[ProductResponse]])
def live_search_products(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Fast live search endpoint.
    """
    term = f"%{q.strip()}%"
    products = (
        db.query(Product)
        .filter(
            Product.is_active == True,
            or_(
                Product.name.ilike(term),
                Product.brand.ilike(term),
                Product.sku.ilike(term),
                Product.subcategory_name.ilike(term),
                Product.tags.ilike(term)
            )
        )
        .limit(limit)
        .all()
    )

    return APIResponse(
        success=True,
        data=[ProductResponse.model_validate(p) for p in products]
    )


@router.get("/{product_id}", response_model=APIResponse[ProductResponse])
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRODUCT_NOT_FOUND", "message": f"Product with ID {product_id} not found"}
        )

    return APIResponse(
        success=True,
        data=ProductResponse.model_validate(product)
    )


@router.get("/slug/{slug}", response_model=APIResponse[ProductResponse])
def get_product_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.slug == slug, Product.is_active == True).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PRODUCT_NOT_FOUND", "message": f"Product with slug '{slug}' not found"}
        )

    return APIResponse(
        success=True,
        data=ProductResponse.model_validate(product)
    )
