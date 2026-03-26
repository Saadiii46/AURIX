import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export", // Static HTML export — Electron loads these files
  distDir: "dist-next", // Output folder (replaces Vite's /dist)
  // When loading via Electron `loadFile()` (file:// / asar), root-relative
  // asset URLs like `/_next/...` break because they resolve against the OS root.
  // Using a relative asset prefix makes Next generate `./_next/...` paths.
  trailingSlash: true, // Needed for file:// routing to work
  images: {
    unoptimized: true, // Next.js Image optimization needs a server; disable it
  },
};

export default nextConfig;
