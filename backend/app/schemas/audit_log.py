from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: int
    admin_user_id: Optional[int]
    admin_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
