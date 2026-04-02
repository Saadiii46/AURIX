import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const productionOrigins = ["app://-", "https://aurix-api.vercel.app"];

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.VERCEL ? undefined : "export", // Static HTML export — Electron loads these files
  distDir: "dist-next", // Output folder (replaces Vite's /dist)
  images: {
    unoptimized: true, // Next.js Image optimization needs a server; disable it
  },
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === "production" ? "./" : "",
  typescript: { ignoreBuildErrors: true },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: isProd
              ? productionOrigins.join(" ")
              : "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Aurix-Client",
          },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },
};

export default nextConfig;
