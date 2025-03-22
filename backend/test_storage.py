import os
import base64
import uuid
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Get Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

print(f"[TEST] Supabase URL: {supabase_url[:10]}...")
print(f"[TEST] Supabase Key: {'Present' if supabase_key else 'Missing'}")

# Initialize Supabase client
try:
    supabase = create_client(supabase_url, supabase_key)
    print("[TEST] Supabase client initialized successfully")
except Exception as e:
    print(f"[TEST ERROR] Failed to initialize Supabase client: {e}")
    exit(1)

# Test bucket creation
try:
    print("[TEST] Attempting to create 'documents' bucket")
    supabase.storage.create_bucket("documents")
    print("[TEST] Created 'documents' bucket successfully")
except Exception as e:
    print(f"[TEST] Bucket creation result: {str(e)}")
    print("[TEST] Continuing with upload assuming bucket exists")

# Create a test file
test_content = b"This is a test file for Supabase storage upload"
file_name = f"test_{uuid.uuid4()}.txt"
timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
unique_id = str(uuid.uuid4())[:8]
file_path = f"{timestamp}_{unique_id}_{file_name}"

print(f"[TEST] Preparing to upload file: {file_path}")

# Upload the file
try:
    print("[TEST] Starting file upload")
    # Get a reference to the bucket
    bucket = supabase.storage.from_("documents")
    
    # Upload the file
    upload_result = bucket.upload(
        path=file_path,
        file=test_content,
        file_options={"contentType": "text/plain"}
    )
    
    print(f"[TEST] Upload complete, result: {upload_result}")
    
    # Try to get the public URL
    try:
        file_url = bucket.create_signed_url(file_path, 3600)
        print(f"[TEST] Generated public URL: {file_url}")
    except Exception as url_err:
        print(f"[TEST WARNING] Could not generate public URL: {url_err}")
        file_url = f"/documents/{file_path}"  # Fallback URL format
    
    print("[TEST] Test completed successfully!")
    
except Exception as upload_err:
    print(f"[TEST ERROR] File upload failed: {upload_err}")
