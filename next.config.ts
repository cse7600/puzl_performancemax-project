import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright', 'playwright-core', '@sparticuz/chromium-min'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'searchad-phinf.pstatic.net' },
      { protocol: 'https', hostname: 'search.pstatic.net' },
    ],
  },
};

export default nextConfig;
