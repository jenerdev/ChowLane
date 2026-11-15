import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@chowlane/ui",
    "@chowlane/lib",
    "@chowlane/mocks",
    "@chowlane/types",
    "@chowlane/pwa",
  ],
};

export default withSerwist(nextConfig);
