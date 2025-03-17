// Script to create the documents bucket using the service role key
// Run with: node create_bucket.js
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Replace this with your actual Supabase URL
const supabaseUrl = 'https://xjennkhbfetektomwzhy.supabase.co';

// You can provide the service role key as an environment variable or as a command line argument
// Example: SERVICE_ROLE_KEY=your_key node create_bucket.js
// Or: node create_bucket.js your_key
let supabaseServiceKey = process.env.SERVICE_ROLE_KEY || process.argv[2];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptForKey() {
  return new Promise((resolve) => {
    rl.question('Please enter your Supabase service role key: ', (key) => {
      resolve(key.trim());
    });
  });
}

async function createDocumentsBucket() {
  try {
    console.log('Creating documents bucket...');
    
    // If no key is provided, prompt for it
    if (!supabaseServiceKey) {
      console.log('No service role key provided.');
      console.log('You can find your service role key in the Supabase dashboard:');
      console.log('Project Settings > API > service_role key');
      supabaseServiceKey = await promptForKey();
    }
    
    if (!supabaseServiceKey) {
      console.error('No service role key provided. Exiting.');
      rl.close();
      return;
    }
    
    // Initialize Supabase client with service role key
    console.log('Initializing Supabase client with service role key');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if bucket already exists
    console.log('Checking if documents bucket exists');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      rl.close();
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'documents');
    
    if (bucketExists) {
      console.log('Documents bucket already exists');
      
      // List files in the bucket
      console.log('\nListing files in the documents bucket...');
      const { data: files, error: filesError } = await supabase.storage
        .from('documents')
        .list();
      
      if (filesError) {
        console.error('Error listing files:', filesError);
      } else {
        console.log('Files in documents bucket:', files);
      }
      
      rl.close();
      return;
    }
    
    // Create the bucket
    console.log('Creating documents bucket');
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: false
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
      rl.close();
      return;
    }
    
    console.log('Documents bucket created successfully');
    
    // Create RLS policies for the bucket
    console.log('\nNow you should run the add_anon_policy.sql script in the Supabase dashboard to add RLS policies');
    console.log('SQL script path: add_anon_policy.sql');
    
    rl.close();
  } catch (err) {
    console.error('Unexpected error:', err);
    rl.close();
  }
}

// Run the function
createDocumentsBucket(); 