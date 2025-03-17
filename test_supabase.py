import os
import json
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from backend/.env
load_dotenv('backend/.env')

# Supabase credentials - use service key for admin operations
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')

print(f'Using Supabase URL: {url[:10]}... (masked)')
print(f'Service key present: {bool(key)}')

print('Initializing Supabase client...')
supabase = create_client(url, key)
print('Supabase client initialized')

# Test 1: List buckets
print('\n--- Test 1: Listing storage buckets ---')
try:
    buckets = supabase.storage.list_buckets()
    print(f'Success! Found {len(buckets)} buckets:')
    for bucket in buckets:
        print(f"- {bucket['name']}")
except Exception as e:
    print(f'Error listing buckets: {e}')

# Test 2: Create documents bucket if it doesn't exist
print('\n--- Test 2: Creating documents bucket ---')
try:
    # Check if documents bucket exists
    buckets = supabase.storage.list_buckets()
    documents_bucket_exists = any(bucket['name'] == 'documents' for bucket in buckets)
    
    if documents_bucket_exists:
        print('Documents bucket already exists')
    else:
        print('Documents bucket does not exist, creating it...')
        result = supabase.storage.create_bucket(
            id='documents',
            options={"public": False}
        )
        print(f'Bucket creation result: {json.dumps(result, indent=2)}')
        print('Documents bucket created successfully!')
except Exception as e:
    print(f'Error creating documents bucket: {e}')

# Test 3: Upload a test file to the documents bucket
print('\n--- Test 3: Uploading test file ---')
try:
    # Create a simple test file
    with open('test_file.txt', 'w') as f:
        f.write('This is a test file for Supabase storage')
    
    # Upload the file
    with open('test_file.txt', 'rb') as f:
        result = supabase.storage.from_('documents').upload(
            path='test_upload.txt',
            file=f,
            file_options={"content-type": "text/plain"}
        )
    print(f'File upload result: {json.dumps(result, indent=2)}')
    print('Test file uploaded successfully!')
except Exception as e:
    print(f'Error uploading test file: {e}') 