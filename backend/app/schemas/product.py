from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.common import PaginationMeta


class ProductImageResponse(BaseModel):
    id: int
    image_url: str
    alt_text: Optional[str] = None
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    sku: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    brand: str = Field(..., min_length=1, max_length=100)
    category_id: int = Field(..., gt=0)
    subcategory_name: Optional[str] = Field(None, max_length=100)
    price: Decimal = Field(..., ge=0)
    mrp: Decimal = Field(..., ge=0)
    stock_quantity: int = Field(50, ge=0)
    low_stock_threshold: int = Field(10, ge=1)
    unit: str = Field("piece", max_length=50)
    weight: Optional[str] = Field(None, max_length=50)
    emoji: str = Field("🛒", max_length=20)
    badge: Optional[str] = Field(None, max_length=50)
    eta: str = Field("10–15 mins", max_length=50)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    tags: Optional[str] = None
    highlights: Optional[str] = None
    specifications: Optional[str] = None
    frequently_bought_with: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False

    @field_validator("mrp")
    @classmethod
    def validate_mrp_gte_price(cls, mrp: Decimal, info) -> Decimal:
        price = info.data.get("price")
        if price is not None and mrp < price:
            raise ValueError("MRP must be greater than or equal to the selling price")
        return mrp


class ProductCreate(ProductBase):
    slug: Optional[str] = None
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = None
    brand: Optional[str] = None
    category_id: Optional[int] = Field(None, gt=0)
    subcategory_name: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    mrp: Optional[Decimal] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=1)
    unit: Optional[str] = None
    weight: Optional[str] = None
    emoji: Optional[str] = None
    badge: Optional[str] = None
    eta: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    tags: Optional[str] = None
    highlights: Optional[str] = None
    specifications: Optional[str] = None
    frequently_bought_with: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    sku: str
    name: str
    slug: str
    brand: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: int
    subcategory_name: Optional[str] = None
    price: Decimal
    mrp: Decimal
    discount_percentage: int
    stock_quantity: int
    low_stock_threshold: int
    unit: str
    weight: Optional[str] = None
    emoji: str
    badge: Optional[str] = None
    eta: str
    rating: Decimal
    review_count: int
    tags: Optional[str] = None
    highlights: Optional[str] = None
    specifications: Optional[str] = None
    frequently_bought_with: Optional[str] = None
    is_active: bool
    is_featured: bool
    images: List[ProductImageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    pagination: PaginationMeta


class SearchSuggestionItem(BaseModel):
    id: int
    name: str
    brand: str
    emoji: str
    image_url: Optional[str] = None
    selling_price: Decimal
    mrp: Decimal
    weight: Optional[str] = None
    category_name: Optional[str] = None


class SearchSuggestionsResponse(BaseModel):
    query: str
    products: List[SearchSuggestionItem] = []
    categories: List[str] = []
    brands: List[str] = []
    popular_tags: List[str] = []
