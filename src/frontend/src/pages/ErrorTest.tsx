import React, { useState, useEffect } from 'react';
import DocumentsErrorBoundary from '../components/documents/DocumentsErrorBoundary';

// Component that will intentionally throw an error
const BuggyComponent: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  
  useEffect(() => {
    // Throw error after a short delay to simulate a runtime error
    const timer = setTimeout(() => {
      setShouldThrow(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (shouldThrow) {
    // Intentionally throw an error
    throw new Error('This is an intentional test error to verify error boundary functionality');
  }
  
  return (
    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded">
      <p className="text-yellow-800 dark:text-yellow-200">
        This component will throw an error in a moment...
      </p>
    </div>
  );
};

// Component with a button to trigger the error
const ErrorTrigger: React.FC = () => {
  const [showBuggy, setShowBuggy] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Error Boundary Test
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This page tests the error boundary component. Click the button below to render a component that will throw an error.
        </p>
        
        <button
          onClick={() => setShowBuggy(!showBuggy)}
          className="bg-[#0078D4] text-white px-4 py-2 rounded-md hover:bg-[#0078D4]/90"
        >
          {showBuggy ? 'Hide' : 'Show'} Error Component
        </button>
        
        <div className="mt-6">
          {showBuggy && <BuggyComponent />}
        </div>
      </div>
    </div>
  );
};

// Main page component wrapped in error boundary
const ErrorTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Error Boundary Testing Page
        </h1>
        
        <DocumentsErrorBoundary>
          <ErrorTrigger />
        </DocumentsErrorBoundary>
      </div>
    </div>
  );
};

export default ErrorTest; 