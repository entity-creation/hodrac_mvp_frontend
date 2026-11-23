// Image hosts from GET /api/config/images: images load from primaryBaseUrl
// (Cloudflare R2 once it's configured); if one fails, the same file is tried
// once on the first fallback host (the old Vercel Blob store). Every base ends
// with "/". Fetched once per visit; the last answer is kept in localStorage so
// a failing image on a later visit doesn't wait for the network.
import { http } from "../../dataStore/v2Api/client";

export interface ImageConfig { primaryBaseUrl: string; fallbackBaseUrls: string[] }

const STORAGE_KEY = "hodrac:image-config";
const NONE: ImageConfig = { primaryBaseUrl: "", fallbackBaseUrls: [] };

let cached: ImageConfig | null = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ImageConfig) : null;
  } catch {
    return null;
  }
})();
let request: Promise<ImageConfig> | null = null;

// Starts the request (once) and resolves with the config. Never rejects: on
// failure there's simply no fallback and images behave as before.
export function loadImageConfig(): Promise<ImageConfig> {
  if (!request) {
    request = http.get<ImageConfig>("/api/config/images")
      .then(cfg => {
        const clean: ImageConfig = {
          primaryBaseUrl: cfg?.primaryBaseUrl ?? "",
          fallbackBaseUrls: Array.isArray(cfg?.fallbackBaseUrls) ? cfg.fallbackBaseUrls.filter(Boolean) : [],
        };
        cached = clean;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clean)); } catch { /* storage unavailable */ }
        return clean;
      })
      .catch(() => cached ?? NONE);
  }
  return cached ? Promise.resolve(cached) : request;
}

// The other host for the same file, or null (not one of our hosts, or no
// fallback configured).
export function fallbackFor(url: string, cfg: ImageConfig): string | null {
  const { primaryBaseUrl: primary, fallbackBaseUrls: fallbacks } = cfg;
  if (primary && fallbacks[0] && url.startsWith(primary)) return fallbacks[0] + url.slice(primary.length);
  // An old link that wasn't rewritten yet: try the primary copy instead.
  const old = fallbacks.find(base => url.startsWith(base));
  if (old && primary) return primary + url.slice(old.length);
  return null;
}
