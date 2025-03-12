import React, { useEffect, useState } from 'react';

const EnvTest: React.FC = () => {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get all environment variables that start with VITE_
    const viteEnvVars: Record<string, string> = {};
    
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        const value = import.meta.env[key];
        // Mask sensitive values
        if (key.includes('KEY') || key.includes('SECRET')) {
          viteEnvVars[key] = value ? `${value.substring(0, 10)}...` : 'NOT SET';
        } else {
          viteEnvVars[key] = value || 'NOT SET';
        }
      }
    });
    
    setEnvVars(viteEnvVars);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading environment variables...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Environment Variables Test</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Vite Environment Variables</h2>
          
          {Object.keys(envVars).length === 0 ? (
            <p className="text-red-600 dark:text-red-400">No Vite environment variables found!</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-mono text-sm text-gray-800 dark:text-gray-200 sm:w-1/3">{key}:</span>
                  <span className="font-mono text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-0">{value}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">Debug Information</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
              If environment variables are missing, check the following:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>Ensure .env file exists in the project root</li>
              <li>Ensure variable names start with VITE_</li>
              <li>Restart the Vite dev server after changing .env files</li>
              <li>Check for any console errors related to environment variables</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvTest; 