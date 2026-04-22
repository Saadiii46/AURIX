# pyright: reportMissingImports=false

"""
Aurix API - FastAPI Backend
Handles Auth, Deepgram STT/TTS, Groq Chat, and RAG Pipeline
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import ALLOWED_ORIGINS

app = FastAPI(
    title="Aurix API",
    description="Backend API for Aurix Desktop App with AI capabilities",
    version="1.0.0",
)

# Configure CORS for Electron app + dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Aurix API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "deepgram": "available",
            "groq": "available",
            "qdrant": "available"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
