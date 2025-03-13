/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  // Add custom webpack config to avoid CSP issues
  webpack: (config, { dev, isServer }) => {
    // For client-side, add specific configurations to avoid eval
    if (!isServer && !dev) {
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.compress.drop_console = false;
        }
      });
    }
    return config;
  },
  // Enable more detailed error output
  onDemandEntries: {
    // Keep the pages in memory longer for debugging
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  }
}

module.exports = nextConfig 