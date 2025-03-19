"""
Storage service for handling Supabase storage operations.
Provides functions for bucket management and file uploads.
"""
import base64
import logging
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

from ..core.supabase_client import get_supabase_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def check_bucket_exists(bucket_name: str) -> Tuple[bool, Optional[str]]:
    """
    Check if a bucket exists in Supabase storage.
    
    Args:
        bucket_name: Name of the bucket to check
        
    Returns:
        Tuple[bool, Optional[str]]: (exists, error_message)
    """
    try:
        logger.info("Checking if bucket '%s' exists", bucket_name)
        supabase_client = get_supabase_client()
        
        # Try to list buckets and check if the requested bucket exists
        buckets = supabase_client.storage.list_buckets()
        
        # Check if buckets is a list and handle accordingly
        if isinstance(buckets, list):
            bucket_exists = any(bucket.get('name') == bucket_name 
                                   for bucket in buckets)
            logger.info("Bucket '%s' exists: %s", bucket_name, bucket_exists)
            return bucket_exists, None
        else:
            logger.warning("Unexpected bucket list type: %s", type(buckets))
            return False, "Unexpected response format from Supabase: %s" % type(buckets)
            
    except Exception as e:
        logger.error("Error checking bucket existence: %s", e)
        return False, str(e)


def create_bucket(bucket_name: str, public: bool = False) -> Dict[str, Any]:
    """
    Create a bucket in Supabase storage.
    
    Args:
        bucket_name: Name of the bucket to create
        public: Whether the bucket should be public
        
    Returns:
        Dict[str, Any]: Response with status and message
    """
    try:
        logger.info("Creating bucket '%s' (public: %s)", bucket_name, public)
        supabase_client = get_supabase_client()
        
        # Check if bucket already exists
        bucket_exists, error = check_bucket_exists(bucket_name)
        
        if error:
            logger.warning("Error checking bucket existence: %s", error)
            # Continue with bucket creation attempt even if check fails
        
        if bucket_exists:
            logger.info("Bucket '%s' already exists", bucket_name)
            return {
                "status": "success",
                "message": "Bucket '{}' already exists".format(bucket_name),
                "exists": True
            }
        
        # Create the bucket
        logger.info(f"Creating bucket with name: '{bucket_name}'")
        result = supabase_client.storage.create_bucket(bucket_name)
        
        # Update bucket to be public if requested
        if public:
            update_result = supabase_client.storage.update_bucket(bucket_name, {'public': True})
            logger.debug(f"Bucket updated to public: {update_result}")
        
        logger.info(f"Bucket creation result: {result}")
        return {
            "status": "success",
            "message": f"Bucket '{bucket_name}' created successfully",
            "exists": False
        }
        
    except Exception as e:
        error_str = str(e).lower()
        
        # Check if the error indicates the bucket already exists
        if "already exists" in error_str or "duplicate" in error_str:
            logger.info("Bucket '%s' already exists (from error message)", bucket_name)
            return {
                "status": "success",
                "message": "Bucket '{}' already exists".format(bucket_name),
                "exists": True
            }
        
        logger.error(f"Bucket creation error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


def upload_file(
    file_name: str, 
    file_content_base64: str, 
    content_type: str, 
    case_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Upload a file to Supabase storage.
    
    Args:
        file_name: Name of the file
        file_content_base64: Base64 encoded file content
        content_type: MIME type of the file
        case_id: Optional case ID to associate with the file
        
    Returns:
        Dict[str, Any]: Response with upload status and file information
    """
    try:
        logger.info(f"Starting file upload process for: {file_name}")
        
        # Get Supabase client
        supabase_client = get_supabase_client()
        
        # Decode base64 file content
        try:
            file_content = base64.b64decode(file_content_base64)
            logger.debug(f"Decoded file content, size: {len(file_content)} bytes")
        except Exception as decode_err:
            logger.error(f"Failed to decode base64 content: {decode_err}")
            return {
                "success": False, 
                "error": f"Failed to decode file content: {str(decode_err)}"
            }
        
        # Generate a unique file path with timestamp
        timestamp = int(time.time())
        unique_id = str(uuid.uuid4())[:8]  # Use part of a UUID for uniqueness
        safe_filename = file_name.replace(' ', '_')
        file_path = f"{timestamp}_{unique_id}_{safe_filename}"
        
        logger.info(f"Preparing to upload file: {file_path}")
        
        # Ensure the 'documents' bucket exists
        bucket_result = create_bucket('documents', public=True)
        if bucket_result.get("status") == "error":
            logger.error(f"Failed to ensure bucket exists: {bucket_result.get('error')}")
            return {
                "success": False, 
                "error": f"Failed to ensure storage bucket exists: {bucket_result.get('error')}"
            }
        
        # Upload the file
        try:
            logger.debug("Starting file upload")
            bucket = supabase_client.storage.from_("documents")
            
            # Upload the file
            upload_result = bucket.upload(
                path=file_path,
                file=file_content,
                file_options={"contentType": content_type}
            )
            
            logger.debug(f"Upload complete, result: {upload_result}")
            
            # Try to get the public URL
            try:
                file_url = bucket.get_public_url(file_path)
                logger.info(f"Generated public URL: {file_url}")
            except Exception as url_err:
                logger.warning(f"Could not generate public URL: {url_err}")
                file_url = f"/documents/{file_path}"  # Fallback URL format
            
            # Insert a record in the database
            try:
                logger.info("Inserting document record in database")
                document_data = {
                    "name": file_name,
                    "path": file_path,
                    "content_type": content_type,
                    "url": file_url,
                    "size": len(file_content),
                    "uploaded_at": datetime.now().isoformat(),
                    "case_id": case_id if case_id else None,
                    "metadata": {
                        "original_name": file_name,
                        "upload_source": "api"
                    }
                }
                
                # Insert into documents table
                db_result = supabase_client.table("documents").insert(document_data).execute()
                logger.info(f"Database insert result: {db_result}")
                
                return {
                    "success": True,
                    "fileName": file_name,
                    "filePath": file_path,
                    "fileUrl": file_url,
                    "message": "File uploaded successfully"
                }
                
            except Exception as db_err:
                logger.warning(f"Database insert failed: {db_err}")
                # Continue anyway since the file was uploaded
                return {
                    "success": True,
                    "fileName": file_name,
                    "filePath": file_path,
                    "fileUrl": file_url,
                    "message": "File uploaded successfully, but database record creation failed"
                }
                
        except Exception as upload_err:
            error_msg = str(upload_err)
            logger.error(f"File upload failed: {error_msg}")
            return {"success": False, "error": f"Failed to upload file: {error_msg}"}
            
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Unexpected error in upload process: {error_msg}")
        return {"success": False, "error": f"Upload process failed: {error_msg}"}


def list_bucket_files(bucket_name: str = "documents") -> Dict[str, Any]:
    """
    List all files in a bucket.
    
    Args:
        bucket_name: Name of the bucket to list files from
        
    Returns:
        Dict[str, Any]: Response with list of files
    """
    try:
        logger.info(f"Listing files in bucket '{bucket_name}'")
        supabase_client = get_supabase_client()
        
        # Try to list files in the bucket
        try:
            bucket = supabase_client.storage.from_(bucket_name)
            files = bucket.list()
            
            # Format the response
            file_list = []
            for file in files:
                try:
                    file_url = bucket.get_public_url(file["name"])
                    file_list.append({
                        "name": file["name"],
                        "size": file["metadata"]["size"],
                        "created_at": file["metadata"]["lastModified"],
                        "url": file_url
                    })
                except Exception as file_err:
                    logger.warning(f"Error processing file {file['name']}: {file_err}")
            
            return {
                "status": "success",
                "files": file_list
            }
        except Exception as list_err:
            logger.error(f"Error listing files: {list_err}")
            return {
                "status": "error",
                "error": str(list_err)
            }
    except Exception as e:
        logger.error(f"Bucket list error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
