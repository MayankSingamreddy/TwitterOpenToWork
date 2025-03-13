import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get response
  const response = NextResponse.next();
  
  // Add security headers
  const ContentSecurityPolicy = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' https: data:;
    connect-src 'self' https://api.twitter.com;
    font-src 'self';
    frame-src 'self' https://twitter.com;
  `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set('Content-Security-Policy', ContentSecurityPolicy);
  
  return response;
}

// Only run middleware on specific paths that need these headers
export const config = {
  matcher: [
    '/',
    '/api/auth/:path*',
    '/api/applyBanner',
    '/test-oauth',
  ],
}; 