"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  readConsent,
  trackPageView,
  updateAnalyticsConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/analytics";

function subscribeConsent(onChange: () => void) {
  window.addEventListener("oc-consent-reset", onChange);
  return () => window.removeEventListener("oc-consent-reset", onChange);
}

export function ConsentBanner({ measurementId }: { measurementId: string }) {
  const unanswered = useSyncExternalStore(subscribeConsent, () => readConsent() === null, () => false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const reopen = () => setClosed(false);
    window.addEventListener("oc-consent-reset", reopen);
    return () => window.removeEventListener("oc-consent-reset", reopen);
  }, []);

  function choose(choice: ConsentChoice) {
    writeConsent(choice);
    updateAnalyticsConsent(choice);
    if (choice === "granted") trackPageView(measurementId);
    setClosed(true);
  }

  if (!unanswered || closed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-line bg-ivory p-4 shadow-[0_16px_40px_rgba(6,42,33,0.16)] sm:flex-row sm:items-end sm:p-5">
        <p className="text-sm leading-relaxed text-body">
          We use Google Analytics to see which pages help churches. Analytics cookies stay off
          until you allow them.{" "}
          <Link href="/privacy" className="font-semibold text-forest underline-offset-2 hover:underline">
            Privacy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="h-10 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-canvas"
            onClick={() => choose("denied")}
          >
            No thanks
          </button>
          <button
            type="button"
            className="h-10 rounded-full bg-action px-4 text-sm font-semibold text-canvas hover:bg-forest"
            onClick={() => choose("granted")}
          >
            Allow analytics
          </button>
        </div>
      </div>
    </div>
  );
}
