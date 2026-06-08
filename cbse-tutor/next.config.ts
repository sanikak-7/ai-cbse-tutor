import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/chat": ["./public/reference/**/*"],
  },
};

export default nextConfig;
