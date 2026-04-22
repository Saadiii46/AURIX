# pyright: reportMissingImports=false

"""
Application Configuration
Load environment variables using os.getenv (matching existing AURIX pattern)
"""

import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "Aurix API"

# CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "app://.",
    "https://aurix-api.vercel.app",
]

# Deepgram Configuration
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")

# Groq Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# InWorld TTS Configuration
INWORLD_API_KEY = os.getenv("INWORLD_API_KEY", "")

# OpenRouter Configuration (for Agent mode)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Cohere Configuration (for embeddings)
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")

# Qdrant Configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "aurix_docs")
