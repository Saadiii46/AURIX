# pyright: reportMissingImports=false

"""
Deepgram STT Endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from app.services.deepgram_service import DeepgramService

router = APIRouter(prefix="/api/v1/deepgram", tags=["deepgram"])
deepgram_service = DeepgramService()


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio file to text"""
    import logging
    logger = logging.getLogger(__name__)
    try:
        audio_data = await file.read()
        logger.info("Received audio file: name=%s, content_type=%s, size=%d bytes",
                    file.filename, file.content_type, len(audio_data))

        if not audio_data or len(audio_data) < 100:
            logger.warning("Audio too small (%d bytes), returning empty", len(audio_data))
            return {"transcript": "", "confidence": 0, "words": []}

        result = await deepgram_service.transcribe(audio_data)
        return result
    except Exception as e:
        logger.error("Transcription endpoint error: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
