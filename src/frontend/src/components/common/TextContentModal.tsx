import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useParams } from 'react-router-dom';
import { createTag, addTagToDocument } from '../../services/tagService';

interface TextContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const TextContentModal: React.FC<TextContentModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { botId, chatId } = useParams<{ botId: string; chatId: string }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (!botId) {
        throw new Error('No chat ID available');
      }

      // Get the current chat name - handle both bot and chat IDs
      let chatName = '';
      let effectiveId = chatId || botId;

      if (chatId) {
        // If we have a chatId, it's a UUID, use the chats table
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('name')
          .eq('id', chatId)
          .single();

        if (chatError) {
          throw new Error(`Failed to get chat information: ${chatError.message}`);
        }
        chatName = chatData.name;
      } else if (botId) {
        // If we have a botId, it's numeric, use the bots table
        const { data: botData, error: botError } = await supabase
          .from('bots')
          .select('name')
          .eq('id', botId)
          .single();

        if (botError) {
          throw new Error(`Failed to get bot information: ${botError.message}`);
        }
        chatName = botData.name;

        // For numeric bot IDs, we need to create a UUID for the document
        // We'll use a deterministic UUID based on the bot ID
        effectiveId = `00000000-0000-0000-0000-${botId.padStart(12, '0')}`;
      }

      // Create chat tag using the appropriate ID
      const tagName = `chat:${effectiveId}:${chatName}`;
      const tag = await createTag({ name: tagName });

      // Create document record in the database
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert([{
          content: content,
          metadata: {
            name: title,
            type: 'text'
          },
          chat_id: effectiveId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (docError) {
        throw new Error(`Failed to create document: ${docError.message}`);
      }

      // Associate document with chat tag
      await addTagToDocument(docData.id, tag.id);

      // Reset form
      setTitle('');
      setContent('');
      
      // Close modal and notify parent
      onClose();
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error creating text content:', err);
      setError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Text Content</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter document title"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={6}
              placeholder="Enter document content"
              required
            />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TextContentModal; 