import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/db"],
  // Pin the file-tracing root to the monorepo root. Without this, Vercel's
  // `modifyConfig` step in the build pipeline can't infer the workspace root
  // and crashes with `TypeError: The "path" argument must be of type string.
  // Received undefined`.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
