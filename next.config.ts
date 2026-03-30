import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export", // Static HTML export — Electron loads these files
  distDir: "dist-next", // Output folder (replaces Vite's /dist)
  images: {
    unoptimized: true, // Next.js Image optimization needs a server; disable it
  },
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === "production" ? "./" : "",
};

export default nextConfig;
