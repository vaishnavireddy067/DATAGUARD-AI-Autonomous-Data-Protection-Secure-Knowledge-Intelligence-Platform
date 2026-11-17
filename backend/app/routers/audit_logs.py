from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse
from app.utils.deps import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
async def get_audit_logs(
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches immutable audit logs.
    Format: User -> Action -> Resource -> Time -> Result
    - Admin: Views all system and user audit events
    - Manager: Views authorized audit logs
    - Employee: Views their personal activity audit logs
    """
    stmt = (
        select(AuditLog)
        .options(selectinload(AuditLog.user))
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
    )

    # Role enforcement
    user_role = current_user.role.lower()
    if user_role == UserRole.EMPLOYEE.value:
        stmt = stmt.where(AuditLog.user_id == current_user.id)
    elif user_id is not None and (user_role in [UserRole.ADMIN.value, UserRole.MANAGER.value]):
        stmt = stmt.where(AuditLog.user_id == user_id)

    if action:
        stmt = stmt.where(AuditLog.action == action.upper())
    if result:
        stmt = stmt.where(AuditLog.result == result.upper())
    if search:
        stmt = stmt.where(
            (AuditLog.resource.ilike(f"%{search}%")) |
            (AuditLog.action.ilike(f"%{search}%")) |
            (AuditLog.details.ilike(f"%{search}%"))
        )

    logs_res = await db.execute(stmt)
    logs = logs_res.scalars().all()
    return [AuditLogResponse.model_validate(l) for l in logs]
