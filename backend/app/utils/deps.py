from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole
from app.models.document import Document, AccessLevel

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except Exception:
        return None

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.lower()
        allowed = [r.lower() for r in allowed_roles]
        
        # Admin has master access
        if user_role == UserRole.ADMIN.value:
            return current_user

        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{current_user.role}' lacks permission. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker

require_admin = require_roles([UserRole.ADMIN.value])
require_manager_or_admin = require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value])
require_authenticated_user = require_roles([UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.EMPLOYEE.value])

def check_document_access(document: Document, user: User) -> bool:
    """
    Role-Based Access Control logic for documents:
    - Admin: View all documents
    - Manager: View authorized documents (all except restricted unless uploaded by them)
    - Employee: View authorized documents (internal/public or uploaded by self, cannot access confidential/restricted)
    """
    user_role = user.role.lower()
    if user_role == UserRole.ADMIN.value:
        return True
    
    # Uploader always has access to their own document
    if document.uploaded_by == user.id:
        return True
        
    doc_access = (document.access_level or "internal").lower()
    
    if user_role == UserRole.MANAGER.value:
        # Managers can access public, internal, and confidential, but restricted is admin/owner only
        return doc_access in [AccessLevel.PUBLIC.value, AccessLevel.INTERNAL.value, AccessLevel.CONFIDENTIAL.value]
        
    if user_role == UserRole.EMPLOYEE.value:
        # Employees cannot access confidential or restricted files
        return doc_access in [AccessLevel.PUBLIC.value, AccessLevel.INTERNAL.value]
        
    return False
