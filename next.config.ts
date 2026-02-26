import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Capacitor mobile app
  output: 'export',
  distDir: 'dist',
  
  // Image optimization settings
  images: {
    unoptimized: true,
  },
  
  // Trailing slash for static export
  trailingSlash: true,
};

export default nextConfig;
