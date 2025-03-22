import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, templates } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TagSelector from '../components/tags/TagSelector';
import tagService from '../services/tagService';

interface Document {
  id: string;
  name: string;
  path: string;
  created_at: string;
  tag: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  prompt?: string;
  content?: string;
  case_history?: string;
  participants?: string;
  objective?: string;
  created_at: string;
  updated_at: string;
}

const EditTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  // We use setTemplate to update the template state, but don't directly use the template variable
  // as we extract its properties into separate state variables
  const [, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [caseHistory, setCaseHistory] = useState('');
  const [participants, setParticipants] = useState('');
  const [objective, setObjective] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        if (!id) {
          setError('No template ID provided');
          setLoading(false);
          return;
        }
        
        console.log(`[EditTemplate] Fetching template with ID: ${id}`);
        const { data, error: fetchError } = await templates.getTemplate(id);

        if (fetchError) {
          console.error('[EditTemplate] Error fetching template:', fetchError);
          throw fetchError;
        }
        
        if (!data) {
          console.error('[EditTemplate] Template not found');
          throw new Error('Template not found');
        }

        console.log('[EditTemplate] Template fetched successfully:', data);
        setTemplate(data);
        setName(data.name);
        setDescription(data.description || '');
        setPrompt(data.prompt || '');
        setCaseHistory(data.case_history || '');
        setParticipants(data.participants || '');
        setObjective(data.objective || '');
        
        // Fetch associated documents
        console.log(`[EditTemplate] Fetching document connections for template: ${id}`);
        try {
          const { data: docConnections, error: docConnectionsError } = await templates.getTemplateDocuments(id);
          
          if (docConnectionsError) {
            // Check if error is due to missing table
            if (docConnectionsError.code === '42P01' && docConnectionsError.message.includes('template_documents')) {
              console.warn('[EditTemplate] template_documents table does not exist yet - this is expected for new installations');
              // Continue without document connections
            } else {
              console.error('[EditTemplate] Error fetching document connections:', docConnectionsError);
              // Don't throw error, just continue without document connections
            }
          } else if (docConnections && docConnections.length > 0) {
            console.log(`[EditTemplate] Found ${docConnections.length} document connections`);
            const documentIds = docConnections.map(conn => conn.document_id);
            setSelectedDocuments(documentIds);
          } else {
            console.log('[EditTemplate] No document connections found');
          }
        } catch (err) {
          console.error('[EditTemplate] Unexpected error fetching document connections:', err);
          // Continue without document connections
        }
        
        // This code has been moved inside the try block above
        
        // Fetch associated tags
        console.log(`[EditTemplate] Fetching tags for template: ${id}`);
        try {
          const tags = await tagService.getTemplateTags(id);
          console.log(`[EditTemplate] Found ${tags.length} tags for template`);
          setSelectedTags(tags.map(tag => tag.id));
        } catch (tagErr) {
          console.error('[EditTemplate] Error fetching template tags:', tagErr);
          // Don't throw here to avoid blocking the template edit
        } finally {
          setTagsLoading(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[EditTemplate] Failed to fetch template: ${errorMessage}`, err);
        setError(`Failed to fetch template: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
    fetchDocuments();
  }, [id]);
  
  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true);
      console.log('[EditTemplate] Fetching documents');
      
      // First, check if the documents bucket exists using our backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      try {
        console.log(`[EditTemplate] Checking if documents bucket exists via API: ${apiUrl}/api/check-bucket-exists`);
        
        const checkBucketResponse = await fetch(`${apiUrl}/api/check-bucket-exists`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bucketName: 'documents' }),
        });
        
        const bucketData = await checkBucketResponse.json();
        
        if (!bucketData.exists) {
          console.warn('[EditTemplate] Documents bucket does not exist, attempting to create it');
          
          // Try to create the bucket
          const createBucketResponse = await fetch(`${apiUrl}/api/create-bucket`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bucketName: 'documents' }),
          });
          
          const createResult = await createBucketResponse.json();
          
          if (!createResult.exists) {
            console.error('[EditTemplate] Failed to create documents bucket:', createResult.error);
            // Continue without throwing to allow template editing without documents
          } else {
            console.log('[EditTemplate] Documents bucket created successfully');
          }
        }
      } catch (bucketError) {
        console.error('[EditTemplate] Error checking/creating bucket:', bucketError);
        // Continue without throwing to allow template editing without documents
      }
      
      // Now try to get the files from the storage bucket
      console.log(`[EditTemplate] Fetching files from storage bucket via API: ${apiUrl}/api/list-bucket-files`);
      
      try {
        const storageResponse = await fetch(`${apiUrl}/api/list-bucket-files`);
        
        if (!storageResponse.ok) {
          const errorMessage = `Failed to fetch storage files: ${storageResponse.status}`;
          console.error(`[EditTemplate] ${errorMessage}`);
          // Continue without throwing to allow template editing without documents
        } else {
      
          const storageData = await storageResponse.json();
          // We only check if the API call was successful, but don't use the files directly
          if (storageData.status !== 'success') {
            console.error('[EditTemplate] Failed to fetch storage files:', storageData.error || 'Unknown error');
          } else {
            console.log(`[EditTemplate] Successfully fetched ${storageData.files?.length || 0} files from storage`);
          }
        }
      } catch (storageError) {
        console.error('[EditTemplate] Error fetching storage files:', storageError);
        // Continue without throwing to allow template editing without documents
      }
      
      // Now get the database records
      console.log('[EditTemplate] Fetching document records from database');
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[EditTemplate] Error fetching document records:', error);
        throw error;
      }
      
      console.log(`[EditTemplate] Successfully fetched ${data?.length || 0} document records`);
      
      // Transform the data to match the Document interface
      const transformedData = data?.map((doc: any) => ({
        id: doc.id,
        name: doc.metadata?.name || 'Unnamed Document',
        path: doc.metadata?.path || '',
        created_at: doc.created_at || new Date().toISOString(),
        tag: doc.metadata?.tag || 'untagged'
      })) || [];
      
      console.log('[EditTemplate] Transformed document data:', transformedData.length);
      setDocuments(transformedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[EditTemplate] Error fetching documents: ${errorMessage}`, err);
      // Don't set error state to avoid blocking the template edit
    } finally {
      setDocumentsLoading(false);
      console.log('[EditTemplate] Document loading completed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    console.log('[EditTemplate] Submitting template update');

    try {
      if (!id) {
        console.error('[EditTemplate] No template ID provided');
        throw new Error('Template ID is required');
      }

      if (name.length > 100) {
        console.error('[EditTemplate] Template name too long');
        throw new Error('Template name must be 100 characters or fewer');
      }

      // Update template basic info
      console.log(`[EditTemplate] Updating template ${id} with name: ${name}`);
      const { error: updateError } = await templates.updateTemplate(id, { 
        name, 
        description,
        prompt,
        case_history: caseHistory,
        participants,
        objective
      });

      if (updateError) {
        console.error('[EditTemplate] Error updating template:', updateError);
        throw updateError;
      }
      
      // Update document connections
      console.log(`[EditTemplate] Updating document connections for template ${id}, selected documents: ${selectedDocuments.length}`);
      try {
        const { error: documentConnectionError } = await templates.updateTemplateDocuments(id, selectedDocuments);
        
        if (documentConnectionError) {
          // Check if error is due to missing table
          if (documentConnectionError.code === 'TABLE_NOT_FOUND' || 
              (documentConnectionError.code === '42P01' && documentConnectionError.message?.includes('template_documents'))) {
            console.warn('[EditTemplate] template_documents table does not exist yet - this is expected for new installations');
            // Continue without updating document connections
            setSaveSuccess(true); // Template was still saved successfully
            setSaveError('Template was saved, but document connections could not be updated because the template_documents table does not exist.');
          } else {
            console.error('[EditTemplate] Error updating document connections:', documentConnectionError);
            throw new Error(`Failed to update document connections: ${documentConnectionError.message || 'Unknown error'}`);
          }
        }
      } catch (error) {
        // Type guard for the error object
        const connErr = error as { code?: string; message?: string; details?: string };
        console.error('[EditTemplate] Caught error updating document connections:', connErr);
        
        // Only throw if it's not the missing table error
        if (!(connErr.code === 'TABLE_NOT_FOUND' || 
            (connErr.code === '42P01' && connErr.message?.includes('template_documents')))) {
          
          // Try to extract more detailed error information
          let errorMessage = 'Unknown error';
          if (connErr.message) {
            errorMessage = connErr.message;
          } else if (connErr.details) {
            try {
              const parsedDetails = JSON.parse(connErr.details);
              errorMessage = parsedDetails.message || JSON.stringify(parsedDetails);
            } catch {
              errorMessage = connErr.details;
            }
          }
          
          throw new Error(`Failed to update document connections: ${errorMessage}`);
        }
        console.warn('[EditTemplate] Document connections could not be updated due to missing table, but template was saved successfully.');
        setSaveSuccess(true); // Template was still saved successfully
        setSaveError('Template was saved, but document connections could not be updated. The system is still being set up.');
      }
      
      // Update tag connections
      console.log(`[EditTemplate] Updating tag connections for template ${id}, selected tags: ${selectedTags.length}`);
      try {
        // First, get current tags
        const currentTags = await tagService.getTemplateTags(id);
        const currentTagIds = currentTags.map(tag => tag.id);
        
        // Remove tags that are no longer selected
        const tagsToRemove = currentTagIds.filter(tagId => !selectedTags.includes(tagId));
        for (const tagId of tagsToRemove) {
          await tagService.removeTagFromTemplate(id, tagId);
        }
        
        // Add newly selected tags
        const tagsToAdd = selectedTags.filter(tagId => !currentTagIds.includes(tagId));
        for (const tagId of tagsToAdd) {
          await tagService.addTagToTemplate(id, tagId);
        }
        
        console.log(`[EditTemplate] Updated tags: removed ${tagsToRemove.length}, added ${tagsToAdd.length}`);
      } catch (tagErr) {
        console.error('[EditTemplate] Error updating template tags:', tagErr);
        throw new Error(`Failed to update template tags: ${tagErr instanceof Error ? tagErr.message : 'Unknown error'}`);
      }

      console.log('[EditTemplate] Template updated successfully');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      const err = error as { code?: string; message?: string; details?: string };
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[EditTemplate] Failed to update template: ${errorMessage}`, error);
      
      // Try to extract more detailed error information if available
      if (err.details) {
        try {
          const parsedDetails = JSON.parse(err.details);
          if (parsedDetails.message) {
            errorMessage = parsedDetails.message;
          }
        } catch {
          // If parsing fails, use the details string directly
          if (typeof err.details === 'string') {
            errorMessage = err.details;
          }
        }
      }
      
      // Provide more user-friendly error message
      if (err.code === 'TABLE_NOT_FOUND' || (err.code === '42P01' && err.message?.includes('template_documents'))) {
        setSaveError('Template was saved, but document connections could not be updated. The system is still being set up.');
        setSaveSuccess(true); // Template was still saved successfully
      } else if (errorMessage.includes('document connections')) {
        // This is from our improved error handling in the document connections section
        setSaveError(errorMessage);
      } else {
        setSaveError(`Failed to update template: ${errorMessage}`);
      }
    } finally {
      setSaving(false);
    }
  };
  
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-red-600 dark:text-red-400 text-center">
            <p>{error}</p>
            <button
              onClick={() => navigate('/templates')}
              className="mt-4 bg-[#0078D4] text-white px-4 py-2 rounded-md hover:bg-[#0078D4]/90 transition-colors"
            >
              Return to Templates
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Edit Template</h1>
          <button
            onClick={() => navigate('/templates')}
            className="bg-[#0078D4] text-white px-4 py-2 rounded-md hover:bg-[#0078D4]/90 transition-colors flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
            Back to Templates
          </button>
        </div>

        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name
              </label>
              <input
                id="templateName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter template name"
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="templateDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="templateDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter template description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            
            <div>
              <label htmlFor="templatePrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prompt
              </label>
              <textarea
                id="templatePrompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a prompt that will guide the AI when using this template..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="templateCaseHistory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Case History
              </label>
              <textarea
                id="templateCaseHistory"
                value={caseHistory}
                onChange={(e) => setCaseHistory(e.target.value)}
                placeholder="Enter the case history or background information..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="templateParticipants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Participants
              </label>
              <textarea
                id="templateParticipants"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Enter information about case participants..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="templateObjective" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Objective
              </label>
              <textarea
                id="templateObjective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Enter the objective or purpose of this template..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Select tags to categorize and organize this template
              </p>
              
              <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-700">
                {tagsLoading ? (
                  <div className="flex justify-center items-center p-4">
                    <LoadingSpinner size="sm" color="primary" />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading tags...</span>
                  </div>
                ) : (
                  <TagSelector
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                    entityType="template"
                    entityId={id || ''}
                    className="w-full"
                  />
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Knowledge Sources
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Select documents to use as knowledge sources for this template
              </p>
              
              <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                {documentsLoading ? (
                  <div className="flex justify-center items-center p-4">
                    <LoadingSpinner size="sm" color="primary" />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading documents...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 p-2">No documents available</p>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                      <input
                        type="checkbox"
                        id={`doc-${doc.id}`}
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`doc-${doc.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        {doc.name}
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{doc.tag}</span>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${saving || !name.trim() ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-[#0078D4] hover:bg-[#0078D4]/90'} text-white`}
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>

            {saveError && (
              <div className="mt-2 text-red-600 dark:text-red-400 text-sm" role="alert">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="mt-2 text-green-600 dark:text-green-400 text-sm" role="alert">
                Template updated successfully!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTemplate; 