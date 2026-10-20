import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "OpenChurch | Open source tools for local churches",
  description:
    "Free, open tools for churches: service run-of-show, leader sync, and community modules. Sustained by donations.",
  metadataBase: new URL("https://openchurch.dev"),
  openGraph: {
    title: "OpenChurch",
    description:
      "Open source tools for local churches. Free to use, sustained by donations.",
    url: "https://openchurch.dev",
    siteName: "OpenChurch",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
