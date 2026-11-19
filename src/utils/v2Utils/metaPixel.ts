// Meta (Facebook) Pixel. The base code in index.html loads it on the live site
// only and records the first PageView; this records the in-app page changes
// that a single-page app makes without reloading.
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

type Fbq = (command: "track" | "trackCustom", event: string, params?: Record<string, unknown>) => void;

const fbq = (): Fbq | undefined => (window as unknown as { fbq?: Fbq }).fbq;

// Standard or custom event, e.g. trackMeta("Lead"). No-op when the pixel isn't loaded.
export function trackMeta(event: string, params?: Record<string, unknown>, custom = false) {
  try {
    fbq()?.(custom ? "trackCustom" : "track", event, params);
  } catch { /* blocked by the browser or an extension */ }
}

export function MetaPixelPageViews() {
  const { pathname, search } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    // The first page view is already sent by the base code.
    if (first.current) { first.current = false; return; }
    if (pathname.startsWith("/admin")) return;
    trackMeta("PageView");
  }, [pathname, search]);

  return null;
}
