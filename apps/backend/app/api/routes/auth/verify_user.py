# pyright: reportMissingImports=false

from typing import Annotated
from fastapi import APIRouter, Cookie, HTTPException
import logging
from app.core.firebase_admin import get_auth, get_db

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/verify", )    
def user_verification(session: Annotated[str | None, Cookie()] = None):
    try:
        auth = get_auth()
        db = get_db()

        if not session:
            raise HTTPException(status_code = 401, detail = "No session found")

        user_session = auth.verify_session_cookie(session, check_revoked = True)
        user_id = user_session["uid"]
        user = db.collection("users").document(user_id).get()

        user_data = user.to_dict()

        return {
            "id": user_data["id"],
            "email": user_data["email"],
            "name": user_data["fullName"]
        }

    except Exception as e:
        logger.critical(f"Error verifying user. {e}")
        raise HTTPException(status_code = 500, detail = "Internal server error.")