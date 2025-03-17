import json
import os
import random
import time
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
    allow_origins=["http://localhost:5173"],
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
            buckets = client.storage.list_buckets()
            buckets_json = json.dumps(buckets, indent=2)
            print(f"[DEBUG] Retrieved buckets: {buckets_json}")
            
            bucket_exists = any(bucket['name'] == bucket_name for bucket in buckets)
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
        
        # Try multiple approaches to create the bucket
        print(f"[DEBUG] Creating bucket with name: '{bucket_name}'")
        
        try:
            # Try with the 'name' parameter as per Supabase API docs
            result = client.storage.create_bucket(
                name=bucket_name,
                options={"public": False}
            )
            print(f"[DEBUG] Bucket created successfully using 'name' parameter")
        except Exception as e1:
            print(f"[DEBUG] First bucket creation attempt failed: {e1}")
            
            try:
                # Try with 'id' parameter
                result = client.storage.create_bucket(
                    id=bucket_name,
                    options={"public": False}
                )
                print(f"[DEBUG] Bucket created successfully using 'id' parameter")
            except Exception as e2:
                print(f"[DEBUG] Second bucket creation attempt failed: {e2}")
                
                try:
                    # Try with positional parameters
                    result = client.storage.create_bucket(bucket_name, {"public": False})
                    print(f"[DEBUG] Bucket created successfully using positional parameters")
                except Exception as e3:
                    print(f"[ERROR] All bucket creation attempts failed: {e3}")
                    raise Exception(f"Failed to create bucket: {e3}")
        
        return {
            "status": "success",
            "message": f"Bucket '{bucket_name}' created successfully",
            "bucketId": bucket_name
        }
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
        client = get_supabase_client()
        
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
        # Get Supabase client with service role permissions
        client = get_supabase_client()
        
        # Check if bucket already exists
        try:
            buckets = client.storage.list_buckets()
            bucket_exists = any(bucket['name'] == request.bucketName for bucket in buckets)
            
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
                result = client.storage.create_bucket(
                    request.bucketName, 
                    {'public': request.public}
                )
                
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
                result = client.storage.create_bucket(
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
        # Get Supabase client with service role permissions
        client = get_supabase_client()
        
        # Check if the documents bucket exists, create it if not
        try:
            buckets = client.storage.list_buckets()
            bucket_exists = any(bucket['name'] == 'documents' for bucket in buckets)
            
            if not bucket_exists:
                print("[INFO] 'documents' bucket does not exist, creating it")
                client.storage.create_bucket('documents', {'public': False})
                print("[INFO] 'documents' bucket created successfully")
        except Exception as bucket_err:
            print(f"[ERROR] Error checking/creating bucket: {bucket_err}")
            # Continue anyway, the upload might still work
        
        # Decode base64 file content
        import base64
        file_content = base64.b64decode(request.fileContent)
        
        # Generate a unique file path with timestamp
        import time
        timestamp = int(time.time())
        file_path = f"{timestamp}-{request.fileName.replace(' ', '_')}"
        
        print(f"[DEBUG] Uploading file to 'documents' bucket: {file_path}")
        
        # Upload file to the documents bucket
        upload_result = client.storage.from_("documents").upload(
            file_path,
            file_content,
            file_options={"contentType": request.contentType}
        )
        
        # Check for upload errors
        if isinstance(upload_result, dict) and upload_result.get('error'):
            print(f"[ERROR] File upload failed: {upload_result['error']}")
            raise Exception(f"File upload failed: {upload_result['error']}")
            
        # Get the public URL for the file
        file_url = client.storage.from_("documents").get_public_url(file_path)
        
        # Insert record into documents table
        db_result = client.table('documents').insert({
            'name': request.fileName,
            'path': file_path,
            'content_type': request.contentType,
            'created_at': datetime.now().isoformat(),
            'url': file_url
        }).execute()
        
        if hasattr(db_result, 'error') and db_result.error:
            print(f"[WARNING] File uploaded but database record creation failed: {db_result.error}")
        
        return {
            "status": "success",
            "message": "File uploaded successfully",
            "path": file_path,
            "url": file_url
        }
    except Exception as e:
        print(f"[ERROR] File upload error: {e}")
        return {
            "status": "error",
            "message": f"Failed to upload file: {str(e)}",
            "error": str(e)
        }



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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
