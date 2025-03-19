// Test script to verify Supabase storage permissions and upload functionality
// Run with: node test_supabase_storage.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function testStorage() {
  console.log('=== Supabase Storage Test ===');
  
  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
    console.error('Error: Missing Supabase credentials in environment variables');
    console.log('Required variables:');
    console.log('- VITE_SUPABASE_URL');
    console.log('- VITE_SUPABASE_KEY (anon key)');
    console.log('- SUPABASE_SERVICE_KEY (service role key)');
    process.exit(1);
  }
  
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Using anon key: ${supabaseKey.substring(0, 5)}...`);
  console.log(`Using service key: ${supabaseServiceKey.substring(0, 5)}...`);
  
  // Test 1: Connect with anon key
  console.log('\n--- Test 1: Connect with anon key ---');
  try {
    const anonClient = createClient(supabaseUrl, supabaseKey);
    const { data: user } = await anonClient.auth.getUser();
    console.log('Connection successful with anon key');
    console.log('User:', user ? 'Authenticated' : 'Not authenticated');
  } catch (error) {
    console.error('Error connecting with anon key:', error.message);
  }
  
  // Test 2: Connect with service role key
  console.log('\n--- Test 2: Connect with service role key ---');
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Connection successful with service role key');
    
    // Test 3: List buckets
    console.log('\n--- Test 3: List buckets ---');
    const { data: buckets, error: bucketsError } = await serviceClient.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError.message);
    } else {
      console.log(`Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
      
      // Check if documents bucket exists
      const documentsBucket = buckets.find(b => b.name === 'documents');
      if (documentsBucket) {
        console.log('✅ "documents" bucket exists');
      } else {
        console.log('❌ "documents" bucket does not exist');
        
        // Test 4: Create documents bucket
        console.log('\n--- Test 4: Create documents bucket ---');
        const { data: newBucket, error: createError } = await serviceClient.storage.createBucket('documents', {
          public: false
        });
        
        if (createError) {
          console.error('Error creating documents bucket:', createError.message);
        } else {
          console.log('✅ Created "documents" bucket successfully');
        }
      }
      
      // Test 5: Check RLS policies
      console.log('\n--- Test 5: Check RLS policies ---');
      try {
        // List files in documents bucket (or first available bucket)
        const bucketToTest = documentsBucket ? 'documents' : (buckets.length > 0 ? buckets[0].name : null);
        
        if (bucketToTest) {
          console.log(`Testing access to "${bucketToTest}" bucket...`);
          
          // Test with service role key (should always work)
          const { data: serviceFiles, error: serviceError } = await serviceClient
            .storage
            .from(bucketToTest)
            .list();
            
          if (serviceError) {
            console.error(`Error listing files with service role key: ${serviceError.message}`);
          } else {
            console.log(`✅ Service role key can list files in "${bucketToTest}" bucket`);
            console.log(`Found ${serviceFiles.length} files`);
          }
          
          // Test with anon key
          const anonClient = createClient(supabaseUrl, supabaseKey);
          const { data: anonFiles, error: anonError } = await anonClient
            .storage
            .from(bucketToTest)
            .list();
            
          if (anonError) {
            console.log(`❌ Anon key cannot list files: ${anonError.message}`);
            console.log('This is expected if RLS policies are properly configured to restrict access');
          } else {
            console.log(`⚠️ Anon key can list files in "${bucketToTest}" bucket`);
            console.log(`Found ${anonFiles.length} files`);
            console.log('This might be a security concern if unauthorized users should not see files');
          }
        } else {
          console.log('No buckets available to test RLS policies');
        }
      } catch (error) {
        console.error('Error checking RLS policies:', error.message);
      }
      
      // Test 6: Upload test file
      console.log('\n--- Test 6: Upload test file ---');
      try {
        // Create a test file
        const testContent = 'This is a test file for Supabase storage upload';
        const testFilePath = path.join(__dirname, 'test_upload.txt');
        fs.writeFileSync(testFilePath, testContent);
        console.log(`Created test file at ${testFilePath}`);
        
        // Upload to documents bucket or first available bucket
        const bucketToTest = documentsBucket ? 'documents' : (buckets.length > 0 ? buckets[0].name : null);
        
        if (bucketToTest) {
          const testFileContent = fs.readFileSync(testFilePath);
          const fileName = `test_${Date.now()}.txt`;
          
          console.log(`Uploading to "${bucketToTest}" bucket as "${fileName}"...`);
          
          const { data: uploadData, error: uploadError } = await serviceClient
            .storage
            .from(bucketToTest)
            .upload(fileName, testFileContent, {
              contentType: 'text/plain'
            });
            
          if (uploadError) {
            console.error('Error uploading file:', uploadError.message);
          } else {
            console.log('✅ File uploaded successfully');
            console.log('Upload result:', uploadData);
            
            // Get public URL
            const { data: urlData } = serviceClient
              .storage
              .from(bucketToTest)
              .getPublicUrl(fileName);
              
            console.log('Public URL:', urlData.publicUrl);
            
            // Clean up
            console.log('Cleaning up...');
            fs.unlinkSync(testFilePath);
            console.log('Test file deleted');
          }
        } else {
          console.log('No buckets available for upload test');
        }
      } catch (error) {
        console.error('Error in upload test:', error.message);
      }
    }
  } catch (error) {
    console.error('Error connecting with service role key:', error.message);
  }
}

// Run the tests
testStorage().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
