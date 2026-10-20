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
  title: "OpenChurch | Narzędzia open source dla lokalnych kościołów",
  description:
    "Darmowe, otwarte narzędzia dla kościołów: plan nabożeństwa, odprawa dla liderów i moduły wspierające wspólnotę. Utrzymywane z darowizn.",
  metadataBase: new URL("https://openchurch.dev"),
  openGraph: {
    title: "OpenChurch",
    description:
      "Open source tools for local churches. Free to use, sustained by donations.",
    url: "https://openchurch.dev",
    siteName: "OpenChurch",
    locale: "pl_PL",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
