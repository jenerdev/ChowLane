import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { PlatformRoot } from "./platform-root";

/** Geist — the one typeface for all ChowLane apps (docs/DESIGN.md). */
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

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
    <html lang="en" className={geist.variable}>
      <body className="antialiased">
        <PlatformRoot>{children}</PlatformRoot>
      </body>
    </html>
  );
}
