"""
API routes for storage operations.
"""
import logging
from fastapi import APIRouter, Body, HTTPException

from ...models.schemas import BucketRequest, BucketResponse, FileUploadRequest, FileUploadResponse
from ...services.storage_service import check_bucket_exists, create_bucket, upload_file, list_bucket_files

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api", tags=["storage"])


@router.post("/check-bucket-exists", response_model=BucketResponse)
async def api_check_bucket_exists(request: BucketRequest = Body(...)):
    """
    Check if a bucket exists in Supabase storage.
    
    Args:
        request: BucketRequest with bucket name
        
    Returns:
        BucketResponse: Response with status and existence
    """
    try:
        bucket_exists, error = check_bucket_exists(request.bucketName)
        
        if error:
            logger.error(f"Bucket check error: {error}")
            return BucketResponse(
                status="error",
                error=str(error)
            )
        
        return BucketResponse(
            status="success",
            exists=bucket_exists
        )
    except Exception as e:
        logger.error(f"Bucket check error: {e}")
        return BucketResponse(
            status="error",
            error=str(e)
        )


@router.post("/create-bucket", response_model=BucketResponse)
async def api_create_bucket(request: BucketRequest = Body(...)):
    """
    Create a bucket in Supabase storage.
    
    Args:
        request: BucketRequest with bucket name and public flag
        
    Returns:
        BucketResponse: Response with status and message
    """
    try:
        result = create_bucket(request.bucketName, request.public)
        
        # Convert the result to match our response model
        response = BucketResponse(
            status=result.get("status", "error"),
            message=result.get("message"),
            error=result.get("error"),
            exists=result.get("exists"),
            bucketId=request.bucketName if result.get("status") == "success" else None
        )
        
        return response
    except Exception as e:
        logger.error(f"Bucket creation error: {e}")
        return BucketResponse(
            status="error",
            error=str(e)
        )


@router.post("/upload-file", response_model=FileUploadResponse)
async def api_upload_file(request: FileUploadRequest = Body(...)):
    """
    Upload a file to Supabase storage.
    
    Args:
        request: FileUploadRequest with file details
        
    Returns:
        FileUploadResponse: Response with upload status
    """
    try:
        result = upload_file(
            request.fileName,
            request.fileContent,
            request.contentType,
            request.caseId
        )
        
        # Convert the result to match our response model
        response = FileUploadResponse(
            success=result.get("success", False),
            fileName=result.get("fileName"),
            filePath=result.get("filePath"),
            fileUrl=result.get("fileUrl"),
            message=result.get("message"),
            error=result.get("error")
        )
        
        return response
    except Exception as e:
        logger.error(f"File upload error: {e}")
        return FileUploadResponse(
            success=False,
            error=str(e)
        )


@router.get("/list-bucket-files")
async def api_list_bucket_files():
    """
    List all files in the 'documents' bucket.
    
    Returns:
        Dict: Response with list of files
    """
    try:
        result = list_bucket_files("documents")
        return result
    except Exception as e:
        logger.error(f"Bucket list error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
