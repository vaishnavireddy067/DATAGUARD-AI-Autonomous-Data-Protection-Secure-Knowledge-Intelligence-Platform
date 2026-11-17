import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class AuditResult(str, enum.Enum):
    SUCCESS = "SUCCESS"
    ALLOWED = "ALLOWED"
    DENIED = "DENIED"
    FAILED = "FAILED"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False) # e.g. LOGIN, UPLOAD_DOCUMENT, VIEW_DOCUMENT, ANALYZE_DOCUMENT, APPLY_MASK, APPLY_REDACT, RESTRICT_ACCESS
    resource = Column(String(255), nullable=False) # e.g. filename, document_id, system
    timestamp = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    result = Column(String(50), default=AuditResult.SUCCESS.value, nullable=False)
    details = Column(Text, nullable=True)

    user = relationship("User", back_populates="audit_logs")
