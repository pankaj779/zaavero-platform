import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api/v1';
let apiHostname = 'localhost';
try {
  apiHostname = new URL(apiUrl.replace(/\/api\/v1\/?$/, '')).hostname;
} catch {
  // keep localhost
}

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com",
      "font-src 'self' data:",
      `connect-src 'self' ${apiUrl} https://*.sentry.io https://api.razorpay.com`,
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Standalone output is for Linux/Docker images. On Windows, Next's symlink
  // tracing often fails without Developer Mode (EPERM), so keep it opt-in.
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' as const } : {}),
  transpilePackages: [
    '@graphology/ui',
    '@graphology/types',
    '@graphology/utils',
    '@graphology/auth',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http', hostname: apiHostname },
      { protocol: 'https', hostname: apiHostname },
    ],
  },
  async headers() {
    return await Promise.resolve([
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]);
  },
};

export default nextConfig;
