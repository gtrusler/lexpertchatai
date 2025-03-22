// Test script for Supabase connection using service role key
// Run this with Node.js: node test_with_service_key.js
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials - replace with your actual credentials
// Note: For this test, you should use the service_role key from your Supabase dashboard
// Go to Project Settings > API > service_role key (this has admin privileges)
const supabaseUrl = 'https://xjennkhbfetektomwzhy.supabase.co';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'; // Replace with your service_role key

async function testWithServiceKey() {
  console.log('Testing Supabase connection with service role key...');
  
  try {
    // Initialize Supabase client with service role key
    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client initialized');
    
    // Test storage connection
    console.log('\nTesting storage connection...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
    } else {
      console.log('Available buckets:', buckets);
      
      // Check if documents bucket exists
      const documentsBucket = buckets.find(bucket => bucket.name === 'documents');
      if (documentsBucket) {
        console.log('Documents bucket exists:', documentsBucket);
        
        // List files in the documents bucket
        console.log('\nListing files in documents bucket...');
        const { data: files, error: filesError } = await supabase.storage
          .from('documents')
          .list();
        
        if (filesError) {
          console.error('Error listing files in documents bucket:', filesError);
        } else {
          console.log('Files in documents bucket:', files);
        }
      } else {
        console.log('Documents bucket does not exist');
      }
    }
    
    console.log('\nTest completed');
  } catch (err) {
    console.error('Unexpected error during test:', err);
  }
}

// Run the test
testWithServiceKey(); 