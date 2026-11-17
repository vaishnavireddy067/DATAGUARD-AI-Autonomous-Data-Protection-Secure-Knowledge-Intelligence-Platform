import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base

def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AccessLevel(str, enum.Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    ANALYZING = "analyzing"
    DETECTING = "detecting"
    ASSESSING_RISK = "assessing_risk"
    PROTECTING = "protecting"
    COMPLETED = "completed"
    FAILED = "failed"

class ActionType(str, enum.Enum):
    MASK = "MASK"
    REDACT = "REDACT"
    RESTRICT_ACCESS = "RESTRICT_ACCESS"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, docx, txt, csv, xlsx
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    upload_time = Column(DateTime, default=get_utc_now, nullable=False)
    storage_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    risk_level = Column(String(50), default=RiskLevel.LOW.value, nullable=False)
    access_level = Column(String(50), default=AccessLevel.INTERNAL.value, nullable=False)
    status = Column(String(50), default=DocumentStatus.PENDING.value, nullable=False)
    
    # Real extracted text & analytics fields
    extracted_text = Column(Text, nullable=True)
    protected_text = Column(Text, nullable=True) # Text after masking/redaction
    risk_score = Column(Float, default=0.0, nullable=False)
    risk_explanation = Column(Text, nullable=True)

    uploader = relationship("User", back_populates="documents")
    findings = relationship("SensitiveFinding", back_populates="document", cascade="all, delete-orphan")
    actions = relationship("ProtectionAction", back_populates="document", cascade="all, delete-orphan")

class SensitiveFinding(Base):
    __tablename__ = "sensitive_findings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    data_type = Column(String(100), nullable=False) # EMAIL, PHONE_NUMBER, PAN_CARD, AADHAAR_SYNTHETIC, BANK_ACCOUNT, SENSITIVE_COLUMN
    detected_value_masked = Column(String(255), nullable=False)
    count = Column(Integer, default=1, nullable=False)
    risk_level = Column(String(50), default=RiskLevel.LOW.value, nullable=False)
    details = Column(Text, nullable=True)

    document = relationship("Document", back_populates="findings")

class ProtectionAction(Base):
    __tablename__ = "protection_actions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(50), nullable=False) # MASK, REDACT, RESTRICT_ACCESS
    performed_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    performed_at = Column(DateTime, default=get_utc_now, nullable=False)
    details = Column(Text, nullable=True)

    document = relationship("Document", back_populates="actions")
    user = relationship("User", back_populates="actions")

