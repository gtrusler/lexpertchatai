import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';
import DocumentList from '../components/documents/DocumentList';
import DocumentsErrorBoundary from '../components/documents/DocumentsErrorBoundary';
import { checkEnvironmentVariables } from '../utils/envCheck';
import { debugSupabaseInit } from '../utils/supabaseDebug';
import { debugAuthFlow, checkAdminStatus } from '../utils/authDebug';
import { storage } from '../services/supabase';
import TagSelector from '../components/tags/TagSelector';
import tagService from '../services/tagService';

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
        createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null })
      })
    }
  };
}

// Utility function to fetch documents by tags
const fetchDocumentsByTags = async (tagIds: string[]) => {
  debugLog(`Fetching documents with tags: ${tagIds.join(', ')}`);
  try {
    if (tagIds.length === 0) {
      // If no tags selected, fetch all documents
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all documents:', error);
        throw error;
      }
      
      debugLog(`Found ${data?.length || 0} documents (no tag filter)`);
      return data || [];
    }
    
    // Fetch documents that have any of the selected tags
    const documents = [];
    
    for (const tagId of tagIds) {
      try {
        const docsWithTag = await tagService.getDocumentsWithTag(tagId);
        documents.push(...docsWithTag);
      } catch (err) {
        console.error(`Error fetching documents with tag ${tagId}:`, err);
      }
    }
    
    // Remove duplicates (a document might have multiple selected tags)
    const uniqueDocIds = new Set();
    const uniqueDocs = [];
    
    for (const doc of documents) {
      if (!uniqueDocIds.has(doc.id)) {
        uniqueDocIds.add(doc.id);
        uniqueDocs.push(doc);
      }
    }
    
    debugLog(`Found ${uniqueDocs.length} unique documents with selected tags`);
    return uniqueDocs;
  } catch (err) {
    console.error('Error fetching documents by tags:', err);
    return [];
  }
};



const Documents = () => {
  debugLog('Rendering Documents component');
  const [isAdmin, setIsAdmin] = useState(false);
  const [taggedDocuments, setTaggedDocuments] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Function to refresh all documents
  const refreshDocuments = async () => {
    debugLog('Refreshing all documents');
    try {
      // Fetch documents with selected tags
      const docs = await fetchDocumentsByTags(selectedTagIds);
      setTaggedDocuments(docs || []);
      
      debugLog(`Refreshed documents: found ${docs.length} documents with selected tags`);
      return true;
    } catch (err) {
      console.error('Error refreshing documents:', err);
      return false;
    }
  };
  
  // Handle tag selection changes
  const handleTagSelectionChange = async (selectedTags: string[]) => {
    debugLog(`Tag selection changed: ${selectedTags.join(', ')}`);
    setSelectedTagIds(selectedTags);
    setLoading(true);
    
    try {
      const docs = await fetchDocumentsByTags(selectedTags);
      setTaggedDocuments(docs || []);
      debugLog(`Filtered to ${docs.length} documents with selected tags`);
    } catch (err) {
      console.error('Error filtering documents by tags:', err);
      setUploadError('Failed to filter documents by tags. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // We don't need to fetch tags here as the TagSelector component handles that internally

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
        
        if (!authResult.success || !authResult.isAuthenticated) {
          setAuthError(`Please log in to view documents`);
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
        
        // Check if documents storage bucket exists and set up necessary tables
        console.log("[Documents] Checking if documents storage bucket exists");
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          
          // Step 1: Check if the documents bucket exists
          console.log(`[Documents] Checking bucket existence via backend API: ${apiUrl}/api/check-bucket-exists`);
          const checkResponse = await fetch(`${apiUrl}/api/check-bucket-exists`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bucketName: 'documents' }),
          });
          
          if (!checkResponse.ok) {
            console.warn(`[Documents] API returned status ${checkResponse.status}, falling back to direct check`);
            // Fallback to direct check if API fails
            await checkBucketDirectly();
            return;
          }
          
          const bucketData = await checkResponse.json();
          
          // Step 2: If bucket doesn't exist, create it
          if (!bucketData.exists) {
            console.log("[Documents] Documents bucket does not exist, creating via API");
            const createResponse = await fetch(`${apiUrl}/api/create-bucket`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ bucketName: 'documents' }),
            });
            
            if (!createResponse.ok) {
              console.error(`[Documents] API returned status ${createResponse.status} when creating bucket`);
              setUploadError("The document storage setup failed. Please contact an administrator.");
              return;
            }
            
            const createResult = await createResponse.json();
            
            if (createResult.exists) {
              console.log("[Documents] Bucket created successfully via backend API");
              setUploadSuccess("Documents storage setup completed successfully!");
              setTimeout(() => setUploadSuccess(null), 3000);
            } else {
              console.error("[Documents] Error creating bucket via backend API:", createResult.error);
              setUploadError("The document storage is being set up. Please try again in a few moments.");
              return;
            }
          } else {
            console.log("[Documents] Documents bucket exists according to backend API");
            // Clear any existing error messages about the bucket
            if (uploadError && uploadError.includes("bucket does not exist")) {
              setUploadError(null);
            }
          }
          
          // Step 3: Set up RLS policies for the bucket
          console.log(`[Documents] Setting up bucket policies via API: ${apiUrl}/api/setup-bucket-policies`);
          const policiesResponse = await fetch(`${apiUrl}/api/setup-bucket-policies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bucketName: 'documents' }),
          });
          
          if (!policiesResponse.ok) {
            console.warn(`[Documents] API returned status ${policiesResponse.status} when setting up policies`);
            // Not critical, so we continue
          } else {
            const policiesResult = await policiesResponse.json();
            console.log("[Documents] Bucket policies setup result:", policiesResult);
          }
          
          // Step 4: Create template_documents table if it doesn't exist
          console.log(`[Documents] Creating template_documents table via API: ${apiUrl}/api/create-template-documents-table`);
          const tableResponse = await fetch(`${apiUrl}/api/create-template-documents-table`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!tableResponse.ok) {
            console.warn(`[Documents] API returned status ${tableResponse.status} when creating template_documents table`);
            // Not critical for document viewing, so we continue
          } else {
            const tableResult = await tableResponse.json();
            console.log("[Documents] Template documents table setup result:", tableResult);
          }
          
        } catch (err) {
          console.error("[Documents] Error setting up document storage:", err);
          setUploadError("Error checking storage configuration. Please try again later.");
          // Fallback to direct check if API completely fails
          await checkBucketDirectly();
        }
        
        // Fallback function to check bucket directly with Supabase
        async function checkBucketDirectly() {
          try {
            console.log("[Documents] Falling back to direct Supabase bucket check");
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();
            
            if (listError) {
              console.error("[Documents] Error listing buckets:", listError);
              setUploadError(`Supabase connection issue: ${listError.message || 'Unknown error'}. Please try again later.`);
              return;
            }
            
            const bucketExists = buckets ? buckets.some((b: { name: string }) => b.name === 'documents') : false;
            
            if (!bucketExists) {
              console.log("[Documents] Documents bucket does not exist, attempting to create it directly");
              
              try {
                const { error: createError } = await supabase.storage.createBucket('documents', {
                  public: true,
                  fileSizeLimit: 10485760 // 10MB
                });
                
                if (createError) {
                  if (createError.message && createError.message.includes('already exists')) {
                    console.log("[Documents] Bucket 'documents' already exists, proceeding");
                    if (uploadError && uploadError.includes("bucket does not exist")) {
                      setUploadError(null);
                    }
                  } else {
                    console.error("[Documents] Error creating bucket:", createError);
                    setUploadError("Warning: Documents storage bucket does not exist and could not be created automatically. Please contact an administrator.");
                  }
                } else {
                  console.log("[Documents] Bucket created successfully directly");
                  setUploadSuccess("Documents storage bucket created successfully!");
                  setTimeout(() => setUploadSuccess(null), 3000);
                }
              } catch (err) {
                console.error("[Documents] Error creating bucket:", err);
                setUploadError("Warning: Documents storage bucket does not exist. Please contact an administrator.");
              }
            } else {
              console.log("[Documents] Documents bucket exists");
              if (uploadError && uploadError.includes("bucket does not exist")) {
                setUploadError(null);
              }
            }
          } catch (err) {
            console.error("[Documents] Error in direct bucket check:", err);
            setUploadError("Error checking storage configuration. Please try again later.");
          }
        }
        
        // Fetch documents and tags if user is admin
        if (adminResult.success && adminResult.isAdmin) {
          console.log("[Documents] Fetching documents and tags");
          try {
            // Fetch documents
            const docs = await fetchDocumentsByTags(selectedTagIds);
            console.log("[Documents] Fetched documents:", docs.length);
            setTaggedDocuments(docs || []);
            
            // The TagSelector component will fetch tags internally
          } catch (err) {
            console.error("[Documents] Error fetching data:", err);
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
      // Create a unique file path for the upload
      const timestamp = new Date().getTime();
      const filePath = `documents/${timestamp}_${file.name}`;
      
      debugLog(`Uploading to path: ${filePath}`);
      
      // Upload the file directly to Supabase storage using the enhanced storage service
      // The storage service now handles bucket creation and validation
      const { data, error } = await storage.uploadFile('documents', filePath, file);
      
      if (error) {
        console.error('[Documents] Upload error:', error);
        throw new Error(`File upload failed: ${error.message}`);
      }
      
      debugLog('Upload successful:', data);
      
      // Get the signed URL of the uploaded file
      const { data: urlData, error: urlError } = await storage.getFileUrl('documents', filePath);
      if (urlError) {
        console.error('Error getting signed URL:', urlError);
        setUploadError('Error generating file URL');
        setIsUploading(false);
        return;
      }
      
      const signedUrl = urlData?.signedUrl || '';
      debugLog('File URL:', signedUrl);
      
      // Insert record into the database
      debugLog('Inserting record into database');
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
          <h2 className="text-xl font-semibold text-[#0078D4] dark:text-[#0078D4] mb-4">Sign In Required</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">Please sign in to view and manage your documents.</p>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-[#0078D4] text-white px-4 py-2 rounded-md hover:bg-[#0078D4]/90 flex-1"
            >
              Sign In
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

        {/* Tag Filter Section */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border mb-8`}>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Filter Documents by Tags</h2>
          <div className="mb-4">
            <TagSelector 
              selectedTags={selectedTagIds} 
              onChange={handleTagSelectionChange} 
              entityType="document"
              className="w-full"
            />
          </div>
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