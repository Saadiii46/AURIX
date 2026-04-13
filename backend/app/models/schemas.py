# pyright: reportMissingImports=false

from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from fastapi import Body

# Creating Schema

class UserSignUpRequest(BaseModel):
    fullName: str = Field(min_length = 2, max_length = 50)
    email: EmailStr
    idToken: str

class UserSignInRequest(BaseModel):
    idToken: str

class UserSessionRequest(BaseModel):
    idToken: str = Body(..., embed = True)

class UserResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: Optional[str] = None