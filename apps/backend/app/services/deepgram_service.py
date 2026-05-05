# pyright: reportMissingImports=false

"""
Deepgram STT Service
"""

import os
import logging
from dotenv import load_dotenv
from deepgram import DeepgramClient, PrerecordedOptions

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

logger = logging.getLogger(__name__)


class DeepgramService:
    """Service for Deepgram speech-to-text"""

    def __init__(self):
        self.client = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY", ""))

    async def transcribe(self, audio_data: bytes) -> dict:
        """Transcribe audio data to text using async Deepgram API"""
        if not audio_data or len(audio_data) < 100:
            logger.warning("Audio data too small: %d bytes", len(audio_data) if audio_data else 0)
            return {"transcript": "", "confidence": 0, "words": []}

        try:
            options = PrerecordedOptions(
                model="nova-2",
                smart_format=True,
                language="en",
            )

            payload = {"buffer": audio_data}
            logger.info("Sending %d bytes to Deepgram for transcription", len(audio_data))

            # Use async version to avoid blocking the event loop
            response = await self.client.listen.asyncrest.v("1").transcribe_file(payload, options)

            result = response.results
            transcript = result.channels[0].alternatives[0].transcript
            confidence = result.channels[0].alternatives[0].confidence
            words = [
                {
                    "word": w.word,
                    "start": w.start,
                    "end": w.end,
                    "confidence": w.confidence,
                }
                for w in (result.channels[0].alternatives[0].words or [])
            ]

            logger.info("Transcription: '%s' (confidence: %.2f)", transcript, confidence)
            return {
                "transcript": transcript,
                "confidence": confidence,
                "words": words,
            }

        except Exception as e:
            logger.error("Deepgram transcription error: %s", str(e))
            raise Exception(f"Transcription failed: {str(e)}")
