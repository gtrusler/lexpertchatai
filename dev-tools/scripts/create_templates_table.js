// Script to create templates table in Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from backend .env
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in environment variables');
  process.exit(1);
}

console.log('Creating Supabase client with URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// SQL for creating templates table
const createTemplatesTableSQL = `
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
`;

async function createTemplatesTable() {
  try {
    console.log('Attempting to create templates table...');
    
    // Execute SQL using Supabase's SQL API
    const { data, error } = await supabase.rpc('pg_query', { query: createTemplatesTableSQL });
    
    if (error) {
      console.error('Error creating templates table:', error);
      
      // Try an alternative approach - create just the basic table structure
      console.log('Trying alternative approach - creating basic table structure...');
      
      const basicTableSQL = `
      CREATE TABLE IF NOT EXISTS public.templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          content TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      `;
      
      const { data: basicData, error: basicError } = await supabase.rpc('pg_query', { query: basicTableSQL });
      
      if (basicError) {
        console.error('Error creating basic table structure:', basicError);
        return;
      }
      
      console.log('Basic templates table created successfully!');
    } else {
      console.log('Templates table created successfully with all policies!');
    }
    
    // Insert a sample template
    console.log('Creating sample template...');
    const { data: templateData, error: templateError } = await supabase
      .from('templates')
      .insert([
        {
          name: 'Sample Legal Brief Template',
          description: 'A standard template for legal briefs with proper formatting and structure',
          content: '# {CASE_TITLE}\n\n## Introduction\n\n{INTRODUCTION_TEXT}\n\n## Facts\n\n{CASE_FACTS}\n\n## Legal Analysis\n\n{LEGAL_ANALYSIS}\n\n## Conclusion\n\n{CONCLUSION_TEXT}'
        }
      ]);
    
    if (templateError) {
      console.error('Error inserting sample template:', templateError);
      return;
    }
    
    console.log('Sample template inserted successfully!');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createTemplatesTable();
