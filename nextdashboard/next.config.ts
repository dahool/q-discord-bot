import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: {
    appIsrStatus: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.discordapp.com',
        pathname: '**'
      },
    ],
  },
};

export default nextConfig;