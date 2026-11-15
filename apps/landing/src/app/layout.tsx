import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

/** Geist — the one typeface for all ChowLane apps (docs/DESIGN.md). */
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: { default: "ChowLane — your own food delivery app", template: "%s · ChowLane" },
  description:
    "Launch a food delivery business under your own name: a branded ordering app for customers, a rider app, and one console to run it.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
