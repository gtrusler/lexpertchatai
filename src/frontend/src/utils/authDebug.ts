/**
 * Utility functions for debugging authentication flow issues
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Tests the authentication flow by checking the current session and user
 */
export const debugAuthFlow = async () => {
  console.log('[authDebug] Starting authentication flow debug');
  
  try {
    // Check if environment variables are set
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
    
    console.log('[authDebug] Environment variables:', {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'NOT SET',
      supabaseKey: supabaseKey ? 'Present (hidden for security)' : 'NOT SET'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        isAuthenticated: false,
        message: 'Missing Supabase environment variables'
      };
    }
    
    // Initialize Supabase client
    console.log('[authDebug] Initializing Supabase client');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get current user
    console.log('[authDebug] Getting current user');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[authDebug] Error getting user:', userError);
      return {
        success: false,
        isAuthenticated: false,
        message: `Authentication error: ${userError.message || 'Unknown error'}`
      };
    }
    
    if (!user) {
      console.log('[authDebug] No user found - not authenticated');
      return {
        success: true,
        isAuthenticated: false,
        message: 'Not authenticated'
      };
    }
    
    console.log('[authDebug] User found:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    // Get session
    console.log('[authDebug] Getting session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[authDebug] Error getting session:', sessionError);
      return {
        success: false,
        isAuthenticated: true, // User exists but session has issues
        message: `Session error: ${sessionError.message || 'Unknown error'}`
      };
    }
    
    if (!session) {
      console.log('[authDebug] No active session found');
      return {
        success: true,
        isAuthenticated: true, // User exists but no active session
        message: 'User exists but no active session'
      };
    }
    
    console.log('[authDebug] Active session found, expires:', new Date(session.expires_at! * 1000).toLocaleString());
    
    return {
      success: true,
      isAuthenticated: true,
      message: 'Authenticated with active session',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  } catch (err: any) {
    console.error('[authDebug] Authentication flow error:', err);
    return {
      success: false,
      isAuthenticated: false,
      message: `Authentication flow error: ${err.message || 'Unknown error'}`
    };
  }
};

/**
 * Tests if the user has admin privileges
 */
export const checkAdminStatus = async () => {
  console.log('[authDebug] Checking admin status');
  
  try {
    // Check if environment variables are set
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        isAdmin: false,
        message: 'Missing Supabase environment variables'
      };
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[authDebug] Error getting user for admin check:', userError);
      return {
        success: false,
        isAdmin: false,
        message: `Error getting user: ${userError.message || 'Unknown error'}`
      };
    }
    
    if (!user) {
      console.log('[authDebug] No user found - cannot be admin');
      return {
        success: false,
        isAdmin: false,
        message: 'Not authenticated'
      };
    }
    
    // For demo purposes, consider all authenticated users as admins
    // In a real application, you would check user.role or a custom claim
    console.log('[authDebug] User is considered admin for demo purposes');
    
    return {
      success: true,
      isAdmin: true,
      message: 'User has admin privileges'
    };
  } catch (err: any) {
    console.error('[authDebug] Admin check error:', err);
    return {
      success: false,
      isAdmin: false,
      message: `Admin check error: ${err.message || 'Unknown error'}`
    };
  }
}; 