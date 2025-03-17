import React, { useState, useEffect } from 'react';
import { checkEnvironmentVariables, testSupabaseConnection } from '../utils/envCheck';
import { debugSupabaseInit } from '../utils/supabaseDebug';
import { debugAuthFlow } from '../utils/authDebug';

const EnvTest: React.FC = () => {
  const [envCheck, setEnvCheck] = useState<any>(null);
  const [supabaseDebug, setSupabaseDebug] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const [authDebug, setAuthDebug] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const runTests = async () => {
      try {
        // Check environment variables
        console.log('Running environment check...');
        const envResult = checkEnvironmentVariables();
        setEnvCheck(envResult);
        
        // Debug Supabase initialization
        console.log('Running Supabase initialization debug...');
        const debugResult = await debugSupabaseInit();
        setSupabaseDebug(debugResult);
        
        // Test Supabase connection
        console.log('Testing Supabase connection...');
        const connectionResult = await testSupabaseConnection();
        setConnectionTest(connectionResult);
        
        // Debug authentication flow
        console.log('Debugging authentication flow...');
        const authResult = await debugAuthFlow();
        setAuthDebug(authResult);
      } catch (error) {
        console.error('Error running tests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    runTests();
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0078D4] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Running environment tests...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Environment Test Results
        </h1>
        
        <div className="space-y-6">
          {/* Environment Check */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <span className={`mr-2 text-2xl ${envCheck?.success ? 'text-green-500' : 'text-red-500'}`}>
                {envCheck?.success ? '✅' : '❌'}
              </span>
              Environment Variables
            </h2>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200">
                {JSON.stringify(envCheck, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* Supabase Debug */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <span className={`mr-2 text-2xl ${supabaseDebug?.success ? 'text-green-500' : 'text-red-500'}`}>
                {supabaseDebug?.success ? '✅' : '❌'}
              </span>
              Supabase Initialization
            </h2>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200">
                {JSON.stringify(supabaseDebug, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* Connection Test */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <span className={`mr-2 text-2xl ${connectionTest?.success ? 'text-green-500' : 'text-red-500'}`}>
                {connectionTest?.success ? '✅' : '❌'}
              </span>
              Supabase Connection
            </h2>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200">
                {JSON.stringify(connectionTest, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* Auth Debug */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <span className={`mr-2 text-2xl ${authDebug?.success ? 'text-green-500' : 'text-red-500'}`}>
                {authDebug?.success ? '✅' : '❌'}
              </span>
              Authentication Flow
            </h2>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200">
                {JSON.stringify(authDebug, null, 2)}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-[#0078D4] text-white px-6 py-2 rounded-md hover:bg-[#0078D4]/90"
          >
            Run Tests Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnvTest; 