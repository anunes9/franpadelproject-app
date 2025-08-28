import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  distDir: ".next",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
      },
      {
        protocol: "https",
        hostname: "videos.ctfassets.net",
      },
    ],
  },
}

export default nextConfig
