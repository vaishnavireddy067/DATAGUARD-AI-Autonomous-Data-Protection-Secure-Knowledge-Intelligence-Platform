import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database import Base

def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.EMPLOYEE.value, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    documents = relationship("Document", back_populates="uploader", cascade="all, delete-orphan")
    actions = relationship("ProtectionAction", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
