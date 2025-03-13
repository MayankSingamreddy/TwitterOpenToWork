import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

// Debug helper function
function debugObject(obj, maxDepth = 2, depth = 0) {
  if (depth > maxDepth) return '[Max Depth Reached]';
  
  const newObj = {};
  for (const key in obj) {
    if (obj[key] === null) {
      newObj[key] = null;
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (Array.isArray(obj[key])) {
        newObj[key] = '[Array]';
      } else if (key === 'password' || key === 'accessToken' || key === 'refreshToken') {
        newObj[key] = '[REDACTED]';
      } else {
        newObj[key] = debugObject(obj[key], maxDepth, depth + 1);
      }
    } else if (typeof obj[key] === 'function') {
      newObj[key] = '[Function]';
    } else {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

export default NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      version: '2.0', // Use Twitter OAuth 2.0
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          // Simplify to essential scopes only
          scope: "tweet.read users.read offline.access",
        },
      },
      // Log the used callback URL for debugging
      debug: true,
      profile({ data }) {
        return {
          id: data.id,
          name: data.name,
          email: null, // Twitter OAuth 2.0 doesn't provide email by default
          image: data.profile_image_url,
        };
      },
    }),
  ],
  debug: true, // Enable debug logs
  logger: {
    error(code, metadata) {
      console.error(`Auth Error (${code}):`, metadata);
    },
    warn(code) {
      console.warn(`Auth Warning (${code}):`);
    },
    debug(code, metadata) {
      console.log(`Auth Debug (${code}):`, metadata);
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  events: {
    async signIn(message) {
      console.log('Event - SignIn:', {
        user: message.user?.id,
        account: message.account?.provider,
        profile: !!message.profile,
        isNewUser: message.isNewUser
      });
    },
    async signOut(message) {
      console.log('Event - SignOut:', { session: !!message.session });
    },
    async error(message) {
      console.error('Event - Error:', { 
        error: message.error?.message || message.error,
        type: message.type 
      });
    },
    async session(message) {
      console.log('Event - Session:', { session: !!message.session });
    },
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('Sign-in attempt:', { 
        user: user ? { id: user.id, name: user.name } : null,
        account: account ? { 
          provider: account.provider,
          type: account.type,
          // Don't log the tokens for security
          hasToken: !!account.access_token 
        } : null,
        profile: profile ? { id: profile.id } : null
      });
      return true;
    },
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token to the token right after sign in
      console.log('JWT Callback:', { 
        hasToken: !!token,
        accountProviderType: account ? `${account.provider}:${account.type}` : 'none',
        hasUser: !!user
      });
      
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at * 1000; // Convert to milliseconds
        token.provider = account.provider;
      }
      
      // If token has expired and we have a refresh token, try to refresh
      if (token.accessTokenExpires && Date.now() > token.accessTokenExpires && token.refreshToken) {
        try {
          console.log('Token expired, attempting refresh...');
          
          const response = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.TWITTER_CLIENT_ID,
              client_secret: process.env.TWITTER_CLIENT_SECRET,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken
            })
          });
          
          const refreshedTokens = await response.json();
          
          if (!response.ok) {
            throw refreshedTokens;
          }
          
          console.log('Token refresh successful');
          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
          };
        } catch (error) {
          console.error('Error refreshing token:', error);
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token
      console.log('Session Callback:', { 
        hasSession: !!session,
        hasAccessToken: !!token.accessToken,
        provider: token.provider,
        tokenExpiry: token.accessTokenExpires ? new Date(token.accessTokenExpires).toISOString() : 'none'
      });
      
      session.accessToken = token.accessToken;
      session.error = token.error;
      
      // Add token expiry information
      session.expires = token.accessTokenExpires ? new Date(token.accessTokenExpires).toISOString() : null;
      
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'YOUR_SECRET_HERE',
  pages: {
    // Custom error page with more verbose error reporting
    error: '/auth/error',
  },
}); 