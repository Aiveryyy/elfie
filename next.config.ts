import type { NextConfig } from "next";

const distDir = process.env.NEXT_DIST_DIR?.trim();

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {
    root: __dirname,
  },
  ...(distDir ? { distDir } : {}),
};

export default nextConfig;
