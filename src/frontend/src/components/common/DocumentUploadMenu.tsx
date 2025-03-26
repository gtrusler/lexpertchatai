import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, DocumentArrowUpIcon, DocumentTextIcon, FolderIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import TextContentModal from './TextContentModal';
import { createTag, addTagToDocument } from '../../services/tagService';

interface DocumentUploadMenuProps {
  onUploadComplete?: () => void;
  chatId?: string;
}

interface UploadStatus {
  isUploading: boolean;
  progress: number;
  fileName: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
}

const DocumentUploadMenu: React.FC<DocumentUploadMenuProps> = ({ onUploadComplete, chatId }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { botId } = useParams<{ botId: string }>();
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleUploadFromDevice = () => {
    // Trigger file input click
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.click();
    setMenuOpen(false);
  };
  
  const handleAddTextContent = () => {
    setShowTextModal(true);
    setMenuOpen(false);
  };
  
  const handleAddFromCollections = () => {
    // Navigate to collections selection
    navigate('/collections');
    setMenuOpen(false);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      let uploadFileName = '';
      
      try {
        setError(null);
        setUploadStatus({
          isUploading: true,
          progress: 0,
          fileName: file.name
        });

        if (!chatId && !botId) {
          throw new Error('No chat ID available');
        }

        // Get the current chat name - handle both bot and chat IDs
        let chatName = '';
        let effectiveId = chatId || botId;

        if (!effectiveId) {
          throw new Error('No valid ID available');
        }

        // Check if the ID is numeric (bot ID) or UUID (chat ID)
        const isNumericId = /^\d+$/.test(effectiveId);

        if (!isNumericId) {
          // If we have a UUID, use the chats table
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .select('name')
            .eq('id', effectiveId)
            .single();

          if (chatError) {
            throw new Error(`Failed to get chat information: ${chatError.message}`);
          }
          chatName = chatData.name;
        } else {
          // For numeric bot IDs, use hardcoded names
          chatName = effectiveId === '1' ? 'Weyl Bot' :
                     effectiveId === '2' ? 'Trademark Bot' :
                     effectiveId === '3' ? 'Holly vs. Waytt' :
                     'Unknown Bot';

          // For numeric bot IDs, we need to create a UUID for the document
          // We'll use a deterministic UUID based on the bot ID
          effectiveId = `00000000-0000-0000-0000-${effectiveId.padStart(12, '0')}`;
        }

        // Generate a clean filename
        const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '_');
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        uploadFileName = `${timestamp}_${cleanName}`;
        
        console.log('Starting file upload:', uploadFileName);

        // Upload file to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(uploadFileName, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        if (!uploadData?.path) {
          throw new Error('Upload succeeded but no file path returned');
        }

        console.log('File uploaded successfully:', uploadData);

        // Create chat tag using the appropriate ID
        const tagName = `chat:${effectiveId}:${chatName}`;
        const tag = await createTag({ name: tagName });

        // Create document record in the database
        let { data: docData, error: docError } = await supabase
          .from('documents')
          .insert([{
            content: '', // Empty content for uploaded files
            metadata: {
              name: file.name,
              size: file.size,
              type: file.type,
              storage_path: uploadFileName
            },
            chat_id: effectiveId
          }])
          .select()
          .single();

        if (docError) {
          // If the error is due to missing chat, create the chat first
          if (docError.code === '23503') { // Foreign key violation
            // Create the chat record
            const { error: chatError } = await supabase
              .from('chats')
              .insert([{
                id: effectiveId,
                name: chatName,
                created_at: new Date().toISOString()
              }]);

            if (chatError) {
              throw new Error(`Failed to create chat: ${chatError.message}`);
            }

            // Retry document insert
            const { data: retryDocData, error: retryDocError } = await supabase
              .from('documents')
              .insert([{
                content: '', // Empty content for uploaded files
                metadata: {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  storage_path: uploadFileName
                },
                chat_id: effectiveId
              }])
              .select()
              .single();

            if (retryDocError) {
              throw new Error(`Failed to create document: ${retryDocError.message}`);
            }

            docData = retryDocData;
          } else {
            throw new Error(`Failed to create document: ${docError.message}`);
          }
        }

        // Associate document with chat tag
        await addTagToDocument(docData.id, tag.id);

        // If this is a bot document, create the bot_documents association
        if (isNumericId) {
          const { error: botDocError } = await supabase
            .from('bot_documents')
            .insert([{
              bot_id: effectiveId,
              document_id: docData.id
            }]);

          if (botDocError) {
            console.error('Bot document association error:', botDocError);
            // Clean up the document if bot association fails
            await supabase
              .from('documents')
              .delete()
              .eq('id', docData.id);
            await supabase.storage
              .from('documents')
              .remove([uploadFileName]);
            throw new Error(`Failed to associate document with bot: ${botDocError.message}`);
          }
        }

        console.log('Document record created:', docData);

        // Update progress to 100%
        setUploadStatus(prev => ({
          ...prev!,
          progress: 100
        }));

        // Clear the file input
        e.target.value = '';

        // Call onUploadComplete after successful upload
        if (onUploadComplete) {
          console.log('Calling onUploadComplete callback');
          onUploadComplete();
        }

        // Clear upload status after showing completion
        setTimeout(() => {
          setUploadStatus(null);
          setError(null);
        }, 1500);

      } catch (error) {
        console.error('Error uploading file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
        setError(errorMessage);
        
        // Clean up any partial uploads
        if (uploadFileName) {
          try {
            await supabase.storage
              .from('documents')
              .remove([uploadFileName]);
            console.log('Cleaned up failed upload:', uploadFileName);
          } catch (cleanupError) {
            console.error('Error cleaning up failed upload:', cleanupError);
          }
        }
        
        // Clear upload status on error
        setUploadStatus(null);
      }
    }
  };
  
  return (
    <div className="relative inline-block" ref={menuRef}>
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className="bg-[#3B82F6] hover:bg-blue-600 p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md"
        aria-label="Add document"
      >
        <PlusIcon className="h-5 w-5" />
      </button>
      
      {menuOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button 
              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              onClick={handleUploadFromDevice}
              role="menuitem"
            >
              <DocumentIcon className="h-5 w-5 mr-3 text-[#3B82F6]" />
              <div>
                <div className="font-medium">Upload from device</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF, DOC, DOCX, TXT</div>
              </div>
            </button>
            <button 
              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              onClick={handleAddTextContent}
              role="menuitem"
            >
              <DocumentTextIcon className="h-5 w-5 mr-3 text-[#10B981]" />
              <div>
                <div className="font-medium">Add text content</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create a new document</div>
              </div>
            </button>
            <button 
              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              onClick={handleAddFromCollections}
              role="menuitem"
            >
              <FolderIcon className="h-5 w-5 mr-3 text-[#F59E0B]" />
              <div>
                <div className="font-medium">Add from Collections</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use existing documents</div>
              </div>
            </button>
          </div>
        </div>
      )}
      
      {/* Hidden file input for device upload */}
      <input 
        type="file" 
        id="file-upload" 
        className="hidden" 
        accept=".pdf,.doc,.docx,.txt" 
        onChange={handleFileUpload}
      />

      {/* Text content modal */}
      <TextContentModal
        isOpen={showTextModal}
        onClose={() => setShowTextModal(false)}
        onComplete={onUploadComplete}
      />

      {/* Upload Progress Overlay */}
      {uploadStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Uploading Document</h3>
            <div className="mb-2">
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{uploadStatus.fileName}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{uploadStatus.progress}%</div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadStatus.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default DocumentUploadMenu; 