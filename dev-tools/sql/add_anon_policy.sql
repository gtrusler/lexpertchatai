-- SQL script to add a policy for anonymous access to the documents bucket
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

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

-- Policy to allow anonymous users to download files from the documents bucket
CREATE POLICY "Allow anonymous users to download files from documents bucket"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'documents');

-- Policy to allow anonymous users to delete files from the documents bucket
CREATE POLICY "Allow anonymous users to delete files from documents bucket"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'documents');

-- Verify the policies were created
-- Using a simpler query that doesn't rely on the pg_policy structure
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    permissive
FROM
    pg_policies
WHERE
    schemaname = 'storage'
    AND (tablename = 'objects' OR tablename = 'buckets')
    AND 'anon' = ANY(roles)
ORDER BY
    policyname; 