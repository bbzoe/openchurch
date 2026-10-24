import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "OpenChurch",
    template: "%s | OpenChurch",
  },
  description: "Plan a service and keep everyone on the same moment.",
  applicationName: "OpenChurch",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "OpenChurch",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F3D2E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-ivory text-ink">{children}</body>
    </html>
  );
}
