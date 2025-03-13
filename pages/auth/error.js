import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Error() {
  const router = useRouter();
  const { error } = router.query;

  const errors = {
    default: {
      title: "Authentication Error",
      message: "An error occurred during authentication.",
      suggestion: "Try signing in again or contact support."
    },
    Configuration: {
      title: "Server Error",
      message: "There is a problem with the server configuration.",
      suggestion: "Check if the NEXTAUTH_SECRET and TWITTER_CLIENT_SECRET are correct."
    },
    AccessDenied: {
      title: "Access Denied",
      message: "You did not grant permission to the application.",
      suggestion: "You need to approve the permissions requested by this application to sign in."
    },
    Verification: {
      title: "Unable to Sign In",
      message: "The sign in link is no longer valid.",
      suggestion: "It may have been used already or it may have expired."
    },
    OAuthSignin: {
      title: "OAuth Sign In Error", 
      message: "Error in constructing an authorization URL.",
      suggestion: "This might be due to misconfigured credentials or scopes."
    },
    OAuthCallback: {
      title: "OAuth Callback Error", 
      message: "Error in handling the response from OAuth provider.",
      suggestion: "Make sure the callback URL in Twitter Developer Portal matches your application."
    },
    OAuthCreateAccount: {
      title: "OAuth Create Account Error", 
      message: "Could not create OAuth account.",
      suggestion: "Try with a different account or contact support."
    },
    EmailCreateAccount: {
      title: "Email Create Account Error", 
      message: "Could not create email account.",
      suggestion: "Try with a different email or contact support."
    },
    Callback: {
      title: "Callback Error", 
      message: "Error in the OAuth callback handler.",
      suggestion: "There might be an issue with your API scopes or configuration."
    },
    OAuthAccountNotLinked: {
      title: "Account Not Linked", 
      message: "The email on your social account is already associated with another user.",
      suggestion: "Sign in with the account you previously used."
    },
    EmailSignin: {
      title: "Email Sign In Error", 
      message: "Error sending the email for sign in.",
      suggestion: "Check if your email is correct and try again."
    },
    CredentialsSignin: {
      title: "Invalid Credentials", 
      message: "The credentials you provided were invalid.",
      suggestion: "Check your username and password and try again."
    },
    SessionRequired: {
      title: "Auth Required", 
      message: "You must be signed in to access this page.",
      suggestion: "Please sign in to continue."
    }
  };

  const errorInfo = error && errors[error] ? errors[error] : errors.default;
  
  console.log('Auth Error Page Loaded', { 
    error,
    query: router.query,
    asPath: router.asPath
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Error code: {error || 'unknown'}
          </p>
        </div>
        <div className="mt-8 space-y-6 bg-white shadow sm:rounded-lg p-6">
          <div className="space-y-4">
            <p className="text-gray-700">
              {errorInfo.message}
            </p>
            <p className="text-gray-700">
              {errorInfo.suggestion}
            </p>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                If you're a developer, check the server logs for more information.
              </p>
              
              <div className="mt-4">
                <Link href="/">
                  <a className="text-indigo-600 hover:text-indigo-500">
                    Return to homepage
                  </a>
                </Link>
                
                <button 
                  onClick={() => router.back()}
                  className="ml-4 text-indigo-600 hover:text-indigo-500">
                  Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 