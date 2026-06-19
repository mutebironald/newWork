import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
    if (!basePath) return [];

    const pathsToRedirect = [
      "/",
      "/login",
      "/register",
      "/overview",
      "/agents",
      "/merchants",
      "/programs",
      "/opportunities",
      "/work-episodes",
      "/income",
      "/ai",
      "/reports",
      "/xprize",
    ];

    return pathsToRedirect.map((path) => ({
      source: path,
      destination: `${basePath}${path === "/" ? "" : path}`,
      permanent: false,
      basePath: false,
    }));
  },
};

export default nextConfig;
