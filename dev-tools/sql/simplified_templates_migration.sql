-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read templates
CREATE POLICY "templates_select_policy" 
ON public.templates 
FOR SELECT 
USING (true);

-- Create policy to allow authenticated users to insert templates
-- For testing purposes, we're allowing all authenticated users to insert
CREATE POLICY "templates_insert_policy" 
ON public.templates 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update their own templates
-- For testing purposes, we're allowing all authenticated users to update all templates
CREATE POLICY "templates_update_policy" 
ON public.templates 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete templates
-- For testing purposes, we're allowing all authenticated users to delete all templates
CREATE POLICY "templates_delete_policy" 
ON public.templates 
FOR DELETE 
TO authenticated
USING (true);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a sample template for testing (if it doesn't already exist)
INSERT INTO public.templates (name, description, content)
VALUES (
    'Sample Legal Brief Template',
    'A standard template for legal briefs with proper formatting and structure',
    '# {CASE_TITLE}

## Introduction

{INTRODUCTION_TEXT}

## Facts

{CASE_FACTS}

## Legal Analysis

{LEGAL_ANALYSIS}

## Conclusion

{CONCLUSION_TEXT}'
) ON CONFLICT (name) DO NOTHING;
