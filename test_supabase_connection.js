// Test script for Supabase connection
import { createClient } from '@supabase/supabase-js';

// Supabase credentials - replace with your actual credentials
const supabaseUrl = 'https://xjennkhbfetektomwzhy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZW5ua2hiZmV0ZWt0b213emh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MTE2MzQsImV4cCI6MjA1NTk4NzYzNH0.fyUKzNgJSkYtvh3HvPAmZls7uhI_p4xfeFoctC1xfGg';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');
    
    // Test database connection
    console.log('\nTesting database connection...');
    const { data: docs, error: docError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (docError) {
      console.error('Error querying documents table:', docError);
    } else {
      console.log('Documents table query successful:', docs);
    }
    
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
    
    // Test authentication
    console.log('\nTesting authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error getting session:', authError);
    } else {
      console.log('Session data:', authData);
      
      if (authData.session) {
        console.log('User is authenticated');
      } else {
        console.log('No active session found');
      }
    }
    
    console.log('\nSupabase connection test completed');
  } catch (err) {
    console.error('Unexpected error during Supabase connection test:', err);
  }
}

// Run the test
testSupabaseConnection(); 