import React, { useState, useEffect } from 'react';
import { PlusIcon, DocumentTextIcon, DocumentIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import DocumentUploadMenu from './DocumentUploadMenu';
import { supabase } from '../../services/supabase';

interface Document {
  id: string;
  content: string;
  metadata: {
    name: string;
    type?: string;
    size?: number;
    storage_path?: string;
  };
  created_at: string;
}

const ProjectKnowledgeSidebar: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents...');
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching documents:', fetchError);
        throw fetchError;
      }

      console.log('Fetched documents:', data);
      setDocuments(data || []);
    } catch (err) {
      console.error('Error in fetchDocuments:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Set up real-time subscription for document changes
  useEffect(() => {
    const subscription = supabase
      .channel('documents-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'documents' 
        }, 
        (payload) => {
          console.log('Received real-time update:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleDeleteDocument = async (id: string) => {
    try {
      setError(null);
      console.log('Deleting document:', id);

      // First, get the document to find its storage path
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('metadata')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching document for deletion:', fetchError);
        throw fetchError;
      }

      console.log('Found document to delete:', doc);

      // If document has a storage path, delete the file
      if (doc?.metadata?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([doc.metadata.storage_path]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          throw storageError;
        }

        console.log('Deleted file from storage:', doc.metadata.storage_path);
      }

      // Delete the database record
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('Error deleting document record:', dbError);
        throw dbError;
      }

      console.log('Deleted document record');

      // Update local state
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err) {
      console.error('Error in handleDeleteDocument:', err);
      setError('Failed to delete document');
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      setError(null);
      if (!doc.metadata?.storage_path) {
        throw new Error('No storage path available');
      }

      console.log('Creating signed URL for:', doc.metadata.storage_path);

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.metadata.storage_path, 60); // URL valid for 60 seconds

      if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
      }

      if (data?.signedUrl) {
        console.log('Opening document URL');
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Error in handleViewDocument:', err);
      setError('Failed to open document');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2 relative z-50">
        <DocumentUploadMenu onUploadComplete={() => {
          console.log('Upload complete, refreshing documents...');
          fetchDocuments();
        }} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No documents added yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Click the + button to add documents
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {documents.map(doc => (
              <li
                key={doc.id}
                className="bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650 transition-colors duration-150"
              >
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0">
                      {doc.metadata?.type?.includes('pdf') ? (
                        <DocumentIcon className="h-4 w-4 text-red-500" />
                      ) : (
                        <DocumentTextIcon className="h-4 w-4 text-[#3B82F6]" />
                      )}
                    </div>
                    <div className="ml-2 flex-1 truncate">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {doc.metadata.name}
                      </p>
                      <p className="text-xs text-[#6B7280] dark:text-gray-400">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    <button 
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" 
                      title="View"
                      onClick={() => handleViewDocument(doc)}
                    >
                      <EyeIcon className="h-3.5 w-3.5 text-[#3B82F6] dark:text-blue-400" />
                    </button>
                    <button
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                      onClick={() => handleDeleteDocument(doc.id)}
                      aria-label={`Delete ${doc.metadata.name}`}
                    >
                      <TrashIcon className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProjectKnowledgeSidebar; 