from typing import Dict, Optional
import os
from langchain.text_splitter import TokenTextSplitter
from langchain.storage import LocalFileStore
from langchain.embeddings import CacheBackedEmbeddings
from openai import OpenAI
from langchain_openai import OpenAIEmbeddings
from src.config.settings import (
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    OPENAI_API_KEY
)
from src.db.supabase import SupabaseVectorStore


class RAGPipeline:
    def __init__(self):
        """Initialize the RAG pipeline components."""
        self.text_splitter = TokenTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP
        )
        
        # Initialize OpenAI client instead of Anthropic
        api_key = OPENAI_API_KEY
        if not api_key:
            # Try getting directly from environment if the loaded key is None
            api_key = os.environ.get("OPENAI_API_KEY", "")
            
        print(f"Using OpenAI API key: {api_key[:10]}..."
              f"{api_key[-5:] if api_key else 'None'}")
        self.client = OpenAI(api_key=api_key)
        
        self.vector_store = SupabaseVectorStore()
        
        # Setup embeddings with local file caching
        underlying_embeddings = OpenAIEmbeddings(
            openai_api_key=api_key,
            model="text-embedding-3-small"
        )
        
        # Use local file store for caching
        fs = LocalFileStore("./cache/")
        self.embeddings = CacheBackedEmbeddings.from_bytes_store(
            underlying_embeddings=underlying_embeddings,
            document_embedding_cache=fs,
            namespace="embeddings_cache"
        )

    def process_document(
        self,
        content: str,
        metadata: Dict,
        doc_id: Optional[str] = None
    ) -> str:
        """
        Process a document for storage in the vector database.
        
        Args:
            content: Document text content
            metadata: Document metadata
            doc_id: Optional document ID
            
        Returns:
            Stored document ID
        """
        # Split text into chunks
        chunks = self.text_splitter.split_text(content)
        
        # Get embeddings for chunks
        embeddings = self.embeddings.embed_documents(chunks)
        
        # Store chunks with embeddings
        chunk_ids = []
        for chunk, embedding in zip(chunks, embeddings):
            chunk_id = self.vector_store.store_document(
                content=chunk,
                metadata=metadata,
                embeddings=embedding,
                doc_id=doc_id
            )
            chunk_ids.append(chunk_id)
            
        return chunk_ids[0]  # Return first chunk ID as document ID

    def query(
        self,
        query: str,
        metadata_filter: Optional[Dict] = None
    ) -> Dict:
        """
        Query the RAG system with a user question.
        
        Args:
            query: User question
            metadata_filter: Optional filter for document types
            
        Returns:
            Dict with answer and sources
        """
        # Get query embedding
        query_embedding = self.embeddings.embed_query(query)
        
        # Search for relevant chunks
        results = self.vector_store.similarity_search(
            query_embedding=query_embedding,
            metadata_filter=metadata_filter
        )
        
        # Handle case when no documents are found
        if not results:
            return {
                "answer": "I couldn't find any relevant information in the database "
                          "to answer your question. Please try a different question "
                          "or upload relevant documents first.",
                "sources": []
            }
        
        # Prepare context from chunks
        context = "\n\n".join([
            f"Source {i+1}:\n{doc['content']}"
            for i, doc in enumerate(results)
        ])
        
        # Generate answer with citations using OpenAI instead of Anthropic
        prompt = (
            "You are a legal assistant helping with document analysis. "
            "Use the following sources to answer the question. Include "
            "specific citations to the sources used.\n\n"
            f"Sources:\n{context}\n\n"
            f"Question: {query}\n\n"
            "Answer: Let me help you with that based on the provided sources."
        )
        
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.1
        )
        
        return {
            "answer": response.choices[0].message.content,
            "sources": [
                {
                    "content": doc["content"],
                    "metadata": doc["metadata"]
                }
                for doc in results
            ]
        } 