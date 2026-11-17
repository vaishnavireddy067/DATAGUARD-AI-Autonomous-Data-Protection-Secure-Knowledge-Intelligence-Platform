import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User, UserRole
from app.models.audit import AuditLog, AuditResult
from app.utils.security import get_password_hash

logger = logging.getLogger(__name__)

def get_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

INITIAL_USERS = [
    {
        "name": "System Administrator",
        "email": "admin@dataguard.ai",
        "password": "Admin@123",
        "role": UserRole.ADMIN.value
    },
    {
        "name": "Security Manager",
        "email": "manager@dataguard.ai",
        "password": "Manager@123",
        "role": UserRole.MANAGER.value
    },
    {
        "name": "Standard Employee",
        "email": "employee@dataguard.ai",
        "password": "Employee@123",
        "role": UserRole.EMPLOYEE.value
    }
]

async def seed_initial_data(db: AsyncSession):
    """
    Seeds initial users with role-based access control if not already present.
    """
    for user_info in INITIAL_USERS:
        stmt = select(User).where(User.email == user_info["email"])
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if not existing_user:
            new_user = User(
                name=user_info["name"],
                email=user_info["email"],
                hashed_password=get_password_hash(user_info["password"]),
                role=user_info["role"],
                created_at=get_now()
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)

            # Record audit log
            init_audit = AuditLog(
                user_id=new_user.id,
                action="INITIALIZE_DEFAULT_USER",
                resource=f"user:{new_user.email}",
                timestamp=get_now(),
                result=AuditResult.SUCCESS.value,
                details=f"System initialized default user account with role {new_user.role}"
            )
            db.add(init_audit)
            await db.commit()
            logger.info(f"Initialized user: {new_user.email} with role: {new_user.role}")
