import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { templates } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface Template {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const EditTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        if (!id) return;
        const { data, error: fetchError } = await templates.getTemplate(id);

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Template not found');

        setTemplate(data);
        setName(data.name);
        setDescription(data.description || '');
      } catch (err) {
        setError(`Failed to fetch template: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (!id) throw new Error('Template ID is required');

      if (name.length > 100) {
        throw new Error('Template name must be 100 characters or fewer');
      }

      const { error: updateError } = await templates.updateTemplate(id, { name, description });

      if (updateError) throw updateError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(`Failed to update template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
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