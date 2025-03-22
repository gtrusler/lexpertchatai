import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { checkEnvironmentVariables } from '../../utils/envCheck';
import { storage } from '../../services/supabase';
import TagSelector from '../tags/TagSelector';
import tagService from '../../services/tagService';

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
        createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null })
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

interface Template {
  id: string;
  name: string;
}

interface Document {
  id: string;
  name: string;
  path: string;
  created_at: string;
  tag: string;
  templates?: Template[];
  tags?: string[];
}

const DocumentList: React.FC = () => {
  console.log('[DocumentList] Component rendering');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [documentTagsMap, setDocumentTagsMap] = useState<Record<string, string[]>>({});
  const [tagsLoading, setTagsLoading] = useState<Record<string, boolean>>({});

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

      // First, get the actual files from the storage bucket
      console.log('[DocumentList] Fetching files from storage bucket');
      
      // We'll implement a flat structure approach with metadata for associations
      let allStorageFiles: any[] = [];
      let storageFiles: any[] = [];
      try {
        console.log('[DocumentList] Listing all files in documents bucket');
        
        // First, list files at the root level
        const { data: rootFiles, error: rootError } = await supabase.storage
          .from('documents')
          .list('', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });
          
        if (rootError) {
          console.error('[DocumentList] Error listing root files:', rootError);
          throw new Error(`Error listing root files: ${rootError.message}`);
        }
        
        // Add root files to our collection
        const files = rootFiles || [];
        allStorageFiles = [...files];
        
        // Check if there are any folders at the root level
        const folders = files.filter((item: any) => item.id === null);
        
        // If we have folders, list files in each folder
        for (const folder of folders) {
          console.log(`[DocumentList] Listing files in subfolder: ${folder.name}`);
          
          const { data: folderFiles, error: folderError } = await supabase.storage
            .from('documents')
            .list(folder.name, {
              limit: 100,
              sortBy: { column: 'name', order: 'asc' }
            });
            
          if (folderError) {
            console.error(`[DocumentList] Error listing files in folder ${folder.name}:`, folderError);
            // Don't throw here, just log and continue with other folders
            continue;
          }
          
          // Add folder path to each file and add to our collection
          const filesWithPath = (folderFiles || []).map((file: any) => ({
            ...file,
            // Store the full path for later use
            fullPath: `${folder.name}/${file.name}`
          }));
          
          allStorageFiles = [...allStorageFiles, ...filesWithPath];
        }
        
        // Filter out folders, we only want files
        storageFiles = allStorageFiles.filter((file: any) => file.id !== null);
        
        console.log(`[DocumentList] Found ${storageFiles.length} total files in bucket:`, storageFiles);
      } catch (err: any) {
        console.error('[DocumentList] Error accessing storage:', err);
        throw new Error(`Error accessing storage: ${err.message}`);
      }
      
      console.log('[DocumentList] Storage files:', storageFiles);
      const storageFilePaths = new Set(storageFiles.map((file: any) => file.name) || []);
      
      console.log(`[DocumentList] Found ${storageFiles.length || 0} files in storage bucket`);
      
      // Now get the database records
      console.log('[DocumentList] Making Supabase query for database records');
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DocumentList] Error fetching documents from database:', error);
        throw error;
      }
      
      // Filter out database records that don't have corresponding files in storage
      const validDocuments = data?.filter((doc: DatabaseDocument) => {
        const docPath = doc.metadata.path || '';
        // Extract the filename from the path (remove any prefix like /documents/)
        const fileName = docPath.includes('/') ? docPath.split('/').pop() || '' : docPath;
        return storageFilePaths.has(fileName) || storageFilePaths.has(docPath);
      }) || [];
      
      console.log(`[DocumentList] Filtered ${data?.length || 0} database records to ${validDocuments.length} valid documents`);
      
      // If there are invalid records, clean them up from the database
      const invalidDocuments = data?.filter((doc: DatabaseDocument) => !validDocuments.includes(doc)) || [];
      if (invalidDocuments.length > 0) {
        console.log(`[DocumentList] Found ${invalidDocuments.length} invalid documents to remove from database`);
        for (const doc of invalidDocuments) {
          console.log(`[DocumentList] Removing invalid document from database: ${doc.id}`);
          await supabase
            .from('documents')
            .delete()
            .eq('id', doc.id);
        }
      }
      
      // Transform the valid data to match the expected Document interface
      const transformedData = validDocuments.map((doc: DatabaseDocument): Document => ({
        id: doc.id,
        name: doc.metadata.name || 'Unnamed Document',
        path: doc.metadata.path || '',
        created_at: doc.created_at || new Date().toISOString(),
        tag: doc.metadata.tag || 'untagged',
        templates: [] // Will be populated below
      }));
      
      // Fetch template connections for each document
      console.log('[DocumentList] Fetching template connections');
      try {
        // Check if template_documents table exists by making a small query
        const { error: tableCheckError } = await supabase
          .from('template_documents')
          .select('template_id')
          .limit(1);
          
        // If we get a specific error about the relation not existing, handle it gracefully
        if (tableCheckError) {
          if (tableCheckError.code === '42P01') {
            console.log('[DocumentList] template_documents table does not exist yet, skipping template connections');
          } else {
            console.warn('[DocumentList] Error checking template_documents table:', tableCheckError);
          }
          // Continue without template connections
        } else {
          // Table exists, proceed with fetching connections
          console.log('[DocumentList] template_documents table exists, fetching connections');
          const { data: templateConnections, error: templateError } = await supabase
            .from('template_documents')
            .select('template_id, document_id');
            
          if (templateError) {
            console.error('[DocumentList] Error fetching template connections:', templateError);
          } else {
            console.log(`[DocumentList] Found ${templateConnections?.length || 0} template connections`);
            
            if (templateConnections && templateConnections.length > 0) {
              // Get all templates
              const { data: templatesData, error: templatesError } = await supabase
                .from('templates')
                .select('id, name');
                
              if (templatesError) {
                console.error('[DocumentList] Error fetching templates:', templatesError);
              } else if (templatesData) {
                console.log(`[DocumentList] Found ${templatesData.length} templates`);
                
                // Create a map of template id to template object for quick lookup
                const templatesMap = new Map<string, Template>();
                templatesData.forEach((template: Template) => {
                  templatesMap.set(template.id, template);
                });
                
                // For each document, find its template connections
                transformedData.forEach((doc: Document) => {
                  const docTemplates: Template[] = [];
                  templateConnections.forEach((conn: any) => {
                    if (conn.document_id === doc.id) {
                      const template = templatesMap.get(conn.template_id);
                      if (template) {
                        docTemplates.push(template);
                      }
                    }
                  });
                  doc.templates = docTemplates;
                  if (docTemplates.length > 0) {
                    console.log(`[DocumentList] Document ${doc.name} has ${docTemplates.length} templates`);
                  }
                });
              }
            }
          }
        }
      } catch (templateErr) {
        console.error('[DocumentList] Error processing template connections:', templateErr);
        // Continue without template connections rather than failing the whole document list
      }
      
      console.log(`[DocumentList] Final document count: ${transformedData.length}`);
      setDocuments(transformedData);
      
      // Fetch tags for each document
      console.log('[DocumentList] Fetching tags for documents');
      const tagsMap: Record<string, string[]> = {};
      const loadingMap: Record<string, boolean> = {};
      
      for (const doc of transformedData) {
        loadingMap[doc.id] = true;
      }
      setTagsLoading(loadingMap);
      
      try {
        // Check if tag_hierarchy table exists
        const { error: tableCheckError } = await supabase
          .from('tag_hierarchy')
          .select('id')
          .limit(1);
          
        if (tableCheckError) {
          if (tableCheckError.code === '42P01') {
            console.log('[DocumentList] tag_hierarchy table does not exist yet, skipping tag fetching');
          } else {
            console.warn('[DocumentList] Error checking tag_hierarchy table:', tableCheckError);
          }
          // Continue without tags
          for (const doc of transformedData) {
            loadingMap[doc.id] = false;
          }
          setTagsLoading({...loadingMap});
        } else {
          // Table exists, fetch tags for each document
          for (const doc of transformedData) {
            try {
              const tags = await tagService.getDocumentTags(doc.id);
              tagsMap[doc.id] = tags.map(tag => tag.id);
              loadingMap[doc.id] = false;
              setTagsLoading({...loadingMap});
              console.log(`[DocumentList] Fetched ${tags.length} tags for document ${doc.id}`);
            } catch (tagErr) {
              console.error(`[DocumentList] Error fetching tags for document ${doc.id}:`, tagErr);
              loadingMap[doc.id] = false;
              setTagsLoading({...loadingMap});
            }
          }
          setDocumentTagsMap(tagsMap);
        }
      } catch (tagErr) {
        console.error('[DocumentList] Error processing document tags:', tagErr);
        // Continue without tags rather than failing the whole document list
        for (const doc of transformedData) {
          loadingMap[doc.id] = false;
        }
        setTagsLoading({...loadingMap});
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      console.error('[DocumentList] Error fetching documents:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('[DocumentList] Fetch completed, loading state set to false');
    }
  };

  const handleTagChange = async (documentId: string, selectedTags: string[]) => {
    console.log(`[DocumentList] Updating tags for document ${documentId}`, selectedTags);
    try {
      // Get current tags for the document
      const currentTags = await tagService.getDocumentTags(documentId);
      const currentTagIds = currentTags.map(tag => tag.id);
      
      // Remove tags that are no longer selected
      const tagsToRemove = currentTagIds.filter(tagId => !selectedTags.includes(tagId));
      for (const tagId of tagsToRemove) {
        await tagService.removeTagFromDocument(documentId, tagId);
      }
      
      // Add newly selected tags
      const tagsToAdd = selectedTags.filter(tagId => !currentTagIds.includes(tagId));
      for (const tagId of tagsToAdd) {
        await tagService.addTagToDocument(documentId, tagId);
      }
      
      // Update the local state
      setDocumentTagsMap(prev => ({
        ...prev,
        [documentId]: selectedTags
      }));
      
      console.log(`[DocumentList] Updated tags for document ${documentId}: removed ${tagsToRemove.length}, added ${tagsToAdd.length}`);
      setSuccess('Tags updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tags';
      console.error(`[DocumentList] Error updating tags for document ${documentId}:`, err);
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const handleDelete = async (id: string, path: string) => {
    console.log(`[DocumentList] Deleting document: ${id}, path: ${path}`);
    try {
      // Use backend API to check if bucket exists
      console.log('[DocumentList] Checking if storage bucket exists via backend API');
      
      // First delete the file from storage
      console.log(`[DocumentList] Deleting file from storage: ${path}`);
      const { error: storageError } = await storage.deleteFile('documents', path);
      
      if (storageError) {
        console.error('[DocumentList] Error deleting file from storage:', storageError);
        throw new Error(`Error deleting file from storage: ${storageError.message}`);
      }
      
      // Then delete the database record
      console.log(`[DocumentList] Deleting database record: ${id}`);
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
        
      if (dbError) {
        console.error('[DocumentList] Error deleting database record:', dbError);
        throw new Error(`Error deleting database record: ${dbError.message}`);
      }
      
      // Update the UI by filtering out the deleted document
      setDocuments(documents.filter(doc => doc.id !== id));
      setSuccess('Document deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      console.error('[DocumentList] Error deleting document:', err);
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {success && (
        <div className="text-green-500 dark:text-green-400 p-4 mb-4 rounded-lg bg-green-50 dark:bg-green-900/20">
          <p className="font-semibold">{success}</p>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0078D4]"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 dark:text-red-400 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
          <p className="font-semibold">Error: {error}</p>
          <button 
            onClick={fetchDocuments} 
            className="mt-2 px-4 py-2 bg-[#0078D4] hover:bg-[#0078D4]/80 text-white rounded"
          >
            Retry
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No documents found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Upload documents from the chat interface or using the upload button
          </p>
        </div>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} className="border-b dark:border-gray-700 py-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{doc.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(doc.created_at).toLocaleDateString()} • {doc.tag}
              </p>
              <div className="mt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tags:</div>
                {tagsLoading[doc.id] ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#0078D4] mr-2"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Loading tags...</span>
                  </div>
                ) : (
                  <TagSelector
                    selectedTags={documentTagsMap[doc.id] || []}
                    onChange={(tags) => handleTagChange(doc.id, tags)}
                    entityType="document"
                    entityId={doc.id}
                    className="w-full max-w-md"
                  />
                )}
              </div>
              {doc.templates && doc.templates.length > 0 && (
                <div className="mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Used in templates:</span>
                  {doc.templates.map((template, idx) => (
                    <span key={template.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded mr-1">
                      {template.name}{idx < doc.templates!.length - 1 ? '' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  console.log('[DocumentList] View document button clicked for:', doc.id);
                  
                  try {
                    // Extract the file path from the full path
                    // Handle both flat and nested structures
                    let filePath = doc.path;
                    
                    // Remove /documents/ prefix if present
                    if (filePath.startsWith('/documents/')) {
                      filePath = filePath.substring('/documents/'.length);
                    }
                    
                    console.log('[DocumentList] Getting URL for file path:', filePath);
                    
                    // Use the Supabase storage directly to get a signed URL
                    supabase.storage
                      .from('documents')
                      .createSignedUrl(filePath, 3600) // 1 hour expiry
                      .then((result: { data?: { signedUrl?: string } }) => {
                        const url = result.data?.signedUrl;
                        if (url) {
                          console.log('[DocumentList] Opening URL:', url);
                          window.open(url);
                        } else {
                          console.error('[DocumentList] Could not generate document URL');
                          setError('Could not generate document URL');
                          setTimeout(() => setError(null), 3000);
                        }
                      })
                      .catch((err: Error) => {
                        console.error('[DocumentList] Error generating signed URL:', err);
                        setError('Error generating document URL');
                        setTimeout(() => setError(null), 3000);
                      });
                  } catch (err) {
                    console.error('[DocumentList] Error viewing document:', err);
                    setError(err instanceof Error ? err.message : 'Error viewing document');
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
