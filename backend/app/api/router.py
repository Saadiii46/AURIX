# pyright: reportMissingImports=false

from fastapi import APIRouter
from api.routes.auth import sign_up, user_session, verify_user
from api.routes.groq import chat as groq_chat

api_router = APIRouter()

# Include all endpoint routers

api_router.include_router(sign_up.router)
api_router.include_router(user_session.router)
api_router.include_router(verify_user.router)
api_router.include_router(groq_chat.router)