import Script from "next/script";
import { Suspense } from "react";
import { ConsentBanner } from "@/components/analytics/consent-banner";
import { PageViews } from "@/components/analytics/page-views";
import { measurementId } from "@/lib/analytics";

export function GoogleAnalytics() {
  const id = measurementId();
  if (!id) return null;

  const consent = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
try {
  var match = document.cookie.match(/(?:^|; )oc_consent=(granted|denied)(?:;|$)/);
  if (match && match[1] === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
} catch (e) {}
`;

  const config = `
gtag('js', new Date());
var host = location.hostname;
var internal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
var config = { send_page_view: false };
if (internal) {
  config.debug_mode = true;
  config.traffic_type = 'internal';
}
gtag('config', '${id}', config);
`;

  return (
    <>
      <Script id="ga-consent" strategy="beforeInteractive">
        {consent}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-config" strategy="afterInteractive">
        {config}
      </Script>
      <Suspense fallback={null}>
        <PageViews measurementId={id} />
      </Suspense>
      <ConsentBanner measurementId={id} />
    </>
  );
}
