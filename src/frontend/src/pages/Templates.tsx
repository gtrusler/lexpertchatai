import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';
import AddTemplateForm from '../components/templates/AddTemplateForm';
import TemplateList from '../components/templates/TemplateList';

// Create a Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const Templates: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Check if user has admin role in Supabase
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsAdmin(profile?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/login');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const handleTemplateAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Templates</h1>
          <button
            onClick={() => navigate('/dashboard')}
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
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Templates List */}
          <div className="lg:col-span-2">
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Available Templates</h2>
              <TemplateList 
                refreshTrigger={refreshTrigger}
                onTemplateSelect={(template) => navigate(`/templates/edit/${template.id}`)}
              />
            </div>
          </div>

          {/* Add Template Form */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <AddTemplateForm onTemplateAdded={handleTemplateAdded} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Templates; 