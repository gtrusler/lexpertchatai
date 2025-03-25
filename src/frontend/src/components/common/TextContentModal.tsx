import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../services/supabase';

interface TextContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface SaveProgress {
  stage: 'preparing' | 'uploading' | 'saving';
  progress: number;
}

const TextContentModal: React.FC<TextContentModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState<SaveProgress | null>(null);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setError(null);
      setSaveProgress(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Start progress tracking
      setSaveProgress({
        stage: 'preparing',
        progress: 0
      });

      // Simulate preparation progress
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaveProgress({
        stage: 'preparing',
        progress: 100
      });

      // Create a text file from the content
      const textContent = `${title}\n\n${content}`;
      const blob = new Blob([textContent], { type: 'text/plain' });
      const file = new File([blob], `${title}.txt`, { type: 'text/plain' });

      // Generate a clean filename (remove special characters, spaces to underscores)
      const cleanTitle = title.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      const fileName = `${cleanTitle}.txt`;

      setSaveProgress({
        stage: 'uploading',
        progress: 0
      });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          upsert: false // Prevent overwriting existing files
        });

      if (uploadError) {
        if (uploadError.message.includes('already exists')) {
          // If file exists, append a timestamp
          const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
          const newFileName = `${cleanTitle}_${timestamp}.txt`;

          setSaveProgress({
            stage: 'uploading',
            progress: 50
          });

          const { data: retryData, error: retryError } = await supabase.storage
            .from('documents')
            .upload(newFileName, file);
            
          if (retryError) throw retryError;
        } else {
          throw uploadError;
        }
      }

      setSaveProgress({
        stage: 'uploading',
        progress: 100
      });

      // Short delay to show upload completion
      await new Promise(resolve => setTimeout(resolve, 300));

      setSaveProgress({
        stage: 'saving',
        progress: 0
      });

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert([{
          name: title, // Store the original title for display
          type: 'text/plain',
          file_path: fileName,
          size: file.size,
        }])
        .select()
        .single();

      if (docError) throw docError;

      setSaveProgress({
        stage: 'saving',
        progress: 100
      });

      // Short delay to show completion
      await new Promise(resolve => setTimeout(resolve, 300));

      // Reset form and close
      setTitle('');
      setContent('');
      
      // Notify parent of completion before closing
      if (onComplete) {
        onComplete();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving text content:', error);
      setError('Failed to save document. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSaveProgress(null);
    }
  };

  const getProgressText = () => {
    if (!saveProgress) return '';
    switch (saveProgress.stage) {
      case 'preparing':
        return 'Preparing document...';
      case 'uploading':
        return 'Uploading content...';
      case 'saving':
        return 'Saving document...';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Text Content</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}

          {saveProgress && (
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getProgressText()}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {saveProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${saveProgress.progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter document title"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-64"
              placeholder="Enter your text content here..."
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                isSubmitting || !title.trim() || !content.trim()
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TextContentModal; 