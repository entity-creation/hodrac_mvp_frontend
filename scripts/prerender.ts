// Runs after `vite build`. Writes a static HTML file for every public page so
// crawlers get the title, canonical, main text and links without running JS:
//
//   dist/app.html                         untouched SPA shell (fallback, see vercel.json)
//   dist/index.html                       home page
//   dist/explore/wishlists.html           links to every wishlist
//   dist/wishlists/<id>/<slug>.html       one per wishlist (and destination)
//   dist/blog.html, dist/blog/<slug>.html, dist/blog/tag/<key>.html
//   dist/sitemap.xml
//
// The page text goes in a visually hidden block next to index.html's loading
// screen; the app's createRoot() replaces both when it loads.
// If the backend can't be reached, only app.html is written and the site
// deploys as a plain SPA — this script never fails the build.

import * as fs from "fs";
import * as path from "path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  API_BASE_URL, SITE_URL, STATIC_ROUTES, escapeXml as esc, fetchAll, getJson, mapLimit, sitemapXml,
} from "./backend";
import { blogPath, blogTagPath, destinationPath, wishlistPath } from "../src/utils/v2Utils/routes";
import { stripBlogMarkers } from "../src/utils/v2Utils/blogMarkdown";
import type { BlogPaged, BlogPost, BlogPostSummary, BlogSitemapEntry, BlogTagCount } from "../src/types/blog";
import {
  DEFAULT_DESCRIPTION, STATIC_PAGE_META, destinationFallbackDescription, fullTitle, type StaticPagePath,
} from "../src/utils/v2Utils/pageMeta";
import type { DestinationDetail, DestinationSummary, WishlistCard, WishlistDetail } from "../src/types";

const DIST = "dist";
const CONCURRENCY = 5;

interface Page {
  route: string;
  title: string;
  description?: string | null;
  image?: string | null;
  jsonLd?: object;
  body: string;
  canonical?: string | null; // absolute; defaults to this page's URL
  lastmod?: string | null;   // sitemap <lastmod>
}

// ─── HTML ─────────────────────────────────────────────────────────────────────

function clip(text: string | null | undefined, max = 160): string | undefined {
  const t = text?.replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;
const list = (items: string[]) => (items.length ? `<ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>` : "");
const section = (heading: string, inner: string) => (inner ? `<section><h2>${esc(heading)}</h2>${inner}</section>` : "");
const para = (text?: string | null) => (text?.trim() ? `<p>${esc(text.trim())}</p>` : "");

const NAV = `<nav>${link("/", "Hodrac")} · ${link("/explore/wishlists", "Itineraries")} · ${link("/explore/destinations", "Destinations")} · ${link("/browse-trip", "Travel buddies")}</nav>`;

function render(template: string, page: Page): string {
  const canonical = page.canonical || SITE_URL + (page.route === "/" ? "/" : page.route);
  const title = page.title;
  const description = clip(page.description) ?? DEFAULT_DESCRIPTION;
  const head = [
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    page.image ? `<meta property="og:image" content="${esc(page.image)}" />` : "",
    page.jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, "\\u003c")}</script>`
      : "",
  ].filter(Boolean).join("\n    ");

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta\s+property="og:(title|description)"[\s\S]*?\/>\s*/g, "")
    .replace("</head>", `  ${head}\n  </head>`)
    // Next to the loading screen, hidden from view (see .boot-seo in index.html).
    .replace(
      '<div class="boot-seo" id="boot-seo"></div>',
      `<div class="boot-seo" id="boot-seo">${NAV}<main>${page.body}</main></div>`
    );
}

function write(route: string, html: string) {
  const file = route === "/" ? path.join(DIST, "index.html") : path.join(DIST, `${route.replace(/^\//, "")}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function tryGet<T>(endpoint: string): Promise<T | null> {
  try {
    return await getJson<T>(endpoint);
  } catch (err) {
    console.warn(`  skipped ${endpoint}: ${(err as Error).message}`);
    return null;
  }
}

async function destinationsInWishlist(id: string): Promise<DestinationSummary[]> {
  const all: DestinationSummary[] = [];
  for (let page = 1; page <= 10; page++) {
    const rows = await tryGet<DestinationSummary[]>(`/api/destinations/destinations-in-wishlist/${id}?page=${page}`);
    if (!rows?.length) break;
    all.push(...rows);
  }
  return all;
}

// ─── Pages ────────────────────────────────────────────────────────────────────

function staticPage(route: StaticPagePath, body = ""): Page {
  const meta = STATIC_PAGE_META[route];
  return {
    route,
    title: fullTitle(meta.title),
    description: meta.description,
    body: `<h1>${esc(meta.title || "Hodrac")}</h1>${para(meta.description)}${body}`,
  };
}

function wishlistPage(w: WishlistCard, detail: WishlistDetail | null, stops: DestinationSummary[]): Page {
  const days = (detail?.itineraryDays ?? [])
    .slice()
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map(d => {
      const items = d.items.map(i => esc(i.title)).filter(Boolean).join(", ");
      return `<strong>Day ${d.dayNumber}: ${esc(d.dayTitle ?? "")}</strong>${items ? ` — ${items}` : ""}`;
    });
  const description = w.wishlistDescription || w.shortStory;
  return {
    route: wishlistPath(w.wishlistId, w.wishlistName),
    title: fullTitle(w.wishlistName),
    description,
    image: w.wishlistHeroImage,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: w.wishlistName,
      description: clip(description, 300),
      image: w.wishlistHeroImage || undefined,
      url: SITE_URL + wishlistPath(w.wishlistId, w.wishlistName),
      itinerary: stops.length
        ? { "@type": "ItemList", itemListElement: stops.map((d, i) => ({
            "@type": "ListItem", position: i + 1, name: d.destinationName,
            url: SITE_URL + destinationPath(d.destinationId, d.destinationName),
          })) }
        : undefined,
    },
    body:
      `<h1>${esc(w.wishlistName)}</h1>` +
      `<p>${[w.totalDays ? `${w.totalDays} days` : "", w.peopleType].filter(Boolean).map(esc).join(" · ")}</p>` +
      para(description) +
      section("Day by day", list(days)) +
      section("Places on this trip", list(stops.map(d => link(destinationPath(d.destinationId, d.destinationName), d.destinationName)))) +
      section("What's included", list((detail?.globalInclusions ?? []).map(esc))),
  };
}

function destinationPage(d: DestinationSummary, detail: DestinationDetail | null, inWishlists: WishlistCard[]): Page {
  const desc = detail?.description;
  const description = desc?.overview || destinationFallbackDescription(d.destinationName, d.location);
  return {
    route: destinationPath(d.destinationId, d.destinationName),
    title: fullTitle(d.destinationName),
    description,
    image: d.thumbnailUrl,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      name: d.destinationName,
      description: clip(description, 300),
      image: d.thumbnailUrl || undefined,
      address: d.location || undefined,
      url: SITE_URL + destinationPath(d.destinationId, d.destinationName),
    },
    body:
      `<h1>${esc(d.destinationName)}</h1>` +
      para(d.location) +
      para(desc?.overview) +
      section("Local perspective", para(desc?.localPerspective)) +
      section("What to know", para(desc?.whatToKnow)) +
      section("Best time to visit", para(desc?.bestTimeToVisit)) +
      section("Getting there", para(desc?.directions)) +
      section("Itineraries that include this place",
        list(inWishlists.map(w => link(wishlistPath(w.wishlistId, w.wishlistName), w.wishlistName)))),
  };
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

// Same Markdown as the page (no raw HTML), card markers removed.
const markdownHtml = (md: string) =>
  renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, stripBlogMarkers(md)));

const postLink = (p: BlogPostSummary) => link(blogPath(p.slug), p.title);

function blogPostPage(p: BlogPost): Page {
  const customTitle = p.metaTitle && p.metaTitle !== p.title;
  const linked = [
    ...p.wishlists.map(w => link(wishlistPath(w.id, w.name), w.name)),
    ...p.destinations.map(d => link(destinationPath(d.id, d.name), d.name)),
    ...p.events.map(e => esc(`${e.name}, ${e.city}`)),
  ];
  return {
    route: blogPath(p.slug),
    title: customTitle ? p.metaTitle : fullTitle(p.title),
    description: p.metaDescription || p.excerpt,
    image: p.coverImageUrl,
    canonical: p.canonicalUrl,
    lastmod: p.updatedAt,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title,
      description: clip(p.metaDescription || p.excerpt, 300),
      image: p.coverImageUrl || undefined,
      datePublished: p.publishedAt || undefined,
      dateModified: p.updatedAt,
      author: { "@type": p.authorName && p.authorName !== "Hodrac Team" ? "Person" : "Organization", name: p.authorName || "Hodrac" },
      publisher: { "@type": "Organization", name: "Hodrac", url: SITE_URL },
      mainEntityOfPage: SITE_URL + blogPath(p.slug),
      keywords: p.tags.map(t => t.name).join(", ") || undefined,
    },
    body:
      `<article><h1>${esc(p.title)}</h1>` +
      para(p.excerpt) +
      `<p>${[p.authorName, p.publishedAt?.slice(0, 10)].filter(Boolean).map(s => esc(String(s))).join(" · ")}</p>` +
      markdownHtml(p.bodyMarkdown) +
      section(p.wishlists.length ? "Book this trip" : "Places in this post", list(linked)) +
      section("Topics", list(p.tags.map(t => link(blogTagPath(t.key), t.name)))) +
      section("Keep reading", list(p.relatedPosts.map(postLink))) +
      `</article>`,
  };
}

function blogListPage(route: string, title: string, description: string, posts: BlogPostSummary[], tags: BlogTagCount[]): Page {
  return {
    route,
    title: fullTitle(title),
    description,
    body:
      `<h1>${esc(title)}</h1>` + para(description) +
      list(posts.map(p => `${postLink(p)}${p.excerpt ? ` — ${esc(p.excerpt)}` : ""}`)) +
      section("Topics", list(tags.map(t => link(blogTagPath(t.key), t.name)))),
  };
}

async function blogPages(): Promise<Page[]> {
  const entries = await tryGet<BlogSitemapEntry[]>("/api/blog/sitemap");
  if (!entries) return [];
  const tags = ((await tryGet<BlogTagCount[]>("/api/blog/tags")) ?? []).filter(t => t.postCount > 0);
  const posts = (await mapLimit(entries, CONCURRENCY, e => tryGet<BlogPost>(`/api/blog/${encodeURIComponent(e.slug)}`)))
    .filter((p): p is BlogPost => !!p);
  const byDate = [...posts].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));

  const tagPages = await mapLimit(tags, CONCURRENCY, async t => {
    const page = await tryGet<BlogPaged<BlogPostSummary>>(`/api/blog?tag=${encodeURIComponent(t.key)}&pageSize=50`);
    return blogListPage(blogTagPath(t.key), `${t.name} · Travel guides`,
      `Hodrac articles about ${t.name.toLowerCase()}: local guides, things to do and trip ideas.`, page?.items ?? [], tags);
  });

  const meta = STATIC_PAGE_META["/blog"];
  return [
    { ...blogListPage("/blog", meta.title, meta.description, byDate, tags), lastmod: byDate[0]?.updatedAt },
    ...tagPages,
    ...posts.map(blogPostPage),
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // index.html is the fresh shell after `vite build`; if this script already
  // ran (index.html is the prerendered home page), reuse the saved shell.
  const indexHtml = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");
  const appPath = path.join(DIST, "app.html");
  const template = indexHtml.includes('rel="canonical"') && fs.existsSync(appPath)
    ? fs.readFileSync(appPath, "utf-8")
    : indexHtml;
  fs.writeFileSync(appPath, template);

  console.log(`Prerendering from ${API_BASE_URL} …`);
  let wishlists: WishlistCard[];
  let destinations: DestinationSummary[];
  try {
    // Generous timeout: the first request may wake a sleeping backend.
    wishlists = await fetchAll<WishlistCard>("/api/explore/wishlists", 100, 120000);
    destinations = await fetchAll<DestinationSummary>("/api/explore/destinations", 100, 60000);
  } catch (err) {
    console.warn(`Prerender skipped, backend unavailable: ${(err as Error).message}`);
    console.warn("The site will deploy as a plain SPA (dist/app.html).");
    return;
  }
  wishlists = wishlists.filter(w => w.wishlistId);
  destinations = destinations.filter(d => d.destinationId);

  const wishlistData = await mapLimit(wishlists, CONCURRENCY, async w => ({
    w,
    detail: await tryGet<WishlistDetail>(`/api/wishlists/${w.wishlistId}`),
    stops: await destinationsInWishlist(w.wishlistId),
  }));

  // Invert wishlist → destinations so each destination links back.
  const wishlistsFor = new Map<string, WishlistCard[]>();
  for (const { w, stops } of wishlistData) {
    for (const d of stops) {
      const arr = wishlistsFor.get(d.destinationId) ?? [];
      if (!arr.some(x => x.wishlistId === w.wishlistId)) arr.push(w);
      wishlistsFor.set(d.destinationId, arr);
    }
  }

  const destinationData = await mapLimit(destinations, CONCURRENCY, async d => ({
    d,
    detail: await tryGet<DestinationDetail>(`/api/destinations/${d.destinationId}`),
  }));

  const wishlistLinks = wishlists.map(w => link(wishlistPath(w.wishlistId, w.wishlistName), w.wishlistName));
  const destinationLinks = destinations.map(d =>
    `${link(destinationPath(d.destinationId, d.destinationName), d.destinationName)}${d.location ? ` — ${esc(d.location)}` : ""}`);
  // Home page leads with the admin-chosen hero, then the featured pool.
  const hero = await tryGet<WishlistCard | undefined>("/api/wishlists/hero");
  const pool = (await tryGet<WishlistCard[]>("/api/wishlists/featured")) ?? [];
  const featuredWishlists = [...(hero ? [hero] : []), ...pool.filter(w => w.wishlistId !== hero?.wishlistId)];
  const featuredDestinations = destinations.filter(d => d.isFeatured);

  const pages: Page[] = [
    staticPage("/",
      section("Featured itineraries", list((featuredWishlists.length ? featuredWishlists : wishlists.slice(0, 12))
        .map(w => link(wishlistPath(w.wishlistId, w.wishlistName), w.wishlistName)))) +
      section("Featured destinations", list((featuredDestinations.length ? featuredDestinations : destinations.slice(0, 12))
        .map(d => link(destinationPath(d.destinationId, d.destinationName), d.destinationName))))),
    staticPage("/explore/wishlists", list(wishlistLinks)),
    staticPage("/explore/destinations", list(destinationLinks)),
    ...(["/browse-trip", "/partners", "/about", "/contact-us", "/terms", "/privacy"] as const).map(r => staticPage(r)),
    ...wishlistData.map(x => wishlistPage(x.w, x.detail, x.stops)),
    ...destinationData.map(x => destinationPage(x.d, x.detail, wishlistsFor.get(x.d.destinationId) ?? [])),
  ];
  // Blog (skipped quietly if the blog API isn't there yet).
  const blog = await blogPages();
  pages.push(...blog);

  for (const page of pages) write(page.route, render(template, page));

  // Posts with their own canonical elsewhere stay out of the sitemap.
  const lastmod = new Map(pages.map(p => [p.route, p.lastmod ?? undefined]));
  const routes = [...new Set([...STATIC_ROUTES, ...pages.filter(p => !p.canonical).map(p => p.route)])];
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemapXml(routes.map(route => ({ route, lastmod: lastmod.get(route) }))));

  console.log(
    `Prerendered ${pages.length} pages (${wishlists.length} wishlists, ${destinations.length} destinations, ` +
    `${blog.filter(p => p.route.split("/").length === 3 && !p.route.startsWith("/blog/tag")).length} blog posts); ` +
    `sitemap has ${routes.length} URLs.`
  );
}

main().catch(err => {
  // Never fail the deploy over SEO pages: app.html is already written.
  console.warn("Prerender failed; deploying as a plain SPA.");
  console.warn(err);
});
