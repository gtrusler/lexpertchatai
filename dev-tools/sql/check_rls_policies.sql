-- SQL script to check RLS policies for the storage.objects table
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Check existing policies for storage.objects using the pg_policies view
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual AS using_expression,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'storage'
    AND tablename = 'objects'
ORDER BY
    policyname;

-- Also check bucket policies
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual AS using_expression,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'storage'
    AND tablename = 'buckets'
ORDER BY
    policyname; 