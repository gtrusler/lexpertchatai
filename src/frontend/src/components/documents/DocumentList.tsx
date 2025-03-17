import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { checkEnvironmentVariables } from '../../utils/envCheck';

// Debug flag - set to true to enable console logging
const DEBUG = true;

// Log function that only logs when DEBUG is true
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[DocumentList]', ...args);
  }
};

// Get environment variables with fallbacks and logging
const getEnvVar = (name: string, fallback: string = '') => {
  const value = import.meta.env[name] || fallback;
  debugLog(`ENV ${name}: ${value ? (value.length > 10 ? value.substring(0, 10) + '...' : value) : 'NOT SET'}`);
  return value;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', '');
const supabaseKey = getEnvVar('VITE_SUPABASE_KEY', '');

// Create Supabase client with error handling
let supabase: any;
try {
  debugLog('Initializing Supabase client');
  supabase = createClient(supabaseUrl, supabaseKey);
  debugLog('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a dummy client to prevent crashes
  supabase = {
    from: () => ({
      select: () => ({
        order: () => ({ data: null, error: { message: 'Supabase client initialization failed' } })
      })
    }),
    storage: {
      from: () => ({
        remove: async () => ({ data: null, error: { message: 'Supabase client initialization failed' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  };
}

interface DatabaseDocument {
  id: string;
  content: string;
  metadata: {
    name?: string;
    path?: string;
    tag?: string;
  };
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  path: string;
  created_at: string;
  tag: string;
}

const DocumentList: React.FC = () => {
  console.log('[DocumentList] Component rendering');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    console.log('[DocumentList] Component mounting');
    
    // Check environment variables
    const envCheck = checkEnvironmentVariables();
    console.log('[DocumentList] Environment check:', envCheck);
    
    if (!envCheck.success) {
      setError(`Environment error: ${envCheck.message}`);
      setLoading(false);
      return;
    }
    
    console.log('[DocumentList] Environment variables:', {
      supabaseUrl: supabaseUrl?.substring(0, 5) + "...",
      supabaseKey: supabaseKey ? "Present" : "Missing"
    });
    
    fetchDocuments();
    
    return () => {
      console.log('[DocumentList] Component unmounting');
    };
  }, []);

  const fetchDocuments = async () => {
    console.log('[DocumentList] Fetching documents');
    try {
      // Check if Supabase is properly initialized
      if (!supabaseUrl || !supabaseKey) {
        const errorMsg = 'Supabase configuration is missing. Please check environment variables.';
        console.error('[DocumentList] ' + errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      console.log('[DocumentList] Making Supabase query');
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DocumentList] Error fetching documents:', error);
        throw error;
      }
      
      // Transform the data to match the expected Document interface
      const transformedData = data?.map((doc: DatabaseDocument) => ({
        id: doc.id,
        name: doc.metadata.name || 'Unnamed Document',
        path: doc.metadata.path || '',
        created_at: doc.created_at || new Date().toISOString(),
        tag: doc.metadata.tag || 'untagged'
      })) || [];
      
      console.log(`[DocumentList] Fetched ${transformedData.length} documents`);
      setDocuments(transformedData);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      console.error('[DocumentList] Error fetching documents:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('[DocumentList] Fetch completed, loading state set to false');
    }
  };

  const handleDelete = async (id: string, path: string) => {
    console.log(`[DocumentList] Deleting document: ${id}, path: ${path}`);
    try {
      // Use backend API to check if bucket exists
      console.log('[DocumentList] Checking if storage bucket exists via backend API');
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/check-bucket-exists`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bucketName: 'documents' })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'success' || !data.exists) {
          console.error('[DocumentList] Documents bucket does not exist');
          throw new Error('Documents storage is not properly configured');
        }
      } catch (err) {
        console.error('[DocumentList] Error checking storage bucket:', err);
        throw err;
      }
      
      // Delete from Storage
      console.log('[DocumentList] Deleting from storage');
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([path]);
      
      if (storageError) {
        console.error('[DocumentList] Error deleting document from storage:', storageError);
        throw storageError;
      }

      // Delete from database
      console.log('[DocumentList] Deleting from database');
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (dbError) {
        console.error('[DocumentList] Error deleting document from database:', dbError);
        throw dbError;
      }

      console.log('[DocumentList] Document deleted successfully');
      // Update local state
      setDocuments(documents.filter(doc => doc.id !== id));
      
      // Show success message
      setSuccess('Document deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      console.error('[DocumentList] Error deleting document:', err);
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) {
    console.log('[DocumentList] Rendering loading state');
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0078D4] mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('[DocumentList] Rendering error state:', error);
    return (
      <div className="text-red-600 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900/20 rounded">
        <p className="mb-2">{error}</p>
        <button 
          onClick={() => {
            console.log('[DocumentList] Retry button clicked');
            setError(null);
            setLoading(true);
            fetchDocuments();
          }}
          className="text-sm bg-red-200 dark:bg-red-800 px-3 py-1 rounded hover:bg-red-300 dark:hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  console.log('[DocumentList] Rendering document list, count:', documents.length);
  return (
    <div className="space-y-4">
      {success && (
        <div className="text-green-600 dark:text-green-400 p-4 bg-green-100 dark:bg-green-900/20 rounded mb-4">
          <p>{success}</p>
        </div>
      )}
      {documents.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No documents available.</p>
      ) : (
        documents.map(doc => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
          >
            <div className="flex-1">
              <h3 className="text-gray-800 dark:text-gray-100 font-medium">{doc.name}</h3>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
                <span className="text-sm px-2 py-1 bg-[#0078D4]/10 text-[#0078D4] dark:text-[#0078D4] rounded">
                  {doc.tag || 'untagged'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  console.log('[DocumentList] View document button clicked for:', doc.id);
                  
                  // Check if the storage bucket exists using backend API
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                  fetch(`${apiUrl}/api/check-bucket-exists`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ bucketName: 'documents' })
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error(`API error: ${response.status}`);
                    }
                    return response.json();
                  })
                  .then(data => {
                    if (data.status !== 'success' || !data.exists) {
                      console.error('[DocumentList] Documents bucket does not exist');
                      throw new Error('Documents storage is not properly configured');
                    }
                    
                    // If bucket exists, get the URL
                    // Extract the file path from the full path (remove the /documents/ prefix if present)
                    const filePath = doc.path.startsWith('/documents/') ? doc.path.substring('/documents/'.length) : doc.path;
                    console.log('[DocumentList] Getting URL for file path:', filePath);
                    
                    const url = supabase.storage.from('documents').getPublicUrl(filePath).data?.publicUrl;
                    if (url) {
                      console.log('[DocumentList] Opening URL:', url);
                      window.open(url);
                    } else {
                      console.error('[DocumentList] Could not generate document URL');
                      setError('Could not generate document URL');
                      setTimeout(() => setError(null), 3000);
                    }
                  })
                  .catch(err => {
                    console.error('[DocumentList] Error viewing document:', err);
                    setError(err instanceof Error ? err.message : 'Error viewing document');
                    setTimeout(() => setError(null), 3000);
                  });
                }}
                className="text-[#0078D4] hover:text-[#0078D4]/80 p-2 rounded-full"
                title="View document"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  console.log('[DocumentList] Delete document button clicked for:', doc.id);
                  handleDelete(doc.id, doc.path);
                }}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full"
                title="Delete document"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DocumentList; 