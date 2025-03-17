-- Simplified SQL script to add policies for anonymous access to the documents bucket
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- First, check if the documents bucket exists and create it if it doesn't
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

-- Policy to allow anonymous users to list buckets
CREATE POLICY "Allow anonymous users to list buckets"
ON storage.buckets
FOR SELECT
TO anon
USING (true);

-- Policy to allow anonymous users to list files in the documents bucket
CREATE POLICY "Allow anonymous users to list files in documents bucket"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'documents');

-- Policy to allow anonymous users to upload files to the documents bucket
CREATE POLICY "Allow anonymous users to upload files to documents bucket"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'documents');

-- Policy to allow anonymous users to delete files from the documents bucket
CREATE POLICY "Allow anonymous users to delete files from documents bucket"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'documents');

-- Verify the policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM
    pg_policies
WHERE
    schemaname = 'storage'
    AND (tablename = 'objects' OR tablename = 'buckets')
    AND 'anon' = ANY(roles)
ORDER BY
    tablename, policyname; 