"use client";

import { clearConsent, updateAnalyticsConsent } from "@/lib/analytics";

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        clearConsent();
        updateAnalyticsConsent("denied");
        window.dispatchEvent(new Event("oc-consent-reset"));
      }}
    >
      Cookie settings
    </button>
  );
}
