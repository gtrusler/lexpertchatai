// API endpoint to create a storage bucket using the service role key
// This should be deployed as a serverless function or API route
// For local development, you can use this with a proxy middleware

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const { bucketName } = req.body;
    
    if (!bucketName) {
      return res.status(400).json({ error: 'Bucket name is required' });
    }
    
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Initialize Supabase client with service role key
    console.log('Initializing Supabase client with service role key');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if bucket already exists
    console.log(`Checking if bucket '${bucketName}' exists`);
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return res.status(500).json({ error: 'Failed to list buckets' });
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket '${bucketName}' already exists`);
      return res.status(200).json({ message: `Bucket '${bucketName}' already exists` });
    }
    
    // Create the bucket
    console.log(`Creating bucket '${bucketName}'`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: false
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
      return res.status(500).json({ error: 'Failed to create bucket' });
    }
    
    console.log(`Bucket '${bucketName}' created successfully`);
    return res.status(201).json({ message: `Bucket '${bucketName}' created successfully`, data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 