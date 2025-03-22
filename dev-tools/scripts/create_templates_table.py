"""
Script to create the templates table in Supabase for Lexpert Case AI
"""
import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from backend .env file
load_dotenv("backend/.env")

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing Supabase credentials")
    raise ValueError("Missing Supabase credentials")

# Create Supabase client
logger.info("Initializing Supabase client")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# SQL for creating templates table
CREATE_TEMPLATES_SQL = """
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
CREATE POLICY "Allow anyone to read templates" 
ON public.templates 
FOR SELECT 
USING (true);

-- Create policy to allow only admins to insert templates
CREATE POLICY "Allow admins to insert templates" 
ON public.templates 
FOR INSERT 
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Create policy to allow only admins to update templates
CREATE POLICY "Allow admins to update templates" 
ON public.templates 
FOR UPDATE 
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Create policy to allow only admins to delete templates
CREATE POLICY "Allow admins to delete templates" 
ON public.templates 
FOR DELETE 
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Add a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
"""

def create_templates_table():
    """Create the templates table in Supabase"""
    try:
        logger.info("Creating templates table...")
        
        # Execute the SQL using the Supabase REST API
        # Note: This approach uses a direct SQL query through the REST API
        response = supabase.table("_rpc").insert({
            "name": "pg_query",
            "args": {"query": CREATE_TEMPLATES_SQL}
        }).execute()
        
        if hasattr(response, 'error') and response.error:
            logger.error(f"Error creating templates table: {response.error}")
            return
        
        logger.info("Templates table created successfully!")
        
        # Insert a sample template
        logger.info("Creating sample template...")
        sample_template = {
            "name": "Sample Legal Brief Template",
            "description": "A standard template for legal briefs with proper formatting and structure",
            "content": "# {CASE_TITLE}\n\n## Introduction\n\n{INTRODUCTION_TEXT}\n\n## Facts\n\n{CASE_FACTS}\n\n## Legal Analysis\n\n{LEGAL_ANALYSIS}\n\n## Conclusion\n\n{CONCLUSION_TEXT}"
        }
        
        response = supabase.table("templates").insert(sample_template).execute()
        
        if hasattr(response, 'error') and response.error:
            logger.error(f"Error creating sample template: {response.error}")
            return
        
        logger.info("Sample template created successfully!")
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")

if __name__ == "__main__":
    create_templates_table()
