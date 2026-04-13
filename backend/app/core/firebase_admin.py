# pyright: reportMissingImports=false

import logging
from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Using logger so we can know error comes from which file.

logger = logging.getLogger(__name__)

load_dotenv()

project_id: str = os.getenv("FIREBASE_PROJECT_ID")
client_email: str = os.getenv("FIREBASE_CLIENT_EMAIL")
raw_private_key: str = os.getenv("FIREBASE_PRIVATE_KEY")
token_uri: str = os.getenv("TOKEN_URI")
private_key_id: str = os.getenv("PRIVATE_KEY_ID")
client_id: str = os.getenv("CLIENT_ID")

private_key: str = raw_private_key.replace("\\n", "\n").strip('"').strip()

def initialize_firebase_admin():

    # Loop check in dictionary if any value is missing it will show the missing value as error.

    missing: dict = [name for name, val in {
        "FIREBASE_PROJECT_ID": project_id,
        "FIREBASE_CLIENT_EMAIL": client_email,
        "FIREBASE_PRIVATE_KEY": private_key,
        "TOKEN_URI": token_uri,
        "PRIVATE_KEY_ID": private_key_id,
        "CLIENT_ID": client_id
    }.items() if not val]

    if missing:
        raise EnvironmentError(f"Missing required environment variable: {','.join(missing)}")
    
    # Initializing Firebase Admin.

    if not firebase_admin._apps:
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": project_id,
            "client_email": client_email,
            "private_key": private_key,
            "token_uri": token_uri,
            "private_key_id": private_key_id,
            "client_id": client_id
        })

        try:
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized successfully.")
        except Exception as e:
            logger.critical("Failed to initialize Firebase Admin %s", e, exc_info = True)
            raise

# Initializing db as None so when we import Firebase Admin in any file instead of connecting to firebase automatically we will use both function to intialize Firebase Admin

_db = None

def get_db():
    global _db
    if _db is None:
        _app = initialize_firebase_admin()
        _db = firestore.client(_app)
    return _db

def get_auth():
    initialize_firebase_admin()
    return auth