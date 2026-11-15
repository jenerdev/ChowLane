import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@chowlane/ui",
    "@chowlane/lib",
    "@chowlane/mocks",
    "@chowlane/types",
    "@chowlane/pwa",
  ],
};

export default nextConfig;
