import React from 'react';

interface ErrorDisplayProps {
  error: Error | null;
  resetError?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl w-full">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Something went wrong
        </h2>
        
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            {error?.message || 'An unknown error occurred'}
          </p>
          
          {error?.stack && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Error Details (for developers):
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto max-h-60 text-gray-800 dark:text-gray-200">
                {error.stack}
              </pre>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          {resetError && (
            <button
              onClick={resetError}
              className="bg-[#0078D4] text-white px-4 py-2 rounded-md hover:bg-[#0078D4]/90 flex-1"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex-1"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay; 