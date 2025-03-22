// Test script for Supabase anonymous access to the documents bucket
// Run this with Node.js: node test_anon_access.js
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials - replace with your actual credentials
// Note: For this test, use the anon key (not the service role key)
const supabaseUrl = 'https://xjennkhbfetektomwzhy.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY'; // Replace with your anon key from the Supabase dashboard

async function testAnonAccess() {
  console.log('Testing Supabase anonymous access...');
  
  try {
    // Initialize Supabase client with anon key
    console.log('Initializing Supabase client with anon key...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized');
    
    // Test 1: List buckets
    console.log('\nTest 1: Listing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      console.log('Test 1 Result: FAILED - Anonymous role cannot list buckets');
    } else {
      console.log('Buckets:', buckets);
      console.log('Test 1 Result: PASSED - Anonymous role can list buckets');
      
      // Check if documents bucket exists
      const documentsBucket = buckets.find(bucket => bucket.name === 'documents');
      if (documentsBucket) {
        console.log('Documents bucket exists:', documentsBucket);
        
        // Test 2: List files in documents bucket
        console.log('\nTest 2: Listing files in documents bucket...');
        const { data: files, error: filesError } = await supabase.storage
          .from('documents')
          .list();
        
        if (filesError) {
          console.error('Error listing files:', filesError);
          console.log('Test 2 Result: FAILED - Anonymous role cannot list files in documents bucket');
        } else {
          console.log('Files in documents bucket:', files);
          console.log('Test 2 Result: PASSED - Anonymous role can list files in documents bucket');
        }
        
        // Test 3: Upload a test file
        console.log('\nTest 3: Uploading a test file...');
        const testFileContent = 'This is a test file for anonymous access';
        const testFileName = `test-${Date.now()}.txt`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(testFileName, new Blob([testFileContent]));
        
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          console.log('Test 3 Result: FAILED - Anonymous role cannot upload files to documents bucket');
        } else {
          console.log('Upload result:', uploadData);
          console.log('Test 3 Result: PASSED - Anonymous role can upload files to documents bucket');
          
          // Test 4: Delete the test file
          console.log('\nTest 4: Deleting the test file...');
          const { data: deleteData, error: deleteError } = await supabase.storage
            .from('documents')
            .remove([testFileName]);
          
          if (deleteError) {
            console.error('Error deleting file:', deleteError);
            console.log('Test 4 Result: FAILED - Anonymous role cannot delete files from documents bucket');
          } else {
            console.log('Delete result:', deleteData);
            console.log('Test 4 Result: PASSED - Anonymous role can delete files from documents bucket');
          }
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
testAnonAccess(); 