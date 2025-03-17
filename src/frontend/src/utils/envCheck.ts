/**
 * Utility to check if environment variables are properly loaded
 * This can be imported and called from any component to verify env vars
 */

import { createClient } from '@supabase/supabase-js';

// Check if required environment variables are set
export const checkEnvironmentVariables = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
  
  if (!supabaseUrl) {
    return {
      success: false,
      message: 'VITE_SUPABASE_URL is not set'
    };
  }
  
  if (!supabaseKey) {
    return {
      success: false,
      message: 'VITE_SUPABASE_KEY is not set'
    };
  }
  
  return {
    success: true,
    message: 'All required environment variables are set'
  };
};

/**
 * Utility to check if Supabase client can be initialized properly
 */
export const testSupabaseConnection = async () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      message: 'Missing Supabase environment variables'
    };
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('documents').select('*').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return {
        success: false,
        message: `Supabase query failed: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'Supabase connection successful',
      data
    };
  } catch (err: any) {
    console.error('Supabase connection test error:', err);
    return {
      success: false,
      message: `Supabase connection error: ${err.message}`
    };
  }
}; 