from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.auth import UserResponse

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    resource: str
    timestamp: datetime
    result: str
    details: Optional[str] = None
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

class AuditLogCreate(BaseModel):
    user_id: Optional[int] = None
    action: str
    resource: str
    result: str = "SUCCESS"
    details: Optional[str] = None

