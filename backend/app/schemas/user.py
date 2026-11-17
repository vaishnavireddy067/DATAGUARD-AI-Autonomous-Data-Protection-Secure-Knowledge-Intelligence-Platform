from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserRoleUpdate(BaseModel):
    role: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

