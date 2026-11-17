from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog, AuditResult

async def record_audit_log(
    db: AsyncSession,
    action: str,
    resource: str,
    result: str = AuditResult.SUCCESS.value,
    user_id: Optional[int] = None,
    details: Optional[str] = None
) -> AuditLog:
    """
    Persists an audit event in the database.
    Format: User -> Action -> Resource -> Time -> Result -> Details
    """
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
        result=result,
        details=details
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)
    return log_entry

