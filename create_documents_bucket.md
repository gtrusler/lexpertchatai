# Creating the Documents Storage Bucket in Supabase

The application requires a storage bucket named `documents` to store uploaded files. Since creating buckets requires admin privileges, you'll need to create this bucket manually in Supabase. Here are three methods to do this:

## Option 1: Using the Supabase Dashboard (UI Method)

1. Log in to your Supabase account at https://app.supabase.com/
2. Select your project
3. Navigate to the "Storage" section in the left sidebar
4. Click the "New Bucket" button
5. Enter `documents` as the bucket name
6. Uncheck "Public bucket" if you want to restrict access
7. Click "Create bucket"

## Option 2: Using SQL (Recommended)

1. Log in to your Supabase account at https://app.supabase.com/
2. Select your project
3. Navigate to the "SQL Editor" section in the left sidebar
4. Create a new query or open an existing one
5. Paste the following SQL code:

```sql
-- Create the documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the documents bucket

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Policy to allow authenticated users to select their own files
CREATE POLICY "Allow authenticated users to select their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Policy to allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid() = owner);

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'documents';
```

6. Click "Run" to execute the SQL code

This SQL script will:

- Create the documents bucket if it doesn't already exist
- Set up Row Level Security (RLS) policies to control access to the bucket
- Verify that the bucket was created successfully

## Option 3: Using the Supabase CLI

If you have the Supabase CLI installed, you can create the bucket using the following command:

```bash
supabase storage create documents
```

## Verifying the Bucket

After creating the bucket, you can verify it exists by running the following script:

```bash
python test_supabase_storage.py
```

You should see output indicating that the documents bucket exists.

## Customizing Bucket Permissions

If you need to customize the bucket permissions beyond what's provided in the SQL script, you can do so in the Supabase dashboard:

1. In the Supabase dashboard, go to the "Storage" section
2. Select the "documents" bucket
3. Click on the "Policies" tab
4. Create or modify policies as needed

For example, to allow public access to files (not recommended for sensitive documents):

```sql
CREATE POLICY "Allow public access to files"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'documents');
```

Adjust these policies according to your application's security requirements.
