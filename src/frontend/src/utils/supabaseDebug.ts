/**
 * Utility functions for debugging Supabase initialization issues
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Checks if Supabase URL is valid
 */
export const validateSupabaseUrl = (url: string | undefined): { valid: boolean; message: string } => {
  if (!url) {
    return { valid: false, message: 'Supabase URL is undefined' };
  }
  
  if (url.trim() === '') {
    return { valid: false, message: 'Supabase URL is empty' };
  }
  
  try {
    // Check if it's a valid URL
    new URL(url);
    
    // Check if it's a Supabase URL
    if (!url.includes('supabase.co') && !url.includes('supabase.in')) {
      return { 
        valid: false, 
        message: 'URL does not appear to be a Supabase URL (missing supabase.co or supabase.in)' 
      };
    }
    
    return { valid: true, message: 'Supabase URL is valid' };
  } catch (error) {
    return { valid: false, message: 'Invalid URL format' };
  }
};

/**
 * Checks if Supabase key is valid
 */
export const validateSupabaseKey = (key: string | undefined): { valid: boolean; message: string } => {
  if (!key) {
    return { valid: false, message: 'Supabase key is undefined' };
  }
  
  if (key.trim() === '') {
    return { valid: false, message: 'Supabase key is empty' };
  }
  
  // Check if it looks like an anon key (starts with 'eyJ')
  if (!key.startsWith('eyJ')) {
    return { 
      valid: false, 
      message: 'Key does not appear to be a valid Supabase key (should start with "eyJ")' 
    };
  }
  
  return { valid: true, message: 'Supabase key format appears valid' };
};

/**
 * Attempts to initialize Supabase client and reports any issues
 */
export const debugSupabaseInit = async () => {
  console.log('[supabaseDebug] Starting Supabase initialization debug');
  
  try {
    // Check if environment variables are set
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
    
    console.log('[supabaseDebug] Environment variables:', {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'NOT SET',
      supabaseKey: supabaseKey ? 'Present (hidden for security)' : 'NOT SET'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        message: 'Missing Supabase environment variables'
      };
    }
    
    // Try to initialize Supabase client
    console.log('[supabaseDebug] Initializing Supabase client');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test a simple query to verify connection
    console.log('[supabaseDebug] Testing Supabase query');
    const { data, error } = await supabase.from('documents').select('*').limit(1);
    
    if (error) {
      console.error('[supabaseDebug] Supabase query error:', error);
      return {
        success: false,
        message: `Supabase query failed: ${error.message || 'Unknown error'}`
      };
    }
    
    console.log('[supabaseDebug] Query successful, found', data?.length || 0, 'documents');
    
    // Check if storage is accessible
    console.log('[supabaseDebug] Testing Supabase storage');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('[supabaseDebug] Supabase storage error:', bucketsError);
        return {
          success: false,
          message: `Supabase storage error: ${bucketsError.message || 'Unknown error'}`
        };
      }
      
      const documentsBucketExists = buckets?.some((bucket: any) => bucket.name === 'documents');
      console.log('[supabaseDebug] Documents bucket exists:', documentsBucketExists);
      
      if (!documentsBucketExists) {
        console.warn('[supabaseDebug] Documents bucket does not exist');
        // This is a warning, not an error - we'll handle bucket creation elsewhere
      }
    } catch (storageErr: any) {
      console.error('[supabaseDebug] Error checking storage:', storageErr);
      // Continue anyway, as this might not be critical for initialization
    }
    
    console.log('[supabaseDebug] Supabase initialization successful');
    return {
      success: true,
      message: 'Supabase initialized successfully'
    };
  } catch (err: any) {
    console.error('[supabaseDebug] Supabase initialization error:', err);
    return {
      success: false,
      message: `Supabase initialization error: ${err.message || 'Unknown error'}`
    };
  }
}; 