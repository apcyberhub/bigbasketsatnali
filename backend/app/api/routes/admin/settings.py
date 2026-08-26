import json
from decimal import Decimal
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.setting import StoreSetting
from app.models.audit_log import AdminAuditLog
from app.schemas.settings import StoreSettingsResponse, StoreSettingsUpdate
from app.schemas.common import APIResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/settings", tags=["Admin Settings"])

DEFAULT_SETTINGS = {
    "store_name": "Big Basket Satnali",
    "store_phone": "9876543210",
    "store_email": "support@bigbasket-satnali.com",
    "store_address": "Main Market Road, Near Old Bus Stand, Satnali, Haryana - 123024",
    "min_order_amount": "99.00",
    "delivery_fee": "29.00",
    "free_delivery_threshold": "199.00",
    "default_low_stock_threshold": "10"
}


@router.get("", response_model=APIResponse[StoreSettingsResponse])
def get_store_settings(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    settings_dict = DEFAULT_SETTINGS.copy()
    db_records = db.query(StoreSetting).all()
    for r in db_records:
        settings_dict[r.key] = r.value

    return APIResponse(
        success=True,
        data=StoreSettingsResponse(
            store_name=settings_dict["store_name"],
            store_phone=settings_dict["store_phone"],
            store_email=settings_dict["store_email"],
            store_address=settings_dict["store_address"],
            min_order_amount=Decimal(settings_dict["min_order_amount"]),
            delivery_fee=Decimal(settings_dict["delivery_fee"]),
            free_delivery_threshold=Decimal(settings_dict["free_delivery_threshold"]),
            default_low_stock_threshold=int(settings_dict["default_low_stock_threshold"])
        )
    )


@router.put("", response_model=APIResponse[StoreSettingsResponse])
def update_store_settings(
    settings_in: StoreSettingsUpdate,
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    update_data = settings_in.model_dump(exclude_unset=True)

    for key, val in update_data.items():
        if val is None:
            continue
        val_str = str(val)
        existing = db.query(StoreSetting).filter(StoreSetting.key == key).first()
        if existing:
            existing.value = val_str
        else:
            db.add(StoreSetting(key=key, value=val_str))

    audit = AdminAuditLog(
        admin_user_id=admin_user.id,
        action="settings_updated",
        entity_type="settings",
        entity_id="global",
        details=f"Updated keys: {list(update_data.keys())}",
        ip_address=request.client.host if request and request.client else None
    )
    db.add(audit)

    db.commit()

    return get_store_settings(admin_user=admin_user, db=db)
