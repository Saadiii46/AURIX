# pyright: reportMissingImports=false

from fastapi import APIRouter
from app.api.routes.auth import sign_up, user_session, verify_user
from app.api.routes.groq import chat as groq_chat
from app.api.routes.deepgram import stt_tts as deepgram_routes
from app.api.routes.rag import search as rag_routes

api_router = APIRouter()

# Include all endpoint routers

api_router.include_router(sign_up.router)
api_router.include_router(user_session.router)
api_router.include_router(verify_user.router)
api_router.include_router(groq_chat.router)
api_router.include_router(deepgram_routes.router)
api_router.include_router(rag_routes.router)
