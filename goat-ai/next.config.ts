import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.insider.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'www.gatesfoundation.org',
      },
      {
        protocol: 'https',
        hostname: 'futureoflife.org',
      },
      // Allow Wikipedia images (common for profile pictures)
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: '*.wikimedia.org',
      },
      // Allow encrypted Google images (thumbnails from search)
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      // Allow common image hosting domains that Google Image Search returns
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      // Allow any HTTPS image for persona avatars from Google Image Search
      // This is safe since we're only displaying profile pictures from a trusted API
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
