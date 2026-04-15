# pyright: reportMissingImports=false

"""
Groq Chat Endpoints — backend-managed conversation history & agent mode
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.groq_service import GroqService

router = APIRouter(prefix="/api/v1/groq", tags=["groq"])
groq_service = GroqService()


# --- Schemas ---

class SimpleMessageRequest(BaseModel):
    message: str

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


# --- Endpoints ---

@router.post("/chat")
async def chat(request: SimpleMessageRequest):
    try:
        response = groq_service.send_message(request.message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
