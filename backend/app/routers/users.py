from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User, UserRole
from app.models.audit import AuditResult
from app.schemas.auth import UserResponse
from app.schemas.user import UserRoleUpdate, UserProfileUpdate
from app.utils.deps import get_current_user, require_admin
from app.utils.security import get_password_hash
from app.services.audit_service import record_audit_log

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    List all registered users (Admin only).
    """
    stmt = select(User).order_by(User.id.asc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]

@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    role_in: UserRoleUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user's role (Admin only).
    """
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = role_in.role.lower()
    if new_role not in [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.EMPLOYEE.value]:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be admin, manager, or employee.")

    old_role = target_user.role
    target_user.role = new_role
    await db.commit()
    await db.refresh(target_user)

    await record_audit_log(
        db=db,
        action="UPDATE_USER_ROLE",
        resource=f"user:{target_user.email}",
        result=AuditResult.SUCCESS.value,
        user_id=admin.id,
        details=f"Admin changed role of {target_user.email} from {old_role} to {new_role}"
    )

    return UserResponse.model_validate(target_user)

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update own user profile name or password.
    """
    if profile_in.name:
        current_user.name = profile_in.name.strip()
    if profile_in.password:
        current_user.hashed_password = get_password_hash(profile_in.password)

    await db.commit()
    await db.refresh(current_user)

    await record_audit_log(
        db=db,
        action="UPDATE_PROFILE",
        resource=f"user:{current_user.email}",
        result=AuditResult.SUCCESS.value,
        user_id=current_user.id,
        details="User updated profile details"
    )

    return UserResponse.model_validate(current_user)

