import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Tooltip from '../common/Tooltip';

// Create a Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface AddTemplateFormProps {
  onTemplateAdded?: () => void;
}

const AddTemplateForm: React.FC<AddTemplateFormProps> = ({ onTemplateAdded }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (name.length > 100) {
      setError('Template name must be 100 characters or fewer.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from('lexpert.templates')
        .insert([{ name, description }]);

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          setError('Template name already exists. Please choose a unique name.');
        } else {
          setError(`Failed to add template: ${supabaseError.message}`);
        }
      } else {
        setSuccess('Template added successfully!');
        setName('');
        setDescription('');
        onTemplateAdded?.();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (e.target.value.length > 0 && !description) {
      setTooltip('Adding a description helps users understand the template\'s purpose');
    } else {
      setTooltip(null);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Add New Template</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="templateName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Template Name
          </label>
          <input
            id="templateName"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter template name"
            required
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500"
            aria-label="Template name"
          />
        </div>

        <div>
          <label 
            htmlFor="templateDescription"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="templateDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter template description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500"
            aria-label="Template description"
          />
        </div>

        {tooltip && (
          <Tooltip 
            content={tooltip}
            position="top"
            dismissible
            onDismiss={() => setTooltip(null)}
            type="prompt-coach"
            show={!!tooltip}
          />
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors
                     ${loading || !name.trim() 
                       ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                       : 'bg-[#0078D4] hover:bg-[#0078D4]/90'} 
                     text-white`}
            aria-label="Add template"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>Adding...</span>
              </>
            ) : (
              <span>Add Template</span>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-2 text-red-600 dark:text-red-400 text-sm" role="alert">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-2 text-green-600 dark:text-green-400 text-sm" role="alert">
            {success}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddTemplateForm; 