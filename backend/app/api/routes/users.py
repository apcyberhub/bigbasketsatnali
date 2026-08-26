from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserPasswordChange
from app.schemas.common import APIResponse
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=APIResponse[UserResponse])
def get_profile(
    current_user: User = Depends(get_current_active_user)
):
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(current_user)
    )


@router.put("/profile", response_model=APIResponse[UserResponse])
def update_profile(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if update_in.full_name:
        current_user.full_name = update_in.full_name.strip()

    if update_in.email and update_in.email.lower() != current_user.email:
        # Check if email taken
        exists = db.query(User).filter(User.email == update_in.email.lower(), User.id != current_user.id).first()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "DUPLICATE_EMAIL", "message": "Email is already in use by another account."}
            )
        current_user.email = update_in.email.lower().strip()

    db.commit()
    db.refresh(current_user)

    return APIResponse(
        success=True,
        data=UserResponse.model_validate(current_user)
    )


@router.put("/change-password", response_model=APIResponse[dict])
def change_password(
    pass_in: UserPasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_password(pass_in.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_PASSWORD", "message": "Current password is incorrect."}
        )

    current_user.password_hash = hash_password(pass_in.new_password)
    db.commit()

    return APIResponse(
        success=True,
        data={"message": "Password changed successfully"}
    )
