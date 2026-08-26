from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")


class APIError(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[APIError] = None

    @classmethod
    def ok(cls, data: Optional[T] = None, message: Optional[str] = None) -> "APIResponse[T]":
        return cls(success=True, data=data, message=message, error=None)

    @classmethod
    def err(cls, code: str, message: str, details: Optional[Any] = None) -> "APIResponse[T]":
        return cls(success=False, data=None, error=APIError(code=code, message=message, details=details))


ApiResponse = APIResponse
ApiError = APIError


class PaginationMeta(BaseModel):
    total_count: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_prev: bool
