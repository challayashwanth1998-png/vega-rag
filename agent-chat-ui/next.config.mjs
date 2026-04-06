/** @type {import('next').NextConfig} */

// Always apply /chat basePath so local dev and production use identical URLs:
//   Local:       http://localhost:3001/chat?assistantId=...
//   Production:  https://vegarag.com/chat?assistantId=...

const nextConfig = {
  basePath: "/chat",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
