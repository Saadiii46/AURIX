import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isVercel = !!process.env.VERCEL; // Check if we are deploying to Vercel

const productionOrigins = ["app://-", "https://aurix-api.vercel.app"];

const nextConfig: NextConfig = {
  // 1. Only use "export" if we are NOT on Vercel
  // This ensures Vercel treats the project as a live Serverless app
  ...(isVercel ? {} : { output: "export" }),

  distDir: "dist-next",
  images: { unoptimized: true },
  trailingSlash: true,

  // 2. Fix Asset Prefix: Electron needs "./", Vercel needs ""
  assetPrefix: isVercel ? "" : isProd ? "./" : "",

  typescript: { ignoreBuildErrors: true },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // Join with a comma, not a space, for standard CORS compliance
            value: isProd
              ? productionOrigins.join(", ")
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
