import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import DocumentUploadMenu from './DocumentUploadMenu';
import TextContentModal from './TextContentModal';

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
  chat_id: string;
}

interface ProjectKnowledgeSidebarProps {
  chatId?: string;
}

const ProjectKnowledgeSidebar: React.FC<ProjectKnowledgeSidebarProps> = ({ chatId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!chatId) {
        console.log('No chat ID available');
        return;
      }

      try {
        // Convert numeric bot ID to UUID if needed
        const effectiveId = chatId.match(/^\d+$/) 
          ? `00000000-0000-0000-0000-${chatId.padStart(12, '0')}`
          : chatId;

        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('chat_id', effectiveId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents');
      }
    };

    fetchDocuments();

    // Set up real-time subscription for document changes
    const documentsSubscription = supabase
      .channel('documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocuments(prev => [payload.new as Document, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev => 
              prev.map(doc => doc.id === payload.new.id ? payload.new as Document : doc)
            );
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for chat name changes
    const chatSubscription = supabase
      .channel('chat_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `id=eq.${chatId}`
        },
        (payload) => {
          // Update document tags if chat name changes
          const newName = payload.new.name;
          documents.forEach(async (doc) => {
            const { data: tags } = await supabase
              .from('document_tags')
              .select('tag_id')
              .eq('document_id', doc.id);

            if (tags) {
              for (const tag of tags) {
                const { data: tagData } = await supabase
                  .from('tags')
                  .select('name')
                  .eq('id', tag.tag_id)
                  .single();

                if (tagData?.name.startsWith('chat:')) {
                  const newTagName = `chat:${chatId}:${newName}`;
                  await supabase
                    .from('tags')
                    .update({ name: newTagName })
                    .eq('id', tag.tag_id);
                }
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      documentsSubscription.unsubscribe();
      chatSubscription.unsubscribe();
    };
  }, [chatId]);

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  const handleViewDocument = (document: Document) => {
    // Implement document viewing logic
    console.log('Viewing document:', document);
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
      {error && (
        <div className="mb-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {doc.metadata?.name || 'Untitled Document'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewDocument(doc)}
                className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteDocument(doc.id)}
                className="p-1 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <DocumentUploadMenu
        onUploadComplete={() => setIsUploadMenuOpen(false)}
        chatId={chatId}
      />

      <TextContentModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onComplete={() => setIsTextModalOpen(false)}
      />
    </div>
  );
};

export default ProjectKnowledgeSidebar; 