import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 注：如果需要构建 Capacitor 移动应用，取消下面注释
  // Static export for Capacitor mobile app
  // output: 'export',
  // distDir: 'dist',
  
  // Image optimization settings
  images: {
    unoptimized: true,
  },
  
  // Trailing slash for static export
  trailingSlash: true,
};

export default nextConfig;
