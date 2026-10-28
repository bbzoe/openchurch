import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How openchurch.dev uses Google Analytics, and what it does not collect.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main id="main" className="oc-wrap py-16 sm:py-20">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-[#128A4A] uppercase">Legal</p>
        <h1 className="mt-3 max-w-[16ch] text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.05] font-bold tracking-[-0.04em] text-ink">
          Privacy
        </h1>
        <div className="mt-8 max-w-[62ch] space-y-8 text-[15px] leading-relaxed text-body">
          <p>
            OpenChurch is free, open-source software for churches. This page covers the public
            site at {site.url}.
          </p>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">What we measure</h2>
            <p>
              The site uses Google Analytics 4. It records the pages you open, how far you scroll,
              clicks on links that leave the site, and clicks on Join early access and Join hosting
              waitlist.
            </p>
            <p>
              Those two buttons open your email app. We do not receive the message, and we do not
              send your email address, name, or anything you type to Google.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Cookies</h2>
            <p>
              Analytics cookies stay off until you choose Allow analytics. If you choose No thanks,
              Google may still receive a cookieless visit so the totals stay roughly right, without
              a cookie that identifies you. Your choice is stored for six months in a first-party
              cookie named oc_consent. It contains only granted or denied.
            </p>
            <p>
              You can change it from Cookie settings in the footer. We do not use advertising
              cookies.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">How long it is kept</h2>
            <p>
              Event-level data is kept for 14 months, then deleted. The standard reports use
              aggregated numbers.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Contact</h2>
            <p>
              Questions:{" "}
              <a className="font-semibold text-forest hover:underline" href={`mailto:${site.email}`}>
                {site.email}
              </a>
              . Google describes its own handling at{" "}
              <a
                className="font-semibold text-forest hover:underline"
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                policies.google.com/privacy
              </a>
              .
            </p>
            <p>
              <Link href="/" className="font-semibold text-forest hover:underline">
                Back to OpenChurch
              </Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
