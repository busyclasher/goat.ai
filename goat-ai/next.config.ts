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
    ],
  },
};

export default nextConfig;
