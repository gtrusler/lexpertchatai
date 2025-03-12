-- Create the documents table in the lexpert schema
CREATE TABLE IF NOT EXISTS lexpert.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    tag TEXT DEFAULT 'untagged',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION lexpert.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_documents_updated_at
    BEFORE UPDATE ON lexpert.documents
    FOR EACH ROW
    EXECUTE FUNCTION lexpert.set_updated_at();

-- Enable RLS
ALTER TABLE lexpert.documents ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow admins to do everything
CREATE POLICY "Admin full access"
    ON lexpert.documents
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Allow all authenticated users to view documents
CREATE POLICY "Authenticated users can view"
    ON lexpert.documents
    FOR SELECT
    TO authenticated
    USING (true);

-- Create index on tag for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_tag ON lexpert.documents(tag);

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Admin full access storage"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Allow authenticated users to download/view files
CREATE POLICY "Authenticated users can download"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'documents'); 