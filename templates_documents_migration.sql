-- Migration script to add prompt field to templates table and create template_documents junction table
-- Created: 2025-03-20

-- First, check if the prompt column already exists in the templates table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'templates' 
        AND column_name = 'prompt'
    ) THEN
        -- Add prompt column to templates table
        ALTER TABLE public.templates ADD COLUMN prompt TEXT;
        RAISE NOTICE 'Added prompt column to templates table';
    ELSE
        RAISE NOTICE 'prompt column already exists in templates table';
    END IF;
END $$;

-- Check if template_documents table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'template_documents'
    ) THEN
        -- Create template_documents junction table
        CREATE TABLE public.template_documents (
            template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
            document_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            PRIMARY KEY (template_id, document_id)
        );
        
        -- Add RLS policies for template_documents table
        ALTER TABLE public.template_documents ENABLE ROW LEVEL SECURITY;
        
        -- Allow authenticated users to read template_documents
        CREATE POLICY template_documents_select_policy ON public.template_documents
            FOR SELECT USING (auth.role() = 'authenticated');
            
        -- Allow authenticated users to insert into template_documents
        CREATE POLICY template_documents_insert_policy ON public.template_documents
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
            
        -- Allow authenticated users to update template_documents
        CREATE POLICY template_documents_update_policy ON public.template_documents
            FOR UPDATE USING (auth.role() = 'authenticated');
            
        -- Allow authenticated users to delete from template_documents
        CREATE POLICY template_documents_delete_policy ON public.template_documents
            FOR DELETE USING (auth.role() = 'authenticated');
            
        RAISE NOTICE 'Created template_documents junction table with RLS policies';
    ELSE
        RAISE NOTICE 'template_documents table already exists';
    END IF;
END $$;

-- Update the memory-bank/techContext.md file to document these changes
-- This needs to be done manually or through another script
