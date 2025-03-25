import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, DocumentArrowUpIcon, DocumentTextIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import TextContentModal from './TextContentModal';

interface DocumentUploadMenuProps {
  onUploadComplete?: () => void;
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

const DocumentUploadMenu: React.FC<DocumentUploadMenuProps> = ({ onUploadComplete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
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

        // Create document record in the database
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert([{
            content: '', // Empty content for uploaded files
            metadata: {
              name: file.name,
              size: file.size,
              type: file.type,
              storage_path: uploadFileName
            }
          }])
          .select()
          .single();

        if (docError) {
          console.error('Database insert error:', docError);
          // Clean up the uploaded file if database insert fails
          await supabase.storage
            .from('documents')
            .remove([uploadFileName]);
          throw new Error(`Database insert failed: ${docError.message}`);
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
              <DocumentArrowUpIcon className="h-5 w-5 mr-3 text-[#3B82F6]" />
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