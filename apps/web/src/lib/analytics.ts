export const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

export const CONSENT_COOKIE = "oc_consent";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

export type ConsentChoice = "granted" | "denied";
export type LeadType = "early_access" | "hosting_waitlist";

type Gtag = (command: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export function measurementId(): string | null {
  const value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
  return GA_MEASUREMENT_ID_PATTERN.test(value) ? value : null;
}

export function readConsent(): ConsentChoice | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )oc_consent=(granted|denied)(?:;|$)/);
  return match ? (match[1] as ConsentChoice) : null;
}

export function writeConsent(choice: ConsentChoice) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${choice}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

export function clearConsent() {
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function updateAnalyticsConsent(choice: ConsentChoice) {
  window.gtag?.("consent", "update", {
    analytics_storage: choice,
  });
}

export function trackGenerateLead(leadType: LeadType, location: string) {
  window.gtag?.("event", "generate_lead", {
    method: "mailto",
    lead_type: leadType,
    lead_source: location,
  });
}

let lastPageView = "";

export function trackPageView(measurementId: string) {
  const pagePath = window.location.pathname + window.location.search;
  if (pagePath.startsWith("/leaf-preview")) return;
  if (lastPageView === pagePath) return;
  lastPageView = pagePath;
  window.gtag?.("event", "page_view", {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
    send_to: measurementId,
  });
}
