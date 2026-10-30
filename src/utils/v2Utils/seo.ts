import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DEFAULT_DESCRIPTION, HOME_TITLE, fullTitle } from "./pageMeta";

// One host for every canonical URL. Must match sitemap.xml.
export const SITE_URL = "https://www.hodrac.com";


// Find a <meta>/<link> in <head> by selector, creating it if missing, so
// client-side navigation updates tags in place instead of piling them up.
function headTag<T extends HTMLElement>(selector: string, create: () => T): T {
  let el = document.head.querySelector<T>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function setMeta(attr: "name" | "property", key: string, content: string | null) {
  const selector = `meta[${attr}="${key}"]`;
  if (content == null) {
    document.head.querySelector(selector)?.remove();
    return;
  }
  headTag(selector, () => {
    const m = document.createElement("meta");
    m.setAttribute(attr, key);
    return m;
  }).setAttribute("content", content);
}

export interface PageMeta {
  title: string;
  description?: string;
  // Canonical path. Defaults to the current pathname (query and hash dropped).
  path?: string;
  image?: string | null;
  noindex?: boolean;
}

// Sets title, description, canonical, Open Graph and robots tags for a page.
export function usePageMeta({ title, description, path, image, noindex }: PageMeta) {
  const { pathname } = useLocation();
  const canonical = SITE_URL + ((path ?? pathname).replace(/\/+$/, "") || "/");
  const desc = description?.trim() || DEFAULT_DESCRIPTION;

  useEffect(() => {
    document.title = fullTitle(title);
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title || HOME_TITLE);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", noindex ? null : canonical);
    setMeta("property", "og:image", image || null);
    setMeta("name", "robots", noindex ? "noindex" : null);

    const link = headTag<HTMLLinkElement>('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.rel = "canonical";
      return l;
    });
    if (noindex) link.remove();
    else link.href = canonical;
  }, [title, desc, canonical, image, noindex]);
}

// Replaces the URL with the canonical path (e.g. adds a missing or fixes a
// stale slug) so each item is reachable at one address. Query and hash are kept.
export function useCanonicalRedirect(canonicalPath: string | undefined) {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (canonicalPath && pathname.replace(/\/+$/, "") !== canonicalPath) {
      navigate(canonicalPath + search + hash, { replace: true });
    }
  }, [canonicalPath, pathname, search, hash, navigate]);
}

// Shortens long text for a meta description.
export function metaDescription(text?: string | null, max = 160): string | undefined {
  const t = text?.replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
