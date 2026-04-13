# pyright: reportMissingImports=false

from datetime import timedelta
import logging
from fastapi import APIRouter, HTTPException, Response
from models.schemas import UserSessionRequest
from core.firebase_admin import get_auth
import os
from models.schemas import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter()

EXPIRES_IN_SECONDS = 5 * 60 * 60 * 24
IS_PRODUCTION = os.getenv("ENV") == "production"

@router.post("/session", response_model = UserResponse)
def create_user_session(user_session: UserSessionRequest, response: Response):
    try:
        auth = get_auth()

        id_token = user_session.idToken

        if not id_token:
            raise HTTPException(status_code = 401, detail = "ID token not found")

        verify_token = auth.verify_id_token(id_token)

        email: str = verify_token.get("email")
        user_id: str = verify_token.get("uid")
        full_name: str = verify_token.get("name")

        if not verify_token.get("email_verified"):
            raise HTTPException(status_code = 401, detail = "Please verify your email")

        expires_in = timedelta(seconds = EXPIRES_IN_SECONDS)
        session_cookie = auth.create_session_cookie(id_token, expires_in = expires_in)

        cookie_settings = {
            "key": "session",
            "value": session_cookie,
            "max_age": EXPIRES_IN_SECONDS,
            "httponly": True,
            "path": "/",
            "secure": IS_PRODUCTION,
            "samesite": "none" if IS_PRODUCTION else "lax"
        }

        response.set_cookie(**cookie_settings)

        return {
            "id": user_id,
            "email": email,
            "fullName": full_name
        }

    except Exception as e:
        logger.critical("Error creating session %s", e, exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")