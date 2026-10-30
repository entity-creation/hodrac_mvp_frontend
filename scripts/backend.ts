// Shared helpers for build scripts that read the live backend
// (generate-sitemap.ts, scripts/prerender.ts).

import * as fs from "fs";

// Must match SITE_URL in src/utils/v2Utils/seo.ts.
export const SITE_URL = "https://www.hodrac.com";

// Public pages that don't depend on data.
export const STATIC_ROUTES = [
  "/",
  "/explore/wishlists",
  "/explore/destinations",
  "/browse-trip",
  "/partners",
  "/about",
  "/contact-us",
  "/terms",
  "/privacy",
];

export interface Paged<T> {
  items: T[];
  page: number;
  totalPages: number;
}

function readEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, "utf-8")
      .split(/\r?\n/)
      .map(line => line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/))
      .filter((m): m is RegExpMatchArray => !!m && !m[1].startsWith("#"))
      .map(m => [m[1], m[2].replace(/^["']|["']$/g, "")])
  );
}

// Backend: VITE_API_BASE_URL from the environment or .env (same setting the
// app uses), falling back to production.
const env = { ...readEnvFile(".env"), ...readEnvFile(".env.production"), ...process.env };
export const API_BASE_URL = (env.VITE_API_BASE_URL || "https://hodrac-mvp2-backend-2050972.onrender.com").replace(/\/$/, "");

export async function getJson<T>(endpoint: string, timeoutMs = 30000): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Walks every page of a paged explore endpoint.
export async function fetchAll<T>(endpoint: string, pageSize = 100, timeoutMs?: number): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; ; page++) {
    const data = await getJson<Paged<T>>(`${endpoint}?page=${page}&pageSize=${pageSize}`, timeoutMs);
    all.push(...(data.items ?? []));
    if (!data.items?.length || page >= (data.totalPages ?? 1)) break;
  }
  return all;
}

// Runs `fn` over `items` with at most `limit` in flight.
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// Safe for both XML/HTML text and attribute values.
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function sitemapXml(routes: string[]): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes.map(route => `  <url>\n    <loc>${escapeXml(SITE_URL + route)}</loc>\n  </url>`).join("\n") +
    `\n</urlset>\n`
  );
}
