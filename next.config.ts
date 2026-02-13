import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for easy deployment (can be removed if using server features)
  // output: 'export',
  
  // Image optimization settings
  images: {
    unoptimized: true,
  },
  
  // Disable typed routes for flexibility
  // typedRoutes: true,
};

export default nextConfig;
