"""
Pydantic models for API request and response schemas.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class MessageRequest(BaseModel):
    """Request model for chat messages"""
    text: str
    botId: Optional[str] = None


class MessageResponse(BaseModel):
    """Response model for chat messages"""
    text: str
    citation: Optional[str] = None


class BucketRequest(BaseModel):
    """Request model for bucket operations"""
    bucketName: str
    public: bool = False


class BucketResponse(BaseModel):
    """Response model for bucket operations"""
    status: str
    message: Optional[str] = None
    error: Optional[str] = None
    exists: Optional[bool] = None
    bucketId: Optional[str] = None


class FileUploadRequest(BaseModel):
    """Request model for file uploads"""
    fileName: str
    fileContent: str  # Base64 encoded file content
    contentType: str
    caseId: Optional[str] = None


class FileUploadResponse(BaseModel):
    """Response model for file uploads"""
    success: bool
    fileName: Optional[str] = None
    filePath: Optional[str] = None
    fileUrl: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


class DocumentMetadata(BaseModel):
    """Model for document metadata"""
    original_name: str
    upload_source: str
    tag: Optional[str] = None


class Document(BaseModel):
    """Model for document records"""
    name: str
    path: str
    content_type: str
    url: str
    size: int
    uploaded_at: str
    case_id: Optional[str] = None
    metadata: DocumentMetadata


class Bot(BaseModel):
    """Model for bot data"""
    id: str
    name: str
    description: str
    lastActive: str
