from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.delivery_zone import DeliveryZone
from app.models.audit_log import AdminAuditLog
from app.schemas.delivery_zone import (
    DeliveryZoneCreate,
    DeliveryZoneUpdate,
    DeliveryZoneResponse
)
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/delivery-zones", tags=["Admin Delivery Zones"])


@router.get("", response_model=ApiResponse[List[DeliveryZoneResponse]])
def list_delivery_zones(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all delivery zones for administration.
    """
    zones = db.query(DeliveryZone).order_by(DeliveryZone.id.asc()).all()
    return ApiResponse.ok(data=[DeliveryZoneResponse.model_validate(z) for z in zones])


@router.post("", response_model=ApiResponse[DeliveryZoneResponse], status_code=status.HTTP_201_CREATED)
def create_delivery_zone(
    payload: DeliveryZoneCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new delivery zone with pincodes, fee, thresholds, and ETA.
    """
    zone = DeliveryZone(
        name=payload.name,
        pincodes=payload.pincodes,
        city=payload.city,
        state=payload.state,
        delivery_fee=payload.delivery_fee,
        free_delivery_threshold=payload.free_delivery_threshold,
        minimum_order=payload.minimum_order,
        estimated_min_minutes=payload.estimated_min_minutes,
        estimated_max_minutes=payload.estimated_max_minutes,
        is_active=payload.is_active
    )
    db.add(zone)
    db.flush()

    # Log action
    db.add(AdminAuditLog(
        admin_user_id=admin_user.id,
        action="create",
        entity_type="delivery_zone",
        entity_id=zone.id,
        details=f"Created delivery zone '{zone.name}' covering pincodes {zone.pincodes}"
    ))

    db.commit()
    db.refresh(zone)
    return ApiResponse.ok(data=DeliveryZoneResponse.model_validate(zone), message="Delivery zone created successfully.")


@router.put("/{zone_id}", response_model=ApiResponse[DeliveryZoneResponse])
def update_delivery_zone(
    zone_id: int,
    payload: DeliveryZoneUpdate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update details for a delivery zone.
    """
    zone = db.query(DeliveryZone).filter(DeliveryZone.id == zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ZONE_NOT_FOUND", "message": f"Delivery zone #{zone_id} not found."}
        )

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(zone, field, val)

    db.add(AdminAuditLog(
        admin_user_id=admin_user.id,
        action="update",
        entity_type="delivery_zone",
        entity_id=zone.id,
        details=f"Updated delivery zone '{zone.name}'"
    ))

    db.commit()
    db.refresh(zone)
    return ApiResponse.ok(data=DeliveryZoneResponse.model_validate(zone), message="Delivery zone updated successfully.")


@router.patch("/{zone_id}/status", response_model=ApiResponse[DeliveryZoneResponse])
def toggle_delivery_zone_status(
    zone_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Toggle delivery zone active/disabled status.
    """
    zone = db.query(DeliveryZone).filter(DeliveryZone.id == zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ZONE_NOT_FOUND", "message": f"Delivery zone #{zone_id} not found."}
        )

    zone.is_active = not zone.is_active
    status_str = "activated" if zone.is_active else "deactivated"

    db.add(AdminAuditLog(
        admin_user_id=admin_user.id,
        action="status_toggle",
        entity_type="delivery_zone",
        entity_id=zone.id,
        details=f"{status_str.capitalize()} delivery zone '{zone.name}'"
    ))

    db.commit()
    db.refresh(zone)
    return ApiResponse.ok(data=DeliveryZoneResponse.model_validate(zone), message=f"Delivery zone {status_str}.")


@router.delete("/{zone_id}", response_model=ApiResponse[dict])
def delete_delivery_zone(
    zone_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a delivery zone.
    """
    zone = db.query(DeliveryZone).filter(DeliveryZone.id == zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ZONE_NOT_FOUND", "message": f"Delivery zone #{zone_id} not found."}
        )

    zone_name = zone.name
    db.delete(zone)
    db.add(AdminAuditLog(
        admin_user_id=admin_user.id,
        action="delete",
        entity_type="delivery_zone",
        entity_id=zone_id,
        details=f"Deleted delivery zone '{zone_name}'"
    ))

    db.commit()
    return ApiResponse.ok(data={"id": zone_id, "deleted": True}, message=f"Delivery zone '{zone_name}' deleted.")
