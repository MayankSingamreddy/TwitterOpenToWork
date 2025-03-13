import { useState, useEffect } from 'react';

export default function TestOAuth() {
  const [testStatus, setTestStatus] = useState('Not started');
  const [configInfo, setConfigInfo] = useState({});
  
  // Test basic configuration
  const testTwitterConfig = async () => {
    setTestStatus('Testing...');
    
    try {
      // Fetch the client ID and other public OAuth config from environment
      const response = await fetch('/api/test-twitter-config');
      const data = await response.json();
      
      setConfigInfo(data);
      setTestStatus('Configuration loaded successfully');
    } catch (error) {
      console.error('Error testing Twitter config:', error);
      setTestStatus(`Error: ${error.message}`);
    }
  };
  
  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-4">Twitter OAuth Test Page</h1>
      
      <div className="w-full max-w-md p-4 bg-gray-100 rounded mb-4">
        <h2 className="font-bold mb-2">Test Status: <span className={testStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}>{testStatus}</span></h2>
        
        <button 
          onClick={testTwitterConfig}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded mb-4">
          Test Twitter Configuration
        </button>
        
        {Object.keys(configInfo).length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Configuration Info:</h3>
            <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto text-sm">
              {JSON.stringify(configInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="w-full max-w-md p-4 bg-white rounded shadow-md">
        <h2 className="font-bold mb-2">Troubleshooting Tips:</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Check if your Twitter Developer App is approved and active</li>
          <li>Verify the callback URL matches exactly: <code className="bg-gray-100 p-1 text-sm">http://localhost:3232/api/auth/callback/twitter</code></li>
          <li>Ensure your app has OAuth 2.0 enabled in Twitter Developer Portal</li>
          <li>Confirm your environment variables are correctly set</li>
          <li>Try reducing the number of requested scopes (as we've done)</li>
        </ul>
      </div>
    </div>
  );
} 