import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PlatformChrome } from "./platform-chrome";

export const metadata: Metadata = {
  title: { default: "ChowLane Platform", template: "%s · ChowLane Platform" },
  description: "Platform Admin — all tenants",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0E7C66",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PlatformChrome>{children}</PlatformChrome>
      </body>
    </html>
  );
}
