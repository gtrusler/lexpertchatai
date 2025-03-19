import json
import os
import random
import time
import base64
import uuid
from datetime import datetime

from dotenv import load_dotenv
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import Client, create_client
from typing import Optional

# Load environment variables
load_dotenv()

# Get Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

# Initialize Supabase client
supabase: Client = None

def get_supabase_client() -> Client:
    """Get or initialize the Supabase client with proper error handling"""
    global supabase
    
    # Return existing client if already initialized
    if supabase is not None:
        return supabase
    
    try:
        # Print credentials for debugging (masked for security)
        url_debug = supabase_url[:10] + "..." if supabase_url else "None"
        key_debug = "Present" if supabase_key else "None"
        print("[DEBUG] Supabase credentials: "
              f"URL={url_debug}, Key={key_debug}")
        
        if not supabase_url or not supabase_key:
            print("[ERROR] Missing Supabase credentials")
            raise ValueError("Missing Supabase credentials")
        
        supabase = create_client(supabase_url, supabase_key)
        print("[INFO] Supabase client initialized successfully")
        return supabase
    except Exception as e:
        print(f"[ERROR] Failed to initialize Supabase client: {e}")
        raise

app = FastAPI(title="Lexpert Case AI API")


# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for legal citations
LEGAL_CITATIONS = [
    "Texas §153.002, p. 2",
    "Texas Family Code §153.131",
    "Texas §153.134(a)",
    "Trademark Manual of Examining Procedure §1202.02",
    "15 U.S.C. §1052(e)(1)"
]

class MessageRequest(BaseModel):
    text: str
    botId: Optional[str] = None





class MessageResponse(BaseModel):
    text: str
    citation: Optional[str] = None




@app.get("/")
def read_root():
    return {"status": "Lexpert Case AI API is running"}


class BucketRequest(BaseModel):
    bucketName: str
    public: bool = False  # Whether the bucket should be public


class FileUploadRequest(BaseModel):
    fileName: str
    fileContent: str  # Base64 encoded file content
    contentType: str
    caseId: Optional[str] = None


@app.post("/api/create-bucket")
async def create_bucket(request: BucketRequest = Body(...)):
    """Create a storage bucket in Supabase"""
    bucket_name = request.bucketName
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    print(f"[DEBUG] Attempting to create bucket '{bucket_name}' at {timestamp}")
    
    # Validate bucket name
    if not isinstance(bucket_name, str):
        print(f"[ERROR] Invalid bucket name type: {type(bucket_name)}")
        return {
            "status": "error",
            "message": f"Bucket name must be a string, got {type(bucket_name)}",
            "error": "Invalid bucket name type"
        }
    
    try:
        # Get the Supabase client
        client = get_supabase_client()
        
        # Check if the bucket already exists
        try:
            print(f"[DEBUG] Checking if bucket '{bucket_name}' exists")
            buckets = supabase_client.storage.list_buckets()
            
            # Check if buckets is a list or dictionary
            if isinstance(buckets, list):
                bucket_exists = any(bucket.get('name') == bucket_name for bucket in buckets)
            else:
                print(f"[DEBUG] Unexpected buckets response type: {type(buckets)}")
                bucket_exists = False
                
            if bucket_exists:
                print(f"[DEBUG] Bucket '{bucket_name}' already exists")
                return {
                    "status": "success",
                    "message": f"Bucket '{bucket_name}' already exists",
                    "bucketId": bucket_name
                }
        except Exception as e:
            print(f"[DEBUG] Error checking bucket existence: {e}")
            # Continue with bucket creation attempt even if check fails
        
        # Simplified bucket creation approach
        print(f"[DEBUG] Creating bucket with name: '{bucket_name}'")
        
        try:
            # Direct approach with proper parameters
            storage = client.storage
            result = storage.create_bucket(bucket_name)
            print(f"[DEBUG] Bucket created successfully")
            
            return {
                "status": "success",
                "message": f"Bucket '{bucket_name}' created successfully",
                "bucketId": bucket_name
            }
        except Exception as e:
            print(f"[ERROR] Bucket creation failed: {e}")
            
            # Check if the error indicates the bucket already exists
            error_str = str(e).lower()
            if "already exists" in error_str or "duplicate" in error_str:
                print(f"[INFO] Bucket '{bucket_name}' already exists (from error message)")
                return {
                    "status": "success",
                    "message": f"Bucket '{bucket_name}' already exists",
                    "bucketId": bucket_name
                }
            
            raise Exception(f"Failed to create bucket: {e}")
    except Exception as e:
        print(f"[ERROR] Failed to create bucket: {e}")
        return {
            "status": "error",
            "message": f"Failed to create bucket: {str(e)}",
            "error": str(e)
        }


@app.post("/api/check-bucket-exists")
async def check_bucket_exists(request: BucketRequest = Body(...)):
    """Check if a bucket exists in Supabase storage using the service role key"""
    try:
        # Get Supabase client with service role permissions
        supabase_client = get_supabase_client()
        print(f"[DEBUG] Supabase client type: {type(supabase_client)}")
        
        # Try to get bucket info - if it doesn't exist, this will throw an exception
        try:
            # Just try to access the bucket directly
            bucket_info = client.storage.get_bucket(request.bucketName)
            bucket_exists = True
            print(f"[INFO] Bucket '{request.bucketName}' exists")
        except Exception as bucket_err:
            print(f"[INFO] Bucket '{request.bucketName}' does not exist: {bucket_err}")
            bucket_exists = False
        
        return {
            "status": "success",
            "exists": bucket_exists
        }
    except Exception as e:
        print(f"[ERROR] Bucket check error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


@app.post("/api/create-bucket")
async def create_bucket(request: BucketRequest = Body(...)):
    """Create a bucket in Supabase storage using the service role key"""
    try:
        # Debug the request object
        print(f"[DEBUG] Bucket request: {request}")
        print(f"[DEBUG] Bucket name: {request.bucketName}")
        print(f"[DEBUG] Public flag: {request.public}")
        
        # Get Supabase client with service role permissions
        supabase_client = get_supabase_client()
        print(f"[DEBUG] Supabase client type: {type(supabase_client)}")
        
        # Check if bucket already exists
        try:
            buckets = supabase_client.storage.list_buckets()
            print(f"[DEBUG] Buckets: {buckets}")
            
            # Check if buckets is a list and handle accordingly
            if isinstance(buckets, list):
                bucket_exists = any(bucket.get('name') == request.bucketName for bucket in buckets)
            else:
                print(f"[WARNING] Unexpected bucket list type: {type(buckets)}")
                bucket_exists = False
            
            if bucket_exists:
                print(f"[INFO] Bucket '{request.bucketName}' already exists")
                return {
                    "status": "success",
                    "message": f"Bucket '{request.bucketName}' already exists",
                    "exists": True
                }
            else:
                # Bucket doesn't exist, create it
                print(f"[INFO] Creating bucket '{request.bucketName}'")
                
                # Ensure bucket name is a string and create proper parameters
                bucket_name = str(request.bucketName)
                
                # Debug the parameters being sent
                print(f"[DEBUG] Creating bucket with name: '{bucket_name}'")
                print(f"[DEBUG] Public flag: {bool(request.public)}")
                
                # Create the bucket with name parameter only first
                try:
                    result = supabase_client.storage.create_bucket(bucket_name)
                    print(f"[DEBUG] Bucket created with name only: {result}")
                    
                    # Update bucket to be public if requested
                    if request.public:
                        update_result = supabase_client.storage.update_bucket(bucket_name, {'public': True})
                        print(f"[DEBUG] Bucket updated to public: {update_result}")
                except Exception as bucket_err:
                    print(f"[ERROR] Bucket creation error details: {bucket_err}")
                    raise bucket_err
                
                print(f"[INFO] Bucket creation result: {result}")
                return {
                    "status": "success",
                    "message": f"Bucket '{request.bucketName}' created successfully",
                    "exists": False
                }
        except Exception as bucket_err:
            print(f"[ERROR] Error checking bucket existence: {bucket_err}")
            # Try to create the bucket anyway
            try:
                print(f"[INFO] Attempting to create bucket '{request.bucketName}'")
                result = supabase_client.storage.create_bucket(
                    request.bucketName, 
                    {'public': request.public}
                )
                
                print(f"[INFO] Bucket creation result: {result}")
                return {
                    "status": "success",
                    "message": f"Bucket '{request.bucketName}' created successfully",
                    "exists": False
                }
            except Exception as create_err:
                print(f"[ERROR] Failed to create bucket: {create_err}")
                raise create_err
    except Exception as e:
        print(f"[ERROR] Bucket creation error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


@app.post("/api/upload-file")
async def upload_file(request: FileUploadRequest = Body(...)):
    """Upload a file to Supabase storage using the service role key"""
    try:
        print(f"[INFO] Starting file upload process for: {request.fileName}")
        
        # Get Supabase client with service role permissions
        supabase_client = get_supabase_client()
        print(f"[DEBUG] Supabase client type: {type(supabase_client)}")
        
        # Decode base64 file content first to fail early if there's an issue
        import base64
        try:
            file_content = base64.b64decode(request.fileContent)
            print(f"[DEBUG] Decoded file content, size: {len(file_content)} bytes")
        except Exception as decode_err:
            print(f"[ERROR] Failed to decode base64 content: {decode_err}")
            return {"success": False, "error": f"Failed to decode file content: {str(decode_err)}"}
        
        # Generate a unique file path with timestamp
        import time
        import uuid
        timestamp = int(time.time())
        unique_id = str(uuid.uuid4())[:8]  # Use part of a UUID for uniqueness
        safe_filename = request.fileName.replace(' ', '_')
        file_path = f"{timestamp}_{unique_id}_{safe_filename}"
        
        print(f"[INFO] Preparing to upload file: {file_path}")
        
        # Direct approach to ensure bucket exists
        storage = supabase_client.storage
        print(f"[DEBUG] Storage object type: {type(storage)}")
        
        # First, check if the bucket exists before trying to create it
        try:
            print("[INFO] Checking if 'documents' bucket exists")
            buckets = storage.list_buckets()
            
            # Check if buckets is iterable and has the expected structure
            if not isinstance(buckets, list):
                print(f"[WARNING] Unexpected bucket list type: {type(buckets)}")
                bucket_exists = False
            else:
                # Safely check for bucket existence
                bucket_exists = False
                for bucket in buckets:
                    if isinstance(bucket, dict) and bucket.get('name') == 'documents':
                        bucket_exists = True
                        break
                    elif hasattr(bucket, 'name') and bucket.name == 'documents':
                        bucket_exists = True
                        break
            
            if not bucket_exists:
                print("[INFO] 'documents' bucket does not exist, creating it")
                # Create the bucket with public access
                supabase_client.storage.create_bucket('documents', {'public': True})
                print("[INFO] Created 'documents' bucket successfully")
            else:
                print("[INFO] 'documents' bucket already exists")
        except Exception as e:
            print(f"[WARNING] Bucket check/creation error: {str(e)}")
            # If the error message suggests the bucket already exists, continue
            if "already exists" in str(e).lower():
                print("[INFO] Bucket appears to already exist based on error message")
            else:
                print("[INFO] Will attempt to use the bucket anyway")
        
        # Now upload the file
        try:
            print("[DEBUG] Starting file upload")
            # Get a reference to the bucket
            bucket = supabase_client.storage.from_("documents")
            
            # Debug bucket object type
            print(f"[DEBUG] Bucket object type: {type(bucket)}")
            print(f"[DEBUG] Bucket object dir: {dir(bucket)}")
            
            # Upload the file
            print(f"[DEBUG] Uploading file with path: {file_path}, content length: {len(file_content)}")
            upload_result = bucket.upload(
                path=file_path,
                file=file_content,
                file_options={"contentType": request.contentType}
            )
            print(f"[DEBUG] Upload method completed without exception")
            
            print(f"[DEBUG] Upload complete, result: {upload_result}")
            
            # Try to get the public URL
            try:
                file_url = bucket.get_public_url(file_path)
                print(f"[INFO] Generated public URL: {file_url}")
            except Exception as url_err:
                print(f"[WARNING] Could not generate public URL: {url_err}")
                file_url = f"/documents/{file_path}"  # Fallback URL format
            
            # Insert a record in the database
            try:
                print("[INFO] Inserting document record in database")
                document_data = {
                    "name": request.fileName,
                    "path": file_path,
                    "content_type": request.contentType,
                    "url": file_url,
                    "size": len(file_content),
                    "uploaded_at": datetime.now().isoformat(),
                    "case_id": request.caseId if request.caseId else None,
                    "metadata": {
                        "original_name": request.fileName,
                        "upload_source": "chat"
                    }
                }
                
                # Insert into documents table
                db_result = supabase_client.table("documents").insert(document_data).execute()
                print(f"[INFO] Database insert result: {db_result}")
                
                return {
                    "success": True,
                    "fileName": request.fileName,
                    "filePath": file_path,
                    "fileUrl": file_url,
                    "message": "File uploaded successfully"
                }
                
            except Exception as db_err:
                print(f"[WARNING] Database insert failed: {db_err}")
                # Continue anyway since the file was uploaded
                return {
                    "success": True,
                    "fileName": request.fileName,
                    "filePath": file_path,
                    "fileUrl": file_url,
                    "message": "File uploaded successfully, but database record creation failed"
                }
                
        except Exception as upload_err:
            error_msg = str(upload_err)
            print(f"[ERROR] File upload failed: {error_msg}")
            return {"success": False, "error": f"Failed to upload file: {error_msg}"}
            
    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Unexpected error in upload process: {error_msg}")
        return {"success": False, "error": f"Upload process failed: {error_msg}"}



@app.post("/chat", response_model=MessageResponse)
async def chat(request: MessageRequest):
    """
    Process a chat message and return a response.
    Simulates a 3-5s response time for realistic AI processing.
    """
    if not request.text:
        raise HTTPException(status_code=400, detail="Message text cannot be empty")

    # Simulate processing time (3-5s)
    processing_time = random.uniform(3, 5)
    time.sleep(processing_time)

    # Generate a mock response
    response_text = f"Here's information related to your query about '{request.text}'."

    # Add some legal context based on keywords
    if "custody" in request.text.lower():
        response_text += "In child custody cases, the court's primary consideration is the best interest of the child."
        citation = LEGAL_CITATIONS[0]
    elif "temporary" in request.text.lower():
        response_text += "Temporary orders can be issued to establish temporary custody, visitation, and support."
        citation = LEGAL_CITATIONS[1]
    elif "trademark" in request.text.lower():
        response_text += "Trademark applications must meet distinctiveness requirements and avoid likelihood of confusion."
        citation = LEGAL_CITATIONS[3]
    else:
        response_text += "Please provide more specific details about your legal question for a more targeted response."
        citation = random.choice(LEGAL_CITATIONS)

    return MessageResponse(text=response_text, citation=citation)

@app.get("/bots")
async def get_bots():
    """Return a list of available case bots"""
    return [
        {"id": "1", "name": "Weyl Bot", "description": "Family law case for Weyl", "lastActive": "2 hours ago"},
        {"id": "2", "name": "Trademark Bot", "description": "Trademark office action", "lastActive": "1 day ago"},
        {"id": "3", "name": "Holly vs. Waytt", "description": "CPS reports case", "lastActive": "3 days ago"},
    ]

@app.get("/api/list-bucket-files")
async def list_bucket_files():
    """List all files in the 'documents' bucket"""
    try:
        # Get Supabase client with service role permissions
        supabase_client = get_supabase_client()
        
        # Try to list files in the documents bucket
        try:
            bucket = supabase_client.storage.from_("documents")
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
                    print(f"[WARNING] Error processing file {file['name']}: {file_err}")
            
            return {
                "status": "success",
                "files": file_list
            }
        except Exception as list_err:
            print(f"[ERROR] Error listing files: {list_err}")
            return {
                "status": "error",
                "error": str(list_err)
            }
    except Exception as e:
        print(f"[ERROR] Bucket list error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
