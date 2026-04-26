/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for handling binary file uploads in API routes
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};
export default nextConfig;
