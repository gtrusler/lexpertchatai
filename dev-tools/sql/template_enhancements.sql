-- Template Enhancements Migration Script
-- Add prompt field to templates table
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS prompt TEXT;

-- Create a junction table for templates and documents if it doesn't exist
CREATE TABLE IF NOT EXISTS public.template_documents (
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    document_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (template_id, document_id)
);

-- Add RLS policies to the junction table
ALTER TABLE public.template_documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read template_documents connections
CREATE POLICY "template_documents_select_policy" 
ON public.template_documents 
FOR SELECT 
USING (true);

-- Create policy to allow authenticated users to insert template_documents connections
CREATE POLICY "template_documents_insert_policy" 
ON public.template_documents 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update template_documents connections
CREATE POLICY "template_documents_update_policy" 
ON public.template_documents 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete template_documents connections
CREATE POLICY "template_documents_delete_policy" 
ON public.template_documents 
FOR DELETE 
TO authenticated
USING (true);

-- Add an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_template_documents_document_id ON public.template_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_template_documents_template_id ON public.template_documents(template_id);

-- Update the sample template to include a prompt field
UPDATE public.templates 
SET prompt = 'Create a legal brief based on the following case information. Include proper legal citations and structure the document according to standard legal brief format.'
WHERE name = 'Sample Legal Brief Template';

-- Add a comment to explain the purpose of the junction table
COMMENT ON TABLE public.template_documents IS 'Junction table connecting templates with their associated knowledge source documents';
