import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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

interface Document {
  id: string;
  name: string;
  path: string;
  created_at: string;
  tag: string;
}

const DocumentList: React.FC = () => {
  debugLog('Rendering DocumentList component');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    debugLog('Fetching documents');
    try {
      // Check if Supabase is properly initialized
      if (!supabaseUrl || !supabaseKey) {
        const errorMsg = 'Supabase configuration is missing. Please check environment variables.';
        console.error(errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('lexpert.documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
      
      debugLog(`Fetched ${data?.length || 0} documents`);
      setDocuments(data || []);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      console.error('Error fetching documents:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, path: string) => {
    debugLog(`Deleting document: ${id}, path: ${path}`);
    try {
      // Delete from Storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([path]);
      
      if (storageError) {
        console.error('Error deleting document from storage:', storageError);
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('lexpert.documents')
        .delete()
        .eq('id', id);
      
      if (dbError) {
        console.error('Error deleting document from database:', dbError);
        throw dbError;
      }

      debugLog('Document deleted successfully');
      // Update local state
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      console.error('Error deleting document:', err);
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) {
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
    return (
      <div className="text-red-600 dark:text-red-400 p-4 bg-red-100 dark:bg-red-900/20 rounded">
        <p className="mb-2">{error}</p>
        <button 
          onClick={() => {
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

  return (
    <div className="space-y-4">
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
                  const url = supabase.storage.from('documents').getPublicUrl(doc.path).data?.publicUrl;
                  if (url) {
                    window.open(url);
                  } else {
                    setError('Could not generate document URL');
                    setTimeout(() => setError(null), 3000);
                  }
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
                onClick={() => handleDelete(doc.id, doc.path)}
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