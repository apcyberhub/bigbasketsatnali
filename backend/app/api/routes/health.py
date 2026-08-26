from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db, check_db_health
from app.schemas.common import APIResponse

router = APIRouter(prefix="/health", tags=["Health Checks"])


@router.get("", response_model=APIResponse[dict])
def health_check():
    """
    Basic server liveness check.
    """
    return APIResponse(
        success=True,
        data={
            "status": "ok",
            "project": settings.PROJECT_NAME,
            "environment": settings.ENVIRONMENT
        }
    )


@router.get("/database", response_model=APIResponse[dict])
def database_health_check():
    """
    Database connectivity check.
    """
    is_alive = check_db_health()
    if not is_alive:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "DATABASE_UNAVAILABLE", "message": "Database connection check failed"}
        )
    return APIResponse(
        success=True,
        data={
            "status": "ok",
            "database": "connected"
        }
    )
