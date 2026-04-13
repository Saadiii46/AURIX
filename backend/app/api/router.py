# pyright: reportMissingImports=false

from fastapi import APIRouter
from api.routes.auth import sign_up, user_session, verify_user

api_router = APIRouter()

# Include all endpoint routers

api_router.include_router(sign_up.router)
api_router.include_router(user_session.router)
api_router.include_router(verify_user.router)