/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // CRITICAL for Electron
  images: { unoptimized: true },
};
export default nextConfig;
