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
            bucket_exists = any(
                bucket.get('name') == bucket_name for bucket in buckets
            )
            logger.info("Bucket '%s' exists: %s", bucket_name, bucket_exists)
            return bucket_exists, None
        else:
            logger.warning("Unexpected bucket list type: %s", type(buckets))
            return False, ("Unexpected response format from Supabase: %s"
                              % type(buckets))

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
        logger.info("Creating bucket with name: '%s'", bucket_name)
        result = supabase_client.storage.create_bucket(bucket_name)

        # Update bucket to be public if requested
        if public:
            update_result = supabase_client.storage.update_bucket(
                bucket_name, {'public': True}
            )
            logger.debug("Bucket updated to public: %s", update_result)

        logger.info("Bucket creation result: %s", result)
        return {
            "status": "success",
            "message": "Bucket '{}' created successfully".format(bucket_name),
            "exists": False
        }
    except Exception as e:
        error_str = str(e).lower()

        # Check if the error indicates the bucket already exists
        if "already exists" in error_str or "duplicate" in error_str:
            logger.info(
                "Bucket '%s' already exists (from error message)",
                bucket_name)
            return {
                "status": "success",
                "message": "Bucket '{}' already exists".format(
                    bucket_name),
                "exists": True
            }

        logger.error("Bucket creation error: %s", e)
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
        logger.info("Starting file upload process for: %s", file_name)

        # Get Supabase client
        supabase_client = get_supabase_client()

        # Decode base64 file content
        try:
            file_content = base64.b64decode(file_content_base64)
            logger.debug("Decoded file content, size: %d bytes", len(file_content))
        except Exception as decode_err:
            logger.error("Failed to decode base64 content: %s", decode_err)
            return {
                "success": False,
                "error": "Failed to decode file content: {}".format(
                    str(decode_err))
            }
        
        # Generate a unique file path with timestamp
        timestamp = int(time.time())
        unique_id = str(uuid.uuid4())[:8]  # Use part of a UUID for uniqueness
        safe_filename = file_name.replace(' ', '_')
        file_path = "{}_{}_{}".format(timestamp, unique_id, safe_filename)
        logger.info("Preparing to upload file: %s", file_path)

        # Ensure the 'documents' bucket exists
        bucket_result = create_bucket('documents', public=True)
        if bucket_result.get("status") == "error":
            error_msg = bucket_result.get('error')
            logger.error("Failed to ensure bucket exists: %s", error_msg)
            return {
                "success": False,
                "error": "Failed to ensure storage bucket exists: {}".format(
                    error_msg)
            }

        # Upload the file
        try:
            logger.debug("Starting file upload")
            bucket = supabase_client.storage.from_("documents")

            # Handle the upload with proper error checking
            try:
                upload_result = bucket.upload(
                    path=file_path,
                    file=file_content,
                    file_options={"contentType": content_type}
                )
                
                if hasattr(upload_result, 'error') and upload_result.error:
                    raise Exception(f"Upload error: {upload_result.error}")
            except Exception as upload_err:
                logger.error("File upload failed: %s", str(upload_err))
                return {
                    "success": False,
                    "error": f"File upload failed: {str(upload_err)}"
                }

            logger.debug("Upload complete, result: %s", upload_result)

            # Try to get a signed URL (valid for 1 hour)
            try:
                # The Python SDK uses create_signed_url instead of get_public_url
                file_url = bucket.create_signed_url(file_path, 3600)
                logger.info(
                    "Generated signed URL: %s",
                    file_url)
            except Exception as url_err:
                logger.warning("Could not generate signed URL: %s", url_err)
                # Fallback URL format
                file_url = "/documents/{}".format(file_path)

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
                db_result = supabase_client.table("documents").insert(
                    document_data).execute()
                logger.info("Database insert result: %s", db_result)

                return {
                    "success": True,
                    "fileName": file_name,
                    "filePath": file_path,
                    "fileUrl": file_url,
                    "message": "File uploaded successfully"
                }

            except Exception as db_err:
                logger.warning("Database insert failed: %s", db_err)
                # Continue anyway since the file was uploaded
                return {
                    "success": True,
                    "fileName": file_name,
                    "filePath": file_path,
                    "fileUrl": file_url,
                    "message": "File uploaded successfully, but database record "
                               "creation failed"
                }
        except Exception as upload_err:
            error_msg = str(upload_err)
            logger.error("File upload failed: %s", error_msg)
            return {
                "success": False,
                "error": "Failed to upload file: {}".format(error_msg)
            }

    except Exception as e:
        error_msg = str(e)
        logger.error("Unexpected error in upload process: %s", error_msg)
        return {
            "success": False,
            "error": "Upload process failed: {}".format(error_msg)
        }


def list_bucket_files(bucket_name: str = "documents") -> Dict[str, Any]:
    """
    List all files in a bucket.

    Args:
        bucket_name: Name of the bucket to list files from

    Returns:
        Dict[str, Any]: Response with list of files
    """
    try:
        logger.info("Listing files in bucket '%s'", bucket_name)
        supabase_client = get_supabase_client()

        # Try to list files in the bucket
        try:
            # Get the bucket and list files
            bucket = supabase_client.storage.from_(bucket_name)
            response = bucket.list()

            if response.error:
                raise Exception("Error listing files: {}".format(response.error))
            files = response.data if response.data else []

            # Format the response
            file_list = []
            for file in files:
                try:
                    # The Python SDK uses create_signed_url instead of get_public_url
                    # We'll create a URL that expires in 1 hour (3600 seconds)
                    bucket = supabase_client.storage.from_(bucket_name)
                    url_response = bucket.create_signed_url(file["name"], 3600)

                    if url_response.error:
                        logger.warning(
                            "Error creating signed URL for %s: %s",
                            file['name'], url_response.error
                        )
                        url = None
                    else:
                        url = (url_response.data.get('signedUrl')
                              if url_response.data else None)

                    file_list.append({
                        "name": file["name"],
                        "size": file.get("metadata", {}).get("size", 0),
                        "created_at": file.get("metadata", {}).get("lastModified", ""),
                        "url": url
                    })
                except Exception as file_err:
                    logger.warning("Error processing file %s: %s",
                                   file['name'], file_err)

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
