# pyright: reportMissingImports=false

import logging
from fastapi import APIRouter, HTTPException
from models.schemas import UserSignUpRequest
from core.firebase_admin import get_auth, get_db
from datetime import datetime, timezone
from firebase_admin import auth as firebase_auth

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/sign-up")
async def sign_up_user(user: UserSignUpRequest):
    try:
         # Initializing Firebase Admin (auth, db)

        db = get_db()
        auth = get_auth()

        email = user.email
        full_name = user.fullName
        id_token = user.idToken

        if not id_token:
            raise HTTPException(status_code = 401, detail = "ID Token not found, Unauthorized")

        verify_user_id_token = auth.verify_id_token(id_token)
        user_id = verify_user_id_token["uid"]

        user_data = {
            "id": user_id,
            "fullName": full_name,
            "email": email,
            "role": "user",
            "createdAt": datetime.now(timezone.utc)
        }

        db.collection("users").document(user_id).set(user_data, merge = True)
        auth.update_user(user_id, display_name = full_name)

        return {"message": "User created successfully"}

    except HTTPException:
        raise

    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code = 401, detail = "ID Token not found, Unauthorized")

    except Exception as e:
        logger.error("Sign up failed %s", e, exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internel Server Error")