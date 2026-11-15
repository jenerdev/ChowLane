import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChowLane Rider",
  description: "Tenant rider app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Service worker is off in `next dev` to avoid stale caches; test PWA with build + start. */}
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV === "development"}>
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
