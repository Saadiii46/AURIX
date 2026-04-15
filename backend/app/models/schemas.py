# pyright: reportMissingImports=false

"""
Pydantic Models for Request/Response Schemas
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from fastapi import Body


# --- Auth Models (existing) ---

class UserSignUpRequest(BaseModel):
    fullName: str = Field(min_length=2, max_length=50)
    email: EmailStr
    idToken: str

class UserSignInRequest(BaseModel):
    idToken: str

class UserSessionRequest(BaseModel):
    idToken: str = Body(..., embed=True)

class UserResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: Optional[str] = None


# --- Deepgram STT Models ---

class TranscriptionRequest(BaseModel):
    audio_url: Optional[str] = None
    language: str = "en"
    model: str = "nova-2"

class TranscriptionResponse(BaseModel):
    transcript: str
    confidence: float
    words: Optional[List[Dict[str, Any]]] = None


# --- Deepgram TTS Models ---

class TTSRequest(BaseModel):
    text: str
    voice: str = "aura-asteria-en"
    model: str = "aura-asteria-en"


# --- Groq Chat Models ---

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "llama-3.3-70b-versatile"
    temperature: float = 0.7
    max_tokens: int = 1024
    stream: bool = False

class ChatResponse(BaseModel):
    message: str
    role: str = "assistant"
    usage: Optional[Dict[str, int]] = None

class SimpleMessageRequest(BaseModel):
    message: str

class SystemPromptRequest(BaseModel):
    prompt: str

class AgentToolDefinition(BaseModel):
    type: str = "function"
    function: Dict[str, Any]

class AgentRequest(BaseModel):
    message: str
    tools: List[Dict[str, Any]]

class AgentToolResult(BaseModel):
    tool_call_id: str
    result: Any

class AgentToolResultsRequest(BaseModel):
    tool_results: List[AgentToolResult]

class AgentResponse(BaseModel):
    type: str
    response: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None


# --- RAG Models ---

class EmbeddingRequest(BaseModel):
    text: str
    model: str = "embed-english-v3.0"

class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    score_threshold: float = 0.7

class SearchResult(BaseModel):
    id: str
    score: float
    content: str
    metadata: Optional[Dict[str, Any]] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str

class DocumentUpload(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None

class DocumentResponse(BaseModel):
    id: str
    message: str
    status: str
