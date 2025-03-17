import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';
import DocumentList from '../components/documents/DocumentList';
import DocumentsErrorBoundary from '../components/documents/DocumentsErrorBoundary';
import { checkEnvironmentVariables, testSupabaseConnection } from '../utils/envCheck';
import { debugSupabaseInit } from '../utils/supabaseDebug';
import { debugAuthFlow, checkAdminStatus } from '../utils/authDebug';

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
      .from('documents')
      .select('*')
      .eq('metadata->tag', tag);
    
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
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Function to refresh all documents
  const refreshDocuments = async () => {
    debugLog('Refreshing all documents');
    try {
      // Fetch documents with tag 'pleading' (or any other tag you're using)
      const docs = await fetchDocumentsByTag('pleading');
      setTaggedDocuments(docs || []);
      
      debugLog(`Refreshed documents: found ${docs.length} pleading documents`);
      return true;
    } catch (err) {
      console.error('Error refreshing documents:', err);
      return false;
    }
  };

  // Enhanced logging for component mounting
  useEffect(() => {
    console.log("[Documents] Component mounting");
    
    // Check environment variables
    const envCheck = checkEnvironmentVariables();
    console.log("[Documents] Environment check:", envCheck);
    
    if (!envCheck.success) {
      setAuthError(`Environment error: ${envCheck.message}`);
      setLoading(false);
      return;
    }
    
    console.log("[Documents] Environment variables:", {
      supabaseUrl: supabaseUrl?.substring(0, 5) + "...",
      supabaseKey: supabaseKey ? "Present" : "Missing"
    });
    
    const initializeComponent = async () => {
      try {
        // Debug Supabase initialization
        console.log("[Documents] Running Supabase initialization debug");
        const debugResult = await debugSupabaseInit();
        console.log("[Documents] Supabase debug result:", debugResult);
        
        if (!debugResult.success) {
          setAuthError(`Supabase initialization error: ${debugResult.message}`);
          setLoading(false);
          return;
        }
        
        // Debug authentication flow
        console.log("[Documents] Debugging authentication flow");
        const authResult = await debugAuthFlow();
        console.log("[Documents] Auth flow debug result:", authResult);
        
        if (!authResult.success) {
          setAuthError(`Authentication error: ${authResult.message}`);
          setLoading(false);
          return;
        }
        
        if (!authResult.isAuthenticated) {
          console.log("[Documents] No user found, redirecting to login");
          navigate('/login');
          return;
        }
        
        // Check admin status
        console.log("[Documents] Checking admin status");
        const adminResult = await checkAdminStatus();
        console.log("[Documents] Admin status check result:", adminResult);
        
        setIsAdmin(adminResult.success && adminResult.isAdmin === true);
        
        // Check if documents storage bucket exists
        console.log("[Documents] Checking if documents storage bucket exists");
        try {
          // Use our backend API to check if the bucket exists (using service role key)
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiUrl}/api/check-bucket-exists`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bucketName: 'documents' })
          });
          
          const result = await response.json();
          
          if (result.error) {
            console.error("[Documents] Error checking bucket:", result.error);
            setUploadError("Error checking storage buckets: " + result.error);
          } else if (!result.exists) {
            console.log("[Documents] Documents bucket does not exist, attempting to create it");
            
            try {
              // Try to create the bucket using the backend API
              const createResponse = await fetch(`${apiUrl}/api/create-bucket`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bucketName: 'documents' })
              });
              
              const createResult = await createResponse.json();
              
              if (createResult.error) {
                console.error("[Documents] Error creating bucket:", createResult.error);
                setUploadError("Warning: Documents storage bucket does not exist and could not be created automatically. Please contact an administrator to create it in the Supabase dashboard.");
              } else {
                console.log("[Documents] Bucket created successfully:", createResult);
                setUploadSuccess("Documents storage bucket created successfully!");
                setTimeout(() => setUploadSuccess(null), 3000);
              }
            } catch (err) {
              console.error("[Documents] Error creating bucket:", err);
              setUploadError("Warning: Documents storage bucket does not exist. Please contact an administrator to create it in the Supabase dashboard.");
            }
          } else {
            console.log("[Documents] Documents bucket exists");
            // Clear any existing error messages about the bucket
            if (uploadError && uploadError.includes("bucket does not exist")) {
              setUploadError(null);
            }
          }
        } catch (err) {
          console.error("[Documents] Error checking storage bucket:", err);
          setUploadError("Error checking storage configuration. Please try again later.");
        }
        
        // Fetch documents if user is admin
        if (adminResult.success && adminResult.isAdmin) {
          console.log("[Documents] Fetching tagged documents");
          try {
            const docs = await fetchDocumentsByTag('pleading');
            console.log("[Documents] Fetched documents:", docs.length);
            setTaggedDocuments(docs || []);
          } catch (err) {
            console.error("[Documents] Error fetching tagged documents:", err);
          }
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error("[Documents] Initialization error:", error);
        setAuthError('Unexpected error during initialization: ' + (error.message || 'Unknown error'));
        setLoading(false);
      }
    };
    
    initializeComponent();
  }, [navigate]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isAdmin) return;

    debugLog('Uploading file:', file.name);
    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      // Convert file to base64 for sending to backend
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const base64Content = e.target?.result?.toString().split(',')[1];
          if (!base64Content) {
            throw new Error('Failed to convert file to base64');
          }
          
          debugLog('Sending file to backend API for upload');
          
          // Use our backend endpoint which has the service role key
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiUrl}/api/upload-file`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              fileContent: base64Content,
              contentType: file.type
            })
          });
          
          const result = await response.json();
          
          if (!response.ok || result.status === 'error') {
            throw new Error(result.message || 'Failed to upload file');
          }
          
          // Use the path returned from the backend
          const filePath = result.path;
          
          debugLog('File uploaded via backend, inserting record');
          const { error: insertError } = await supabase.from('documents').insert({
            content: file.name,
            metadata: {
              name: file.name,
              path: filePath,
              created_at: new Date().toISOString(),
              tag: 'untagged' // Default tag
            }
          });
          
          if (insertError) {
            console.error('Database insert error:', insertError);
            if (insertError.message?.includes('permission') || insertError.code === 'PGRST301') {
              throw new Error('Permission denied: You do not have permission to insert records. This may be due to missing RLS policies for the documents table.');
            } else {
              throw insertError;
            }
          }

          debugLog('Upload complete');
          setUploadSuccess('Document uploaded successfully!');
          setTimeout(() => setUploadSuccess(null), 3000);
          if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
          
          // Refresh the document list with all documents
          await refreshDocuments();
          debugLog('Documents refreshed after upload');
        } catch (err: any) {
          const errorMessage = `Failed to upload document: ${err instanceof Error ? err.message : 'Unknown error'}`;
          console.error(errorMessage, err);
          setUploadError(errorMessage);
          setTimeout(() => setUploadError(null), 5000);
        } finally {
          setIsUploading(false);
        }
      };
      
      // Start reading the file as data URL
      fileReader.readAsDataURL(file);
    } catch (err: any) {
      const errorMessage = `Failed to prepare file: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error(errorMessage, err);
      setUploadError(errorMessage);
      setTimeout(() => setUploadError(null), 5000);
      setIsUploading(false);
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
            onClick={() => navigate('/')}
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
            onClick={() => navigate('/')}
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
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <svg 
                    className="animate-spin h-5 w-5 mr-2" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
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
                </>
              )}
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

// Wrap the Documents component with the error boundary
const DocumentsWithErrorBoundary: React.FC = () => {
  return (
    <DocumentsErrorBoundary>
      <Documents />
    </DocumentsErrorBoundary>
  );
};

export default DocumentsWithErrorBoundary; 