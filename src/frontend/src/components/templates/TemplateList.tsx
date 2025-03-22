import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../common/LoadingSpinner';

// Create a Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Template {
  id: string;
  name: string;
  description: string;
  prompt?: string;
  case_history?: string;
  participants?: string;
  objective?: string;
  created_at: string;
  updated_at: string;
}

interface TemplateListProps {
  onTemplateSelect?: (template: Template) => void;
  refreshTrigger?: number;
}

const TemplateList: React.FC<TemplateListProps> = ({ onTemplateSelect, refreshTrigger = 0 }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        setTemplates(data || []);
      } catch (err) {
        setError(`Failed to fetch templates: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [refreshTrigger]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (template.objective?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (template.case_history?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (template.participants?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 p-4 text-center" role="alert">
        {error}
      </div>
    );
  }

  if (filteredTemplates.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 p-4 text-center">
        {searchTerm ? 'No templates found matching your search.' : 'No templates found. Create your first template to get started.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search templates..."
        className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
      />
      {filteredTemplates.map((template) => (
        <div
          key={template.id}
          onClick={() => onTemplateSelect ? onTemplateSelect(template) : navigate(`/templates/edit/${template.id}`)}
          className={`
            bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 
            ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border
            cursor-pointer hover:border-[#0078D4] transition-colors
          `}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                {template.name}
              </h3>
              {template.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {template.description}
                </p>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Created {formatDate(template.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplateList; 