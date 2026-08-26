import math
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.audit_log import AdminAuditLog
from app.schemas.audit_log import AuditLogResponse
from app.schemas.common import APIResponse, PaginationMeta
from app.api.deps import require_admin

router = APIRouter(prefix="/audit-logs", tags=["Admin Audit Logs"])


class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    pagination: PaginationMeta


@router.get("", response_model=APIResponse[AuditLogListResponse])
def get_audit_logs(
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AdminAuditLog)

    if action:
        query = query.filter(AdminAuditLog.action == action)
    if entity_type:
        query = query.filter(AdminAuditLog.entity_type == entity_type)

    query = query.order_by(AdminAuditLog.created_at.desc())

    total_count = query.count()
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    offset = (page - 1) * limit
    logs = query.offset(offset).limit(limit).all()

    items = []
    for log in logs:
        admin_name = log.admin_user.full_name if log.admin_user else "Admin System"
        items.append(
            AuditLogResponse(
                id=log.id,
                admin_user_id=log.admin_user_id,
                admin_name=admin_name,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                details=log.details,
                ip_address=log.ip_address,
                created_at=log.created_at
            )
        )

    return APIResponse(
        success=True,
        data=AuditLogListResponse(
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
