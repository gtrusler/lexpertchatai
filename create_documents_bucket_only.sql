-- SQL script to create only the 'documents' bucket in Supabase Storage
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Create the documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'documents'; 