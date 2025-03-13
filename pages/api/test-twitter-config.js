// API endpoint to test Twitter configuration
export default function handler(req, res) {
  try {
    // Get public Twitter OAuth info - no sensitive data
    const configInfo = {
      clientId: process.env.TWITTER_CLIENT_ID?.substring(0, 5) + '...',
      oauthVersion: '2.0',
      configuredUrl: process.env.NEXTAUTH_URL,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`,
      requestedScopes: "tweet.read users.read offline.access",
      isConfigured: !!process.env.TWITTER_CLIENT_ID && !!process.env.TWITTER_CLIENT_SECRET
    };
    
    res.status(200).json({
      success: true,
      config: configInfo,
      recommendations: [
        "Verify Twitter Developer Portal settings match this configuration",
        "Ensure the callback URL is exactly registered in your Twitter app",
        "Check that your app has OAuth 2.0 enabled and all requested scopes"
      ]
    });
  } catch (error) {
    console.error('Config test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
} 