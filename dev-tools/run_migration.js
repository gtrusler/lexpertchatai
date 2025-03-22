// Script to run the template_documents migration via Supabase API
// Created: 2025-03-21
// Purpose: Create the template_documents table for template-document connections

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../src/frontend/.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_KEY are set in src/frontend/.env');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the migration SQL file
const migrationFilePath = path.resolve(__dirname, '../templates_documents_migration.sql');
const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');

console.log('Running migration script to create template_documents table...');

// Execute the SQL query using Supabase's rpc function
async function runMigration() {
  try {
    // First, check if the template_documents table already exists
    const { data: tableCheck, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'template_documents');

    if (tableCheckError) {
      console.error('Error checking if table exists:', tableCheckError);
      return;
    }

    if (tableCheck && tableCheck.length > 0) {
      console.log('The template_documents table already exists. No migration needed.');
      return;
    }

    // Split the migration SQL into separate statements
    const statements = migrationSql
      .replace(/DO \$\$([\s\S]*?)\$\$/g, '') // Remove DO $$ ... $$ blocks
      .split(';')
      .filter(stmt => stmt.trim().length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim().length === 0) continue;
      
      // Clean up the statement
      const cleanStatement = statement.trim()
        .replace(/--.*$/gm, '') // Remove comments
        .replace(/\n/g, ' ')    // Remove newlines
        .trim();
        
      if (cleanStatement.length === 0) continue;
      
      console.log(`Executing: ${cleanStatement.substring(0, 50)}...`);
      
      // Execute the SQL statement
      const { error } = await supabase.rpc('exec_sql', { sql: cleanStatement });
      
      if (error) {
        console.error('Error executing SQL statement:', error);
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.error('\nThe exec_sql function does not exist in your Supabase instance.');
          console.error('Please use the Supabase dashboard SQL editor to run the migration script manually.');
          console.error(`Migration script path: ${migrationFilePath}`);
        }
        return;
      }
    }
    
    console.log('Migration completed successfully!');
    console.log('The template_documents table has been created.');
    
  } catch (error) {
    console.error('Unexpected error running migration:', error);
  }
}

runMigration();
