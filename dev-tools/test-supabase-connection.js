// Simple script to test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../src/frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

console.log('Testing Supabase connection with:');
console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Not found');
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 5)}...` : 'Not found');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth service error:', authError.message);
    } else {
      console.log('✅ Auth service working');
    }
    
    console.log('Testing storage service...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage service error:', bucketsError.message);
    } else {
      console.log('✅ Storage service working, found buckets:', buckets.map(b => b.name).join(', '));
    }
    
    console.log('Testing database service...');
    const { data: templates, error: templatesError } = await supabase.from('templates').select('id').limit(1);
    
    if (templatesError) {
      console.error('❌ Database service error:', templatesError.message);
    } else {
      console.log('✅ Database service working');
    }
    
    console.log('\nConnection test complete');
  } catch (err) {
    console.error('❌ Unexpected error during testing:', err.message);
  }
}

testConnection();
