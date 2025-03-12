"""
Initialize the Supabase database with required tables for Lexpert Case AI.
"""
import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def init_database():
    """Initialize the Supabase database with required tables."""
    print("Initializing Supabase database...")
    
    # Create documents table
    print("Creating 'documents' table...")
    create_documents_table = """
    CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    # Create document_vectors table
    create_vectors_table = """
    CREATE EXTENSION IF NOT EXISTS vector;
    
    CREATE TABLE IF NOT EXISTS document_vectors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id UUID NOT NULL,
        embedding VECTOR(1536) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS document_vectors_embedding_idx ON document_vectors 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    """
    
    # Execute SQL queries using Supabase REST API
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    # Execute documents table creation
    try:
        print("Executing SQL to create documents table...")
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=headers,
            json={"query": create_documents_table}
        )
        
        if response.status_code == 200:
            print("Documents table created successfully.")
        else:
            print(f"Error creating documents table: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Execute document_vectors table creation
    try:
        print("Executing SQL to create document_vectors table...")
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=headers,
            json={"query": create_vectors_table}
        )
        
        if response.status_code == 200:
            print("Document_vectors table created successfully.")
        else:
            print(f"Error creating document_vectors table: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("Database initialization complete.")

if __name__ == "__main__":
    init_database() 