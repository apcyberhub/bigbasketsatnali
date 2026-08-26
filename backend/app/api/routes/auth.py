from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.models.user import User
from app.models.cart import Cart
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.schemas.common import APIResponse
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[TokenResponse], status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new customer account and return an access token.
    """
    # Check duplicate email
    existing_email = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DUPLICATE_EMAIL", "message": "An account with this email address already exists."}
        )

    # Check duplicate phone
    existing_phone = db.query(User).filter(User.phone == user_in.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DUPLICATE_PHONE", "message": "An account with this mobile number already exists."}
        )

    # Create new User
    user = User(
        full_name=user_in.full_name.strip(),
        email=user_in.email.lower().strip(),
        phone=user_in.phone.strip(),
        password_hash=hash_password(user_in.password),
        is_active=True,
        is_verified=True,
        is_admin=False
    )
    db.add(user)
    db.flush()

    # Create default Cart for user
    cart = Cart(user_id=user.id)
    db.add(cart)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token(subject=user.id)

    return APIResponse(
        success=True,
        data=TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            user=UserResponse.model_validate(user)
        )
    )


@router.post("/login", response_model=APIResponse[TokenResponse])
def login(
    login_in: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate customer via email or mobile number and password.
    """
    identifier = login_in.identifier.strip().lower()

    user = db.query(User).filter(
        or_(
            User.email == identifier,
            User.phone == identifier
        )
    ).first()

    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email/phone or password."}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_DISABLED", "message": "Your account has been deactivated."}
        )

    token = create_access_token(subject=user.id)

    return APIResponse(
        success=True,
        data=TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            user=UserResponse.model_validate(user)
        )
    )


@router.get("/me", response_model=APIResponse[UserResponse])
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve profile details of the currently authenticated customer.
    """
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(current_user)
    )
