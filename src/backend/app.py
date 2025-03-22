from fastapi import (
    FastAPI, HTTPException, UploadFile, File, Form, 
    Request, Depends
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import time
import uuid
import asyncio

# Import RAG components
from rag.pipeline import (
    process_query, process_document, auto_tag, get_prompt_coach
)

# Import auth middleware
from auth import verify_supabase_jwt

# Import storage management utilities
from storage import (
    check_bucket_exists, create_bucket, setup_bucket_policies,
    create_template_documents_table, list_bucket_files
)


app = FastAPI(title="Lexpert Case AI API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models
class QueryRequest(BaseModel):
    bot_id: str
    prompt: str
    options: Optional[Dict[str, Any]] = {}


class QueryResponse(BaseModel):
    response: str
    sources: List[str] = []
    processing_time: float


class AutoTagRequest(BaseModel):
    content: str


class AutoTagResponse(BaseModel):
    tags: List[str]
    confidence: float


class PromptCoachRequest(BaseModel):
    prompt: str


class PromptCoachResponse(BaseModel):
    tooltip: Optional[str] = None


# Storage management models
class BucketRequest(BaseModel):
    bucketName: str


class BucketResponse(BaseModel):
    exists: bool
    message: str
    error: Optional[str] = None


# Authentication dependency
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    
    token = auth_header.split(" ")[1]
    user_data = await verify_supabase_jwt(token)
    return user_data


# Public routes
@app.get("/")
async def root():
    return {"message": "Lexpert Case AI API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Protected routes
@app.post("/api/rag", response_model=QueryResponse)
async def query_rag(
    request: QueryRequest, user: dict = Depends(get_current_user)
):
    start_time = time.time()
    
    # In a real implementation, this would call the RAG pipeline
    # For now, we'll use our mock implementation
    response, sources = process_query(
        request.bot_id, request.prompt, request.options
    )
    
    processing_time = time.time() - start_time
    
    return QueryResponse(
        response=response,
        sources=sources,
        processing_time=processing_time
    )


@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    bot_id: str = Form(...),
    metadata: str = Form(...),
    user: dict = Depends(get_current_user)
):
    try:
        # Parse metadata
        metadata_dict = json.loads(metadata)
        
        # Generate a unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Save file to temporary location
        temp_file_path = f"temp/{unique_filename}"
        os.makedirs("temp", exist_ok=True)
        
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process the document
        document_id = process_document(
            bot_id, temp_file_path, file.filename, metadata_dict
        )
        
        # Clean up temporary file
        os.remove(temp_file_path)
        
        return {
            "success": True,
            "document_id": document_id,
            "filename": unique_filename,
            "message": (
                f"Document {file.filename} uploaded and processed successfully"
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auto-tag", response_model=AutoTagResponse)
async def get_auto_tags(
    request: AutoTagRequest, user: dict = Depends(get_current_user)
):
    # Use our auto_tag function
    tags, confidence = auto_tag(request.content)
    
    return AutoTagResponse(tags=tags, confidence=confidence)


@app.post("/api/prompt-coach", response_model=PromptCoachResponse)
async def prompt_coach(
    request: PromptCoachRequest, user: dict = Depends(get_current_user)
):
    # Use our get_prompt_coach function
    tooltip = get_prompt_coach(request.prompt)
    
    return PromptCoachResponse(tooltip=tooltip)


# Storage management routes
@app.post("/api/check-bucket-exists")
async def check_bucket_exists_endpoint(request: BucketRequest):
    result = await check_bucket_exists(request.bucketName)
    return result


@app.post("/api/create-bucket")
async def create_bucket_endpoint(request: BucketRequest):
    result = await create_bucket(request.bucketName)
    return result


@app.post("/api/setup-bucket-policies")
async def setup_bucket_policies_endpoint(request: BucketRequest):
    result = await setup_bucket_policies(request.bucketName)
    return result


@app.post("/api/create-template-documents-table")
async def create_template_documents_table_endpoint():
    result = await create_template_documents_table()
    return result


@app.get("/api/list-bucket-files")
async def list_bucket_files_endpoint():
    result = await list_bucket_files("documents")
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 