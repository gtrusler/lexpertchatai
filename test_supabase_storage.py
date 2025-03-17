from supabase import create_client

# Supabase credentials
url = 'https://xjennkhbfetektomwzhy.supabase.co'
# Split long key into multiple lines
key = (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZW5u'
    'a2hiZmV0ZWt0b213emh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MTE2MzQsImV4cCI6MjA1NT'
    'k4NzYzNH0.fyUKzNgJSkYtvh3HvPAmZls7uhI_p4xfeFoctC1xfGg'
)

print('Initializing Supabase client...')
supabase = create_client(url, key)
print('Supabase client initialized')

# Test if the documents table exists and has the expected schema
print('\nChecking documents table schema...')
try:
    # Get the first document to check its structure
    response = supabase.table('documents').select('*').limit(1).execute()
    if response.data:
        doc = response.data[0]
        print('Document structure:', doc.keys())
    else:
        print('No documents found in the table')
except Exception as e:
    print('Error checking documents table:', e)

# Test if the storage bucket exists
print('\nChecking storage buckets...')
try:
    response = supabase.storage.list_buckets()
    print('Available buckets:', response)
    
    # Check if documents bucket exists
    documents_bucket = next(
        (bucket for bucket in response if bucket.get('name') == 'documents'), 
        None
    )
    
    if documents_bucket:
        print('Documents bucket exists:', documents_bucket)
    else:
        print('Documents bucket does not exist')
        
        # Create the documents bucket
        print('\nCreating documents bucket...')
        try:
            # The correct method signature for create_bucket
            response = supabase.storage.create_bucket('documents')
            print('Documents bucket created:', response)
        except Exception as e:
            print('Error creating documents bucket:', e)
except Exception as e:
    print('Error checking storage buckets:', e)

# List files in the documents bucket if it exists
print('\nListing files in documents bucket...')
try:
    response = supabase.storage.from_('documents').list()
    print('Files in documents bucket:', response)
except Exception as e:
    print('Error listing files in documents bucket:', e) 