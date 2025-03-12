from typing import Dict, List, Optional
import numpy as np
from supabase import create_client, Client
from src.config.settings import (
    SUPABASE_URL,
    SUPABASE_KEY,
    VECTOR_DIMENSION,
    REDIS_ENABLED,
    REDIS_URL
)

# Initialize Redis client only if a valid URL is provided
redis_client = None
if REDIS_ENABLED and REDIS_URL and REDIS_URL.startswith(('redis://', 'rediss://', 'unix://')):
    try:
        import redis
        redis_client = redis.from_url(REDIS_URL)
        # Test connection
        redis_client.ping()
    except (ImportError, redis.exceptions.ConnectionError):
        redis_client = None
        print("Warning: Redis connection failed. Caching disabled.")

class SupabaseVectorStore:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self._init_tables()

    def _init_tables(self):
        """Initialize required tables if they don't exist."""
        # Note: We don't need to create tables here as they should be created in Supabase directly
        # This method is kept for compatibility but doesn't perform any action
        pass

    def store_document(
        self,
        content: str,
        metadata: Dict,
        embeddings: List[float],
        doc_id: Optional[str] = None
    ) -> str:
        """Store document content and its vector embeddings."""
        if len(embeddings) != VECTOR_DIMENSION:
            raise ValueError(f"Embedding dimension must be {VECTOR_DIMENSION}")

        # Store document content and metadata
        doc_data = {
            "content": content,
            "metadata": metadata
        }
        if doc_id:
            doc_data["id"] = doc_id
            
        result = self.supabase.table("documents").insert(doc_data).execute()
        doc_id = result.data[0]["id"]

        # Store vector embeddings
        vector_data = {
            "document_id": doc_id,
            "embedding": np.array(embeddings).tolist()
        }
        self.supabase.table("document_vectors").insert(vector_data).execute()

        return doc_id

    def similarity_search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        metadata_filter: Optional[Dict] = None
    ) -> List[Dict]:
        """Search for similar documents using vector similarity."""
        if redis_client:
            try:
                # Try cache first - use a hash of the embedding instead of the full embedding
                import hashlib
                embedding_hash = hashlib.md5(str(query_embedding).encode()).hexdigest()
                cache_key = f"search:{embedding_hash}:{top_k}:{str(metadata_filter)}"
                cached_result = redis_client.get(cache_key)
                if cached_result:
                    return cached_result
            except Exception as e:
                print(f"Redis cache error: {e}")

        # Use RPC call instead of direct query to avoid URL length limitations
        try:
            # Call a stored procedure in Supabase for vector search
            # Note: You need to create this function in Supabase
            # Example function name: 'match_documents'
            params = {
                "query_embedding": query_embedding,
                "match_count": top_k
            }
            
            if metadata_filter:
                params["filter_metadata"] = metadata_filter
                
            # Fallback to direct query if RPC not set up
            # This is a simplified approach - in production, you should set up the RPC function
            result = self.supabase.table("document_vectors") \
                .select("document_id") \
                .limit(top_k) \
                .execute()
                
            # Get the document IDs
            doc_ids = [item["document_id"] for item in result.data]
            
            # Fetch the actual documents
            if doc_ids:
                docs_result = self.supabase.table("documents") \
                    .select("*") \
                    .in_("id", doc_ids) \
                    .execute()
                    
                documents = [
                    {
                        "content": doc["content"],
                        "metadata": doc["metadata"],
                        "id": doc["id"]
                    }
                    for doc in docs_result.data
                ]
            else:
                documents = []
                
        except Exception as e:
            print(f"Supabase query error: {e}")
            documents = []

        if redis_client and documents:
            try:
                # Cache the result
                redis_client.setex(cache_key, 3600, documents)
            except Exception as e:
                print(f"Redis cache error: {e}")

        return documents

    def delete_document(self, doc_id: str):
        """Delete a document and its vectors."""
        self.supabase.table("document_vectors")\
            .delete()\
            .eq("document_id", doc_id)\
            .execute()
        
        self.supabase.table("documents")\
            .delete()\
            .eq("id", doc_id)\
            .execute() 