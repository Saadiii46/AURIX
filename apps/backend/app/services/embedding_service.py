# pyright: reportMissingImports=false

"""
Cohere Embedding Service
"""

import os
from dotenv import load_dotenv
import cohere
from typing import List

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))


class EmbeddingService:
    """Service for generating embeddings with Cohere"""

    def __init__(self):
        self.client = cohere.Client(os.getenv("COHERE_API_KEY", ""))

    async def generate_embedding(
        self,
        text: str,
        model: str = "embed-english-v3.0",
        input_type: str = "search_document"
    ) -> List[float]:
        """Generate embedding for text"""
        try:
            response = self.client.embed(
                texts=[text],
                model=model,
                input_type=input_type
            )
            return response.embeddings[0]

        except Exception as e:
            raise Exception(f"Embedding generation failed: {str(e)}")

    async def generate_embeddings_batch(
        self,
        texts: List[str],
        model: str = "embed-english-v3.0",
        input_type: str = "search_document"
    ) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            response = self.client.embed(
                texts=texts,
                model=model,
                input_type=input_type
            )
            return response.embeddings

        except Exception as e:
            raise Exception(f"Batch embedding generation failed: {str(e)}")
