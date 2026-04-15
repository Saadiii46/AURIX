# pyright: reportMissingImports=false

"""
RAG Pipeline Endpoints (Cohere + Qdrant)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.retrieval_service import RetrievalService

router = APIRouter(prefix="/api/v1/rag", tags=["rag"])
retrieval_service = RetrievalService()


# --- Schemas ---

class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    score_threshold: float = 0.7

class DocumentUpload(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None


# --- Endpoints ---

@router.post("/search")
async def semantic_search(request: SearchRequest):
    """Perform semantic search in vector database"""
    try:
        results = await retrieval_service.search(
            query=request.query,
            limit=request.limit,
            score_threshold=request.score_threshold
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_document(document: DocumentUpload):
    """Upload document to RAG pipeline. Generates embeddings and stores in Qdrant."""
    try:
        result = await retrieval_service.upload_document(
            content=document.content,
            metadata=document.metadata
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collection/info")
async def collection_info():
    """Get information about the vector collection"""
    try:
        info = await retrieval_service.get_collection_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
