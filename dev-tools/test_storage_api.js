/**
 * Test script for the Supabase storage API endpoints
 * This script tests the new backend API endpoints for bucket and table management
 */

// Import required modules
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load environment variables from multiple possible locations
try {
  config({ path: join(__dirname, '../src/frontend/.env') });
  console.log('Loaded environment variables from frontend .env');
} catch (error) {
  console.log('Could not load frontend .env file:', error.message);
}

// Use a hardcoded API URL for testing
const API_URL = 'http://localhost:8000';
console.log(`Using API URL: ${API_URL}`);


async function testStorageAPI() {
  console.log('Testing Storage API Endpoints');
  console.log('============================');
  
  try {
    // Step 1: Check if documents bucket exists
    console.log('\n1. Checking if documents bucket exists...');
    const checkResponse = await fetch(`${API_URL}/api/check-bucket-exists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucketName: 'documents' })
    });
    
    if (!checkResponse.ok) {
      throw new Error(`API returned status ${checkResponse.status}`);
    }
    
    const bucketData = await checkResponse.json();
    console.log('Bucket check result:', bucketData);
    
    // Step 2: Create bucket if it doesn't exist
    if (!bucketData.exists) {
      console.log('\n2. Creating documents bucket...');
      const createResponse = await fetch(`${API_URL}/api/create-bucket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketName: 'documents' })
      });
      
      if (!createResponse.ok) {
        throw new Error(`API returned status ${createResponse.status}`);
      }
      
      const createResult = await createResponse.json();
      console.log('Bucket creation result:', createResult);
    } else {
      console.log('\n2. Bucket already exists, skipping creation');
    }
    
    // Step 3: Set up RLS policies
    console.log('\n3. Setting up bucket policies...');
    const policiesResponse = await fetch(`${API_URL}/api/setup-bucket-policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucketName: 'documents' })
    });
    
    if (!policiesResponse.ok) {
      console.warn(`API returned status ${policiesResponse.status} when setting up policies`);
    } else {
      const policiesResult = await policiesResponse.json();
      console.log('Bucket policies setup result:', policiesResult);
    }
    
    // Step 4: Create template_documents table
    console.log('\n4. Creating template_documents table...');
    const tableResponse = await fetch(`${API_URL}/api/create-template-documents-table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!tableResponse.ok) {
      console.warn(`API returned status ${tableResponse.status} when creating template_documents table`);
    } else {
      const tableResult = await tableResponse.json();
      console.log('Template documents table setup result:', tableResult);
    }
    
    // Step 5: List files in the bucket
    console.log('\n5. Listing files in the documents bucket...');
    const listResponse = await fetch(`${API_URL}/api/list-bucket-files`);
    
    if (!listResponse.ok) {
      console.warn(`API returned status ${listResponse.status} when listing bucket files`);
    } else {
      const listResult = await listResponse.json();
      console.log('Files in bucket:', listResult);
      
      if (listResult.files && listResult.files.length > 0) {
        console.log(`Found ${listResult.files.length} files in the bucket`);
        // Display first 5 files
        const filesToShow = listResult.files.slice(0, 5);
        console.log('Sample files:', filesToShow);
      } else {
        console.log('No files found in the bucket');
      }
    }
    
    console.log('\nStorage API test completed successfully!');
    
  } catch (error) {
    console.error('Error testing storage API:', error);
  }
}

// Run the test
testStorageAPI();
