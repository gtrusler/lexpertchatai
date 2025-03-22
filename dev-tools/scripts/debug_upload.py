#!/usr/bin/env python
"""
Debug script for testing Supabase document uploads.
This script tests both bucket creation and file uploads to isolate issues.
"""
import os
import time
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from backend/.env
load_dotenv('backend/.env')

# Get Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    print("Error: Missing Supabase environment variables")
    print("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file")
    exit(1)

print(f"[DEBUG] Supabase URL: {supabase_url}")
print(f"[DEBUG] Supabase Key: {supabase_key[:10]}...")

# Initialize Supabase client
try:
    print("[DEBUG] Initializing Supabase client")
    print(f"[DEBUG] Using URL: {supabase_url}")
    # Only show first 10 chars of key for security
    print(f"[DEBUG] Using key starting with: {supabase_key[:10]}...")
    supabase: Client = create_client(supabase_url, supabase_key)
    print("[DEBUG] Supabase client initialized successfully")
except Exception as e:
    print(f"[ERROR] Failed to initialize Supabase client: {e}")
    exit(1)

# Test function to check if bucket exists
def check_bucket_exists(bucket_name):
    print(f"[DEBUG] Checking if bucket '{bucket_name}' exists")
    try:
        buckets = supabase.storage.list_buckets()
        print(f"[DEBUG] Retrieved buckets: {json.dumps(buckets, indent=2)}")
        
        bucket_exists = any(bucket['name'] == bucket_name for bucket in buckets)
        print(f"[DEBUG] Bucket '{bucket_name}' exists: {bucket_exists}")
        return bucket_exists
    except Exception as e:
        print(f"[ERROR] Failed to check bucket existence: {e}")
        return False

# Test function to create bucket
def create_bucket(bucket_name):
    print(f"[DEBUG] Creating bucket '{bucket_name}'")
    try:
        # Explicitly pass the bucket name as a string
        options = {'public': False}
        print(f"[DEBUG] Bucket name type: {type(bucket_name).__name__}")
        print(f"[DEBUG] Options: {options}")
        
        # Try the create_bucket method with different parameter formats
        try:
            result = supabase.storage.create_bucket(bucket_name, options)
            print(f"[DEBUG] Bucket creation result: {json.dumps(result, indent=2)}")
            return True
        except Exception as e1:
            print(f"[DEBUG] First attempt failed: {e1}")
            
            # Try alternative API format
            try:
                result = supabase.storage.create_bucket(id=bucket_name, options=options)
                print(f"[DEBUG] Bucket creation result: {json.dumps(result, indent=2)}")
                return True
            except Exception as e2:
                print(f"[DEBUG] Second attempt failed: {e2}")
                raise e2
    except Exception as e:
        print(f"[ERROR] Failed to create bucket: {e}")
        return False

# Test function to upload file
def upload_file(bucket_name, file_path, file_name):
    print(f"[DEBUG] Uploading file '{file_path}' to bucket '{bucket_name}' as '{file_name}'")
    try:
        with open(file_path, 'rb') as f:
            file_content = f.read()
            
        result = supabase.storage.from_(bucket_name).upload(file_name, file_content)
        print(f"[DEBUG] File upload result: {json.dumps(result, indent=2)}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to upload file: {e}")
        return False

# Test function to insert document record
def insert_document_record(name, path):
    print(f"[DEBUG] Inserting document record: name='{name}', path='{path}'")
    try:
        result = supabase.table('documents').insert({
            'name': name,
            'path': path,
            'created_at': 'now()'
        }).execute()
        print(f"[DEBUG] Document record insertion result: {json.dumps(result.data, indent=2)}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to insert document record: {e}")
        return False

# Main test flow
def run_tests():
    bucket_name = "documents"
    test_file_path = "debug_upload.py"  # Use this script as test file
    test_file_name = f"{int(time.time())}_test_upload.py"
    
    print("\n=== STARTING DOCUMENT UPLOAD TESTS ===\n")
    
    # Test 1: Check if bucket exists
    print("\n--- Test 1: Check if bucket exists ---")
    bucket_exists = check_bucket_exists(bucket_name)
    
    # Test 2: Create bucket if it doesn't exist
    if not bucket_exists:
        print("\n--- Test 2: Create bucket ---")
        bucket_created = create_bucket(bucket_name)
        if not bucket_created:
            print("[ERROR] Failed to create bucket, stopping tests")
            return
    else:
        print("\n--- Test 2: Bucket already exists, skipping creation ---")
    
    # Test 3: Upload file
    print("\n--- Test 3: Upload file ---")
    file_uploaded = upload_file(bucket_name, test_file_path, test_file_name)
    if not file_uploaded:
        print("[ERROR] Failed to upload file, stopping tests")
        return
    
    # Test 4: Insert document record
    print("\n--- Test 4: Insert document record ---")
    record_inserted = insert_document_record(test_file_name, test_file_name)
    if not record_inserted:
        print("[ERROR] Failed to insert document record")
    
    print("\n=== DOCUMENT UPLOAD TESTS COMPLETED ===\n")

if __name__ == "__main__":
    run_tests()
