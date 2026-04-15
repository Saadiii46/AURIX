# pyright: reportMissingImports=false

"""
Qdrant Vector Database Service
"""

import os
import uuid
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import List, Dict, Any

load_dotenv()


class VectorService:
    """Service for Qdrant vector database operations"""

    def __init__(self):
        qdrant_api_key = os.getenv("QDRANT_API_KEY", "")
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL", "http://localhost:6333"),
            api_key=qdrant_api_key if qdrant_api_key else None
        )
        self.collection_name = os.getenv("QDRANT_COLLECTION", "aurix_docs")

    async def ensure_collection(self, vector_size: int = 1024):
        """Ensure collection exists, create if not"""
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]

            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=vector_size,
                        distance=Distance.COSINE
                    )
                )

        except Exception as e:
            raise Exception(f"Collection creation failed: {str(e)}")

    async def insert_vectors(
        self,
        vectors: List[List[float]],
        payloads: List[Dict[str, Any]]
    ) -> List[str]:
        """Insert vectors into collection"""
        try:
            await self.ensure_collection()

            points = []
            ids = []

            for vector, payload in zip(vectors, payloads):
                point_id = str(uuid.uuid4())
                ids.append(point_id)
                points.append(
                    PointStruct(
                        id=point_id,
                        vector=vector,
                        payload=payload
                    )
                )

            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )

            return ids

        except Exception as e:
            raise Exception(f"Vector insertion failed: {str(e)}")

    async def search_vectors(
        self,
        query_vector: List[float],
        limit: int = 5,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors"""
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold
            )

            return [
                {
                    "id": str(result.id),
                    "score": result.score,
                    "payload": result.payload
                }
                for result in results
            ]

        except Exception as e:
            raise Exception(f"Vector search failed: {str(e)}")

    async def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection"""
        try:
            info = self.client.get_collection(self.collection_name)
            return {
                "name": self.collection_name,
                "vectors_count": info.vectors_count,
                "points_count": info.points_count,
                "status": info.status
            }
        except Exception as e:
            return {"error": str(e)}
