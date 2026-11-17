from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User, UserRole
from app.models.audit import AuditResult
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.utils.deps import get_current_user
from app.services.audit_service import record_audit_log

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    Registers a new user account with hashed password and role-based permissions.
    """
    # Check if email already registered
    stmt = select(User).where(User.email == user_in.email)
    res = await db.execute(stmt)
    existing_user = res.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Normalize role
    role = (user_in.role or "employee").lower()
    if role not in [UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.EMPLOYEE.value]:
        role = UserRole.EMPLOYEE.value

    # Create user
    new_user = User(
        name=user_in.name.strip(),
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        role=role,
        created_at=get_now()
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Create audit log
    await record_audit_log(
        db=db,
        action="REGISTER",
        resource=f"user:{new_user.email}",
        result=AuditResult.SUCCESS.value,
        user_id=new_user.id,
        details=f"New user registered with role {new_user.role}"
    )

    access_token = create_access_token(subject=new_user.email, role=new_user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Authenticates user and generates signed JWT token with role claims.
    """
    email = credentials.email.lower().strip()
    stmt = select(User).where(User.email == email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        # Record failed login attempt
        await record_audit_log(
            db=db,
            action="LOGIN",
            resource=f"user:{email}",
            result=AuditResult.FAILED.value,
            user_id=user.id if user else None,
            details="Invalid email or password attempt"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Record successful login
    await record_audit_log(
        db=db,
        action="LOGIN",
        resource=f"user:{user.email}",
        result=AuditResult.SUCCESS.value,
        user_id=user.id,
        details=f"User signed in successfully with role {user.role}"
    )

    access_token = create_access_token(subject=user.email, role=user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns current authenticated user details.
    """
    return UserResponse.model_validate(current_user)

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logs out user and records audit log.
    """
    await record_audit_log(
        db=db,
        action="LOGOUT",
        resource=f"user:{current_user.email}",
        result=AuditResult.SUCCESS.value,
        user_id=current_user.id,
        details=f"User {current_user.email} signed out"
    )
    return {"message": "Successfully signed out"}
