# pyright: reportMissingImports=false

"""
Groq Chat Endpoints — backend-managed conversation history & agent mode
"""

import json
import base64
import logging
import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.groq_service import GroqService
from app.services.inworld_tts_service import InWorldTTSService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/groq", tags=["groq"])
groq_service = GroqService()
inworld_tts = InWorldTTSService()


# --- Schemas ---

class SimpleMessageRequest(BaseModel):
    message: str

class StreamTTSRequest(BaseModel):
    message: str
    voice: str = "Nate"

class SystemPromptRequest(BaseModel):
    prompt: str

class AgentRequest(BaseModel):
    message: str
    tools: List[Dict[str, Any]]

class AgentToolResult(BaseModel):
    tool_call_id: str
    result: Any

class AgentToolResultsRequest(BaseModel):
    tool_results: List[AgentToolResult]


# ── Sentence splitting helper ──────────────────────────────

_SENTENCE_END_RE = re.compile(r'(?<=[.!?;:,])\s')


def _split_sentences(buffer: str):
    """Split buffer into (ready_sentence, remaining_buffer).
    Splits on punctuation followed by whitespace (. ! ? ; : ,)
    or forces a split at last space when buffer > 20 chars.
    Aggressive splitting = faster time-to-first-audio."""
    parts = _SENTENCE_END_RE.split(buffer)
    if len(parts) > 1:
        return parts[0].strip(), buffer[len(parts[0]):].lstrip()

    # Force split early — don't wait for long buffer
    if len(buffer) > 20:
        last_space = buffer.rfind(" ", 0, 30)
        if last_space > 5:
            return buffer[:last_space].strip(), buffer[last_space:].strip()

    return None, buffer


# --- Endpoints ---

@router.post("/chat")
async def chat(request: SimpleMessageRequest):
    try:
        response = groq_service.send_message(request.message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream-tts")
async def chat_stream_tts(request: StreamTTSRequest):
    """
    Stream LLM tokens via SSE. Accumulates text and sends InWorld TTS
    audio as fast as possible. Emits:
      event: text   — partial token for live text display
      event: audio  — base64-encoded audio chunk
      event: done   — end of stream
    """
    import asyncio

    def generate():
        sentence_buffer = ""
        voice = request.voice
        # Reuse single event loop for all TTS calls (avoid overhead of creating new loops)
        loop = asyncio.new_event_loop()

        try:
            for token in groq_service.send_message_stream(request.message):
                yield f"event: text\ndata: {json.dumps({'text': token})}\n\n"

                sentence_buffer += token

                ready, sentence_buffer = _split_sentences(sentence_buffer)
                if ready:
                    try:
                        audio_bytes = loop.run_until_complete(
                            inworld_tts.text_to_speech(text=ready, voice=voice)
                        )
                        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
                        yield f"event: audio\ndata: {json.dumps({'audio': audio_b64})}\n\n"
                    except Exception as tts_err:
                        logger.error("InWorld TTS error for chunk: %s", tts_err)

            # Flush remaining buffer
            remaining = sentence_buffer.strip()
            if remaining:
                try:
                    audio_bytes = loop.run_until_complete(
                        inworld_tts.text_to_speech(text=remaining, voice=voice)
                    )
                    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
                    yield f"event: audio\ndata: {json.dumps({'audio': audio_b64})}\n\n"
                except Exception as tts_err:
                    logger.error("InWorld TTS error for final chunk: %s", tts_err)

        except Exception as e:
            logger.error("Stream error: %s", e)
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
        finally:
            loop.close()

        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat/agent")
async def agent_chat(request: AgentRequest):
    try:
        result = groq_service.send_agent_message(request.message, request.tools)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/agent/tool-results")
async def agent_tool_results(request: AgentToolResultsRequest):
    try:
        tool_results = [
            {"tool_call_id": tr.tool_call_id, "result": tr.result}
            for tr in request.tool_results
        ]
        result = groq_service.submit_tool_results(tool_results)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/chat/history")
async def clear_history():
    try:
        groq_service.clear_history()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/history")
async def get_history():
    return {"history": groq_service.get_history()}


@router.put("/chat/system-prompt")
async def set_system_prompt(request: SystemPromptRequest):
    try:
        groq_service.set_system_prompt(request.prompt)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_models():
    return {
        "models": [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768",
            "gemma2-9b-it"
        ]
    }
