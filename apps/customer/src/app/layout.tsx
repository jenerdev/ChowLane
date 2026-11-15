import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";

/** Geist — the one typeface for all ChowLane apps (docs/DESIGN.md). */
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: "ChowLane Customer",
  description: "Tenant customer app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="antialiased">
        {/* Service worker is off in `next dev` to avoid stale caches; test PWA with build + start. */}
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV === "development"}>
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
