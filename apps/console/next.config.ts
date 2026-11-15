import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  // Hide the Next.js dev badge: it covers the bottom tabs during prototype reviews.
  devIndicators: false,
  transpilePackages: [
    "@chowlane/ui",
    "@chowlane/lib",
    "@chowlane/mocks",
    "@chowlane/types",
    "@chowlane/pwa",
  ],
};

export default withSerwist(nextConfig);
