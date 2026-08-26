from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.coupon import Coupon
from app.models.audit_log import AdminAuditLog
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponResponse
from app.schemas.common import APIResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/coupons", tags=["Admin Coupons"])


@router.get("", response_model=APIResponse[List[CouponResponse]])
def get_coupons(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    coupons = db.query(Coupon).order_by(Coupon.created_at.desc()).all()
    return APIResponse(
        success=True,
        data=[CouponResponse.model_validate(c) for c in coupons]
    )


@router.post("", response_model=APIResponse[CouponResponse], status_code=status.HTTP_201_CREATED)
def create_coupon(
    coupon_in: CouponCreate,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    code_clean = coupon_in.code.strip().upper()
    existing = db.query(Coupon).filter(Coupon.code == code_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DUPLICATE_COUPON_CODE", "message": f"Coupon '{code_clean}' already exists."}
        )

    coupon_data = coupon_in.model_dump()
    coupon_data["code"] = code_clean

    coupon = Coupon(**coupon_data)
    db.add(coupon)
    db.flush()

    audit = AdminAuditLog(
        admin_user_id=admin_user.id,
        action="coupon_created",
        entity_type="coupon",
        entity_id=str(coupon.id),
        details=f"Created coupon '{coupon.code}' ({coupon.discount_type}: {coupon.discount_value})",
        ip_address=request.client.host if request and request.client else None
    )
    db.add(audit)

    db.commit()
    db.refresh(coupon)

    return APIResponse(
        success=True,
        data=CouponResponse.model_validate(coupon)
    )


@router.put("/{coupon_id}", response_model=APIResponse[CouponResponse])
def update_coupon(
    coupon_id: int,
    coupon_in: CouponUpdate,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "COUPON_NOT_FOUND", "message": "Coupon not found."}
        )

    update_data = coupon_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(coupon, field, val)

    audit = AdminAuditLog(
        admin_user_id=admin_user.id,
        action="coupon_updated",
        entity_type="coupon",
        entity_id=str(coupon.id),
        details=f"Updated coupon '{coupon.code}'",
        ip_address=request.client.host if request and request.client else None
    )
    db.add(audit)

    db.commit()
    db.refresh(coupon)

    return APIResponse(
        success=True,
        data=CouponResponse.model_validate(coupon)
    )


@router.delete("/{coupon_id}", response_model=APIResponse[dict])
def delete_coupon(
    coupon_id: int,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "COUPON_NOT_FOUND", "message": "Coupon not found."}
        )

    code = coupon.code
    db.delete(coupon)

    audit = AdminAuditLog(
        admin_user_id=admin_user.id,
        action="coupon_deleted",
        entity_type="coupon",
        entity_id=str(coupon_id),
        details=f"Deleted coupon '{code}'",
        ip_address=request.client.host if request and request.client else None
    )
    db.add(audit)

    db.commit()

    return APIResponse(
        success=True,
        data={"message": f"Coupon '{code}' deleted successfully."}
    )
