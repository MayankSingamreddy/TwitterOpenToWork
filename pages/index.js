// pages/index.js
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const [profileImage, setProfileImage] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Log session status changes
  useEffect(() => {
    console.log('Auth Status:', status);
    console.log('Session Data:', session);
  }, [session, status]);

  const handleSignIn = async () => {
    console.log('Starting Twitter authentication flow...');
    try {
      setAuthError(null); // Clear previous errors
      
      // Get the current URL for the callback
      const callbackUrl = new URL('/api/auth/callback/twitter', window.location.origin).toString();
      
      console.log('Using callback URL:', callbackUrl);
      
      const result = await signIn('twitter', { 
        redirect: true,
        callbackUrl
      });
      
      // This part will only execute if redirect: false
      console.log('Sign-in result:', result);
      
      if (result?.error) {
        setAuthError(result.error);
        console.error('Authentication error:', result.error);
      }
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      setAuthError(error.message);
    }
  };

  const applyBanner = async () => {
    if (!session) {
      console.error('Cannot apply banner: No active session');
      return;
    }
    
    // Check if the session has an error
    if (session.error === "RefreshAccessTokenError") {
      console.error('Session token expired and could not be refreshed');
      alert('Your Twitter session has expired. Please sign out and sign in again.');
      return;
    }
    
    console.log('Starting banner application process...');
    try {
      console.log('Sending request with token:', { 
        hasToken: !!session.accessToken,
        tokenExpiry: session.expires
      });
      
      const response = await fetch('/api/applyBanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accessToken: session.accessToken,
          profileImageUrl: session.user.image
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', { 
          status: response.status, 
          statusText: response.statusText,
          data: errorData 
        });
        
        // Handle 401 errors specially
        if (response.status === 401) {
          await signOut({ redirect: false });
          setAuthError('Your Twitter session has expired. Please sign in again.');
          return;
        }
        
        throw new Error(`Failed to apply banner: ${response.status} ${response.statusText}${errorData.error ? ` - ${errorData.error}` : ''}`);
      }
      
      const data = await response.json();
      console.log('Banner application successful:', data);
      setProfileImage(data.image);
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error applying banner:', error);
      alert(`Error applying banner: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10 p-4">
      <h1 className="text-3xl font-bold mb-6">Twitter Profile Banner Generator</h1>
      
      {status === 'loading' && (
        <div className="w-full max-w-md p-4 bg-gray-100 rounded shadow-md">
          <p className="text-center">Loading authentication status...</p>
        </div>
      )}
      
      {authError && (
        <div className="w-full max-w-md bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Authentication Error</p>
          <p>{authError}</p>
          <button 
            onClick={() => setAuthError(null)} 
            className="mt-2 text-sm underline">
            Dismiss
          </button>
        </div>
      )}
      
      {status === 'unauthenticated' && (
        <div className="w-full max-w-md p-6 bg-white rounded shadow-md">
          <p className="mb-4">Sign in with your Twitter account to generate a custom profile banner.</p>
          <button 
            onClick={handleSignIn} 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded font-bold transition-colors">
            Sign in with Twitter
          </button>
        </div>
      )}
      
      {status === 'authenticated' && session && (
        <div className="w-full max-w-md p-6 bg-white rounded shadow-md">
          <div className="flex items-center mb-4">
            <img src={session.user.image} alt="Profile" className="rounded-full w-16 h-16 mr-4" />
            <div>
              <h2 className="font-bold text-xl">{session.user.name}</h2>
              <p className="text-sm text-gray-600">@{session.user.name.replace(/\s+/g, '').toLowerCase()}</p>
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
            <p className="flex items-center">
              <span className="mr-2">Authentication Status:</span>
              {session.accessToken ? (
                <span className="text-green-600 font-semibold flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Authenticated
                </span>
              ) : (
                <span className="text-red-600 font-semibold">Token Missing</span>
              )}
            </p>
            
            {session.expires && (
              <p className="text-xs text-gray-500 mt-1">
                Session expires: {new Date(session.expires).toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={applyBanner} 
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded font-bold transition-colors">
              Apply Green Ring Banner
            </button>
            
            <button 
              onClick={() => signOut()} 
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded font-bold transition-colors">
              Sign out
            </button>
          </div>
          
          {profileImage && (
            <div className="mt-6">
              <p className="font-bold mb-2">Updated Profile Image:</p>
              <img src={profileImage} alt="Updated Profile" className="rounded-full w-32 h-32 mx-auto" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
