// GA4 event tracking — only fires when VITE_GA_MEASUREMENT_ID is set.
// No PII or JSON content is ever included in any payload.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function initAnalytics(): void {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  // GA4 measurement IDs always match G-XXXXXXXXXX; reject anything else.
  if (!id || !/^G-[A-Z0-9]+$/.test(id)) return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: true });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  window.gtag?.("event", name, params ?? {});
}

// Named helpers so call sites stay readable and the event names are typed.
export const track = {
  jsonFormatted: () => trackEvent("json_formatted"),
  jsonValidated: () => trackEvent("json_validated"),
  jsonRepaired: () => trackEvent("json_repaired"),
  jsonMinified: () => trackEvent("json_minified"),
  fileUploaded: () => trackEvent("file_uploaded"),
  urlLoaded: () => trackEvent("url_loaded"),
  shareLinkCopied: () => trackEvent("share_link_copied"),
  converterUsed: (outputFormat: string) =>
    trackEvent("converter_used", { output_format: outputFormat }),
};
