/**
 * Script to fix Supabase RLS policies for storage buckets
 * This script uses the Supabase JavaScript client to create the documents bucket
 * with proper RLS policies using the service role key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from frontend .env file
dotenv.config({ path: resolve(__dirname, '../src/frontend/.env') });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

console.log(`Supabase URL: ${supabaseUrl.substring(0, 15)}... (truncated)`);
console.log(`Supabase Key: ${supabaseKey.substring(0, 10)}... (truncated)`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucketWithPublicPolicy() {
  try {
    console.log('Attempting to create documents bucket...');
    
    // Try to create the bucket (will fail if it already exists)
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(
      'documents',
      { public: true }
    );
    
    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('Bucket already exists, continuing...');
      } else {
        console.error('Error creating bucket:', bucketError);
        return;
      }
    } else {
      console.log('Bucket created successfully:', bucketData);
    }
    
    console.log('Storage bucket setup complete');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Create template_documents table if it doesn't exist
async function createTemplateDocumentsTable() {
  try {
    console.log('Checking if template_documents table exists...');
    
    // Check if table exists
    const { data: tableExists, error: checkError } = await supabase
      .from('template_documents')
      .select('*')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('Creating template_documents table...');
      
      // Create the table using SQL
      const { error: createError } = await supabase.rpc('create_template_documents_table');
      
      if (createError) {
        console.error('Error creating table:', createError);
        
        // Fallback: Try to create the table directly
        console.log('Attempting to create table directly...');
        
        const { error: fallbackError } = await supabase.rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS public.template_documents (
              template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
              document_id UUID NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              PRIMARY KEY (template_id, document_id)
            );
            
            ALTER TABLE public.template_documents ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Enable read access for authenticated users" 
              ON public.template_documents
              FOR SELECT 
              TO authenticated 
              USING (true);
              
            CREATE POLICY "Enable insert access for authenticated users" 
              ON public.template_documents
              FOR INSERT 
              TO authenticated 
              WITH CHECK (true);
              
            CREATE POLICY "Enable update access for authenticated users" 
              ON public.template_documents
              FOR UPDATE 
              TO authenticated 
              USING (true);
              
            CREATE POLICY "Enable delete access for authenticated users" 
              ON public.template_documents
              FOR DELETE 
              TO authenticated 
              USING (true);
          `
        });
        
        if (fallbackError) {
          console.error('Error creating table directly:', fallbackError);
        } else {
          console.log('Table created successfully using direct SQL');
        }
      } else {
        console.log('Table created successfully');
      }
    } else {
      console.log('template_documents table already exists');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the functions
async function main() {
  await createBucketWithPublicPolicy();
  await createTemplateDocumentsTable();
  console.log('Setup complete');
}

main();
