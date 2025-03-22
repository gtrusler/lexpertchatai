-- SQL script to check if the documents bucket exists and create it if it doesn't
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Check if the documents bucket exists
DO $$
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'documents'
    ) INTO bucket_exists;
    
    IF NOT bucket_exists THEN
        -- Create the documents bucket if it doesn't exist
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documents', 'documents', FALSE);
        
        RAISE NOTICE 'Documents bucket created successfully';
    ELSE
        RAISE NOTICE 'Documents bucket already exists';
    END IF;
END $$;

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE name = 'documents';

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

-- Optional: Policy to allow public access to files (if needed)
-- CREATE POLICY "Allow public access to files"
-- ON storage.objects
-- FOR SELECT
-- TO anon
-- USING (bucket_id = 'documents'); 