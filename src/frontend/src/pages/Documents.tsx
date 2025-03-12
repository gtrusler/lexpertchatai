import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';
import DocumentList from '../components/documents/DocumentList';

// Debug flag - set to true to enable console logging
const DEBUG = true;

// Log function that only logs when DEBUG is true
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[Documents]', ...args);
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
        eq: () => ({ data: null, error: { message: 'Supabase client initialization failed' } })
      })
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: { message: 'Supabase client initialization failed' } })
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Supabase client initialization failed' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  };
}

// Utility function to fetch documents by tag
const fetchDocumentsByTag = async (tag: string) => {
  debugLog(`Fetching documents with tag: ${tag}`);
  try {
    const { data, error } = await supabase
      .from('lexpert.documents')
      .select('*')
      .eq('tag', tag);
    
    if (error) {
      console.error('Error fetching documents by tag:', error);
      throw error;
    }
    
    debugLog(`Found ${data?.length || 0} documents with tag: ${tag}`);
    return data || [];
  } catch (err) {
    console.error('Error fetching documents by tag:', err);
    return [];
  }
};

const Documents: React.FC = () => {
  debugLog('Rendering Documents component');
  const [isAdmin, setIsAdmin] = useState(false);
  const [taggedDocuments, setTaggedDocuments] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const checkAdminStatus = async () => {
      debugLog('Checking admin status');
      try {
        setLoading(true);
        
        // Check if Supabase is properly initialized
        if (!supabaseUrl || !supabaseKey) {
          const errorMsg = 'Supabase configuration is missing. Please check environment variables.';
          console.error(errorMsg);
          setAuthError(errorMsg);
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error checking admin status:', error);
          setAuthError('Authentication error: ' + error.message);
          setLoading(false);
          return;
        }
        
        debugLog('Auth response:', data);
        
        if (!data.user) {
          debugLog('No user found, redirecting to login');
          navigate('/login');
          return;
        }
        
        const isUserAdmin = data.user.user_metadata?.role === 'admin';
        debugLog('User admin status:', isUserAdmin);
        setIsAdmin(isUserAdmin);
        setLoading(false);
      } catch (error: any) {
        console.error('Error checking admin status:', error);
        setAuthError('Unexpected error during authentication: ' + (error.message || 'Unknown error'));
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);

  // Fetch tagged documents when admin status changes
  useEffect(() => {
    const fetchTaggedDocs = async () => {
      debugLog('Fetching tagged documents');
      try {
        const docs = await fetchDocumentsByTag('pleading');
        setTaggedDocuments(docs || []);
      } catch (err) {
        console.error('Error fetching tagged documents:', err);
      }
    };
    
    if (isAdmin && !loading) {
      debugLog('User is admin, fetching documents');
      fetchTaggedDocs();
    }
  }, [isAdmin, loading]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isAdmin) return;

    debugLog('Uploading file:', file.name);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const fileName = file.name;
      const filePath = `/documents/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      debugLog('Uploading to storage:', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: false });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      
      debugLog('File uploaded, inserting record');
      const { error: insertError } = await supabase.from('lexpert.documents').insert({
        name: fileName,
        path: filePath,
        created_at: new Date().toISOString(),
        tag: 'untagged' // Default tag
      });
      
      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      debugLog('Upload complete');
      setUploadSuccess('Document uploaded successfully!');
      setTimeout(() => setUploadSuccess(null), 3000);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
      
      // Refresh the document list
      const docs = await fetchDocumentsByTag('pleading');
      setTaggedDocuments(docs || []);
    } catch (err: any) {
      const errorMessage = `Failed to upload document: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error(errorMessage, err);
      setUploadError(errorMessage);
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  const triggerFileInput = () => {
    debugLog('Triggering file input');
    if (fileInputRef.current && isAdmin) {
      fileInputRef.current.click();
    }
  };

  // Render loading state
  if (loading) {
    debugLog('Rendering loading state');
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0078D4] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render auth error
  if (authError) {
    debugLog('Rendering auth error:', authError);
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Authentication Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{authError}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-[#0078D4] text-white px-4 py-2 rounded-md hover:bg-[#0078D4]/90 flex-1"
            >
              Go to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex-1"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render access denied
  if (!isAdmin) {
    debugLog('Rendering access denied');
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">You need admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#0078D4] text-white px-4 py-2 rounded-md hover:bg-[#0078D4]/90 w-full"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render main content
  debugLog('Rendering main content');
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Documents</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#0078D4] text-white px-4 py-2 rounded-md hover:bg-[#0078D4]/90 flex items-center"
            aria-label="Return to dashboard (Alt+B)"
            accessKey="b"
          >
            <svg
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Dedicated Upload Document Section */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border mb-8`}>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Upload Document</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={triggerFileInput}
              className="px-4 py-2 bg-[#0078D4] text-white rounded-md hover:bg-[#0078D4]/90 flex items-center justify-center"
              aria-label="Upload a document (click to select file)"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Upload Document
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
              className="hidden" // Hide the default file input
              aria-hidden="true"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 mt-2 sm:mt-0">
              Supported formats: PDF, DOC, DOCX
            </span>
          </div>
          {uploadError && <div className="text-red-600 dark:text-red-400 mt-2" role="alert">{uploadError}</div>}
          {uploadSuccess && <div className="text-green-600 dark:text-green-400 mt-2" role="alert">{uploadSuccess}</div>}
        </div>

        {/* Tagged Documents Section */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border mb-8`}>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Documents Tagged as 'Pleading' (Test)</h2>
          {taggedDocuments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No documents tagged as 'pleading' yet.</p>
          ) : (
            taggedDocuments.map(doc => (
              <div key={doc.id} className="text-gray-800 dark:text-gray-100">{doc.name}</div>
            ))
          )}
        </div>

        {/* Document Library Section */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Document Library</h2>
          <DocumentList />
        </div>
      </div>
    </div>
  );
};

export default Documents; 