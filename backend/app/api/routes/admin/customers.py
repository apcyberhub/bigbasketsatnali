import math
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.audit_log import AdminAuditLog
from app.schemas.customer import CustomerAdminResponse, CustomerStatusUpdate
from app.schemas.common import APIResponse, PaginationMeta
from app.api.deps import require_admin

router = APIRouter(prefix="/customers", tags=["Admin Customers"])


class CustomerListResponse(BaseModel):
    items: List[CustomerAdminResponse]
    pagination: PaginationMeta


@router.get("", response_model=APIResponse[CustomerListResponse])
def get_admin_customers(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query("all", description="all, active, disabled"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.is_admin == False)

    if status_filter == "active":
        query = query.filter(User.is_active == True)
    elif status_filter == "disabled":
        query = query.filter(User.is_active == False)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(term),
                User.email.ilike(term),
                User.phone.ilike(term)
            )
        )

    query = query.order_by(User.created_at.desc())

    total_count = query.count()
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    offset = (page - 1) * limit
    users = query.offset(offset).limit(limit).all()

    items = []
    for u in users:
        # Aggregations
        orders_count = db.query(Order).filter(Order.user_id == u.id).count()
        total_spent_raw = (
            db.query(func.sum(Order.total_amount))
            .filter(Order.user_id == u.id, Order.status != "cancelled")
            .scalar()
        )
        total_spent = Decimal(str(total_spent_raw or 0.00))

        items.append(
            CustomerAdminResponse(
                id=u.id,
                full_name=u.full_name,
                email=u.email,
                phone=u.phone,
                is_active=u.is_active,
                is_verified=u.is_verified,
                is_admin=u.is_admin,
                created_at=u.created_at,
                orders_count=orders_count,
                total_spent=total_spent
            )
        )

    return APIResponse(
        success=True,
        data=CustomerListResponse(
            items=items,
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


@router.get("/{customer_id}", response_model=APIResponse[CustomerAdminResponse])
def get_admin_customer_by_id(
    customer_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == customer_id, User.is_admin == False).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CUSTOMER_NOT_FOUND", "message": "Customer not found."}
        )

    orders_count = db.query(Order).filter(Order.user_id == user.id).count()
    total_spent_raw = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.user_id == user.id, Order.status != "cancelled")
        .scalar()
    )
    total_spent = Decimal(str(total_spent_raw or 0.00))

    return APIResponse(
        success=True,
        data=CustomerAdminResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_admin=user.is_admin,
            created_at=user.created_at,
            orders_count=orders_count,
            total_spent=total_spent
        )
    )


@router.patch("/{customer_id}/status", response_model=APIResponse[CustomerAdminResponse])
def toggle_customer_status(
    customer_id: int,
    status_in: CustomerStatusUpdate,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == customer_id, User.is_admin == False).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CUSTOMER_NOT_FOUND", "message": "Customer not found."}
        )

    user.is_active = status_in.is_active

    audit = AdminAuditLog(
        admin_user_id=admin_user.id,
        action="customer_status_changed",
        entity_type="customer",
        entity_id=str(user.id),
        details=f"Customer '{user.full_name}' status set to {'Active' if user.is_active else 'Disabled'}",
        ip_address=request.client.host if request and request.client else None
    )
    db.add(audit)

    db.commit()
    db.refresh(user)

    orders_count = db.query(Order).filter(Order.user_id == user.id).count()
    total_spent_raw = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.user_id == user.id, Order.status != "cancelled")
        .scalar()
    )
    total_spent = Decimal(str(total_spent_raw or 0.00))

    return APIResponse(
        success=True,
        data=CustomerAdminResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_admin=user.is_admin,
            created_at=user.created_at,
            orders_count=orders_count,
            total_spent=total_spent
        )
    )
