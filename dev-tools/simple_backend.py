"""
Simple backend server for Lexpert Case AI
This is a minimal implementation to get the application running
without Redis or complex authentication dependencies
"""
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from frontend .env file
load_dotenv(dotenv_path='../src/frontend/.env')

# For debugging
print("Environment variables loaded from frontend .env file")

# Initialize Supabase client
# Try to get from environment, fallback to VITE_ prefixed variables for frontend compatibility
supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("VITE_SUPABASE_KEY")

print(f"Supabase URL: {supabase_url[:15]}... (truncated)")
print(f"Supabase Key: {supabase_key[:10]}... (truncated)")

if not supabase_url or not supabase_key:
    raise ValueError("Supabase credentials not found in environment variables")

supabase = create_client(supabase_url, supabase_key)

app = FastAPI(title="Lexpert Case AI Simple Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class BucketRequest(BaseModel):
    bucketName: str

class BucketResponse(BaseModel):
    exists: bool
    error: Optional[str] = None

# Routes
@app.get("/")
async def root():
    return {"message": "Lexpert Case AI Simple Backend"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/check-bucket-exists")
async def check_bucket_exists(request: BucketRequest):
    """Check if a storage bucket exists in Supabase"""
    try:
        # List all buckets
        buckets_response = supabase.storage.list_buckets()
        
        if buckets_response.error:
            return BucketResponse(exists=False, error=str(buckets_response.error))
        
        # Check if the requested bucket exists
        bucket_exists = any(bucket.name == request.bucketName for bucket in buckets_response.data)
        
        return BucketResponse(exists=bucket_exists)
    except Exception as e:
        return BucketResponse(exists=False, error=str(e))

@app.post("/api/create-bucket")
async def create_bucket(request: BucketRequest):
    """Create a new storage bucket in Supabase"""
    try:
        # Create the bucket
        response = supabase.storage.create_bucket(
            request.bucketName,
            {"public": True}
        )
        
        if response.error:
            # Check if error is because bucket already exists
            if "already exists" in str(response.error):
                return BucketResponse(exists=True)
            return BucketResponse(exists=False, error=str(response.error))
        
        return BucketResponse(exists=True)
    except Exception as e:
        return BucketResponse(exists=False, error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("simple_backend:app", host="0.0.0.0", port=8000, reload=True)
