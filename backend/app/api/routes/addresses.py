from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse
from app.schemas.common import APIResponse
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.get("", response_model=APIResponse[List[AddressResponse]])
def get_addresses(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    addresses = (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )
    return APIResponse(
        success=True,
        data=[AddressResponse.model_validate(a) for a in addresses]
    )


@router.post("", response_model=APIResponse[AddressResponse], status_code=status.HTTP_201_CREATED)
def create_address(
    addr_in: AddressCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if this is the first address or marked default
    user_addresses_count = db.query(Address).filter(Address.user_id == current_user.id).count()
    should_be_default = addr_in.is_default or (user_addresses_count == 0)

    if should_be_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    address = Address(
        user_id=current_user.id,
        full_name=addr_in.full_name.strip(),
        phone=addr_in.phone.strip(),
        address_line1=addr_in.address_line1.strip(),
        address_line2=addr_in.address_line2.strip() if addr_in.address_line2 else "",
        landmark=addr_in.landmark.strip() if addr_in.landmark else None,
        city=addr_in.city.strip() if addr_in.city else "Satnali",
        state=addr_in.state.strip() if addr_in.state else "Haryana",
        pincode=addr_in.pincode.strip(),
        address_type=addr_in.address_type or "home",
        is_default=should_be_default
    )
    db.add(address)
    db.commit()
    db.refresh(address)

    return APIResponse(
        success=True,
        data=AddressResponse.model_validate(address)
    )


@router.put("/{address_id}", response_model=APIResponse[AddressResponse])
def update_address(
    address_id: int,
    addr_in: AddressUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ADDRESS_NOT_FOUND", "message": "Address not found."}
        )

    if addr_in.is_default:
        db.query(Address).filter(Address.user_id == current_user.id, Address.id != address_id).update({"is_default": False})
        address.is_default = True

    update_data = addr_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(address, field, val)

    db.commit()
    db.refresh(address)

    return APIResponse(
        success=True,
        data=AddressResponse.model_validate(address)
    )


@router.delete("/{address_id}", response_model=APIResponse[dict])
def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ADDRESS_NOT_FOUND", "message": "Address not found."}
        )

    was_default = address.is_default
    db.delete(address)
    db.flush()

    if was_default:
        first_remaining = db.query(Address).filter(Address.user_id == current_user.id).first()
        if first_remaining:
            first_remaining.is_default = True

    db.commit()

    return APIResponse(
        success=True,
        data={"message": "Address deleted successfully."}
    )


@router.patch("/{address_id}/default", response_model=APIResponse[AddressResponse])
def set_default_address(
    address_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ADDRESS_NOT_FOUND", "message": "Address not found."}
        )

    db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})
    address.is_default = True
    db.commit()
    db.refresh(address)

    return APIResponse(
        success=True,
        data=AddressResponse.model_validate(address)
    )
