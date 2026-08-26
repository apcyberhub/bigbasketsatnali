from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.delivery_zone import DeliveryCheckResponse
from app.services.checkout import find_delivery_zone_for_pincode, normalize_pincode

router = APIRouter(prefix="/delivery", tags=["Delivery"])


@router.get("/check", response_model=ApiResponse[DeliveryCheckResponse])
def check_delivery_availability(
    pincode: str = Query(..., description="6-digit Indian Postal Pincode"),
    db: Session = Depends(get_db)
):
    """
    Check if delivery is available for the given pincode.
    Returns delivery zone details, delivery fee, minimum order, and estimated delivery time.
    """
    try:
        clean_pin = normalize_pincode(pincode)
    except Exception as e:
        return ApiResponse.ok(data=DeliveryCheckResponse(
            available=False,
            message="Invalid pincode. Please enter a valid 6-digit Indian postal code."
        ))

    zone = find_delivery_zone_for_pincode(clean_pin, db)

    if not zone:
        return ApiResponse.ok(data=DeliveryCheckResponse(
            available=False,
            message=f"Delivery is currently unavailable in pincode {clean_pin}."
        ))

    eta = f"{zone.estimated_min_minutes}–{zone.estimated_max_minutes} minutes"

    return ApiResponse.ok(data=DeliveryCheckResponse(
        available=True,
        zone=zone.name,
        city=zone.city,
        state=zone.state,
        delivery_fee=zone.delivery_fee,
        free_delivery_threshold=zone.free_delivery_threshold,
        minimum_order=zone.minimum_order,
        estimated_delivery=eta
    ))
