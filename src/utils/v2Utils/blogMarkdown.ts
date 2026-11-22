// Turns a post's Markdown into something safe to parse with its card markers
// ({{destination:kada-plaza}}, {{wishlist:<id>}}, {{event:<id>}}) swapped for
// placeholder paragraphs; the renderer then puts a card where each one is.
// Shared by the page (BlogMarkdown.tsx) and the build-time prerender.
import type { BlogEmbed } from "../../types/blog";

// A paragraph containing only this word becomes slot N.
export const EMBED_TOKEN = "HODRACEMBED";
export const embedTokenIndex = (text: string): number | null => {
  const m = text.trim().match(/^HODRACEMBED(\d+)$/);
  return m ? Number(m[1]) : null;
};

const MARKER_RE = /\{\{\s*(destination|wishlist|event)\s*:\s*([^}\s]+)\s*\}\}/g;

// A card the API resolved, or (admin preview only) a marker it hasn't seen yet.
export type EmbedSlot =
  | { kind: "embed"; embed: BlogEmbed }
  | { kind: "pending"; type: string; ref: string };

export function prepareBlogMarkdown(
  body: string,
  embeds: BlogEmbed[],
  { keepUnresolved = false }: { keepUnresolved?: boolean } = {},
): { markdown: string; slots: EmbedSlot[] } {
  const slots: EmbedSlot[] = [];
  const slot = (s: EmbedSlot) => `\n\n${EMBED_TOKEN}${slots.push(s) - 1}\n\n`;
  let md = body ?? "";

  for (const embed of embeds) {
    if (!embed.marker || !md.includes(embed.marker)) continue;
    // Exact marker text; found:false markers are removed.
    md = md.split(embed.marker).join(embed.found ? slot({ kind: "embed", embed }) : "");
  }
  // Markers the API didn't resolve (typed since the last save, or unknown).
  md = md.replace(MARKER_RE, (_m, type: string, ref: string) =>
    keepUnresolved ? slot({ kind: "pending", type, ref }) : "");

  return { markdown: md, slots };
}

// Plain body for search engines: markers removed, no cards.
export const stripBlogMarkers = (body: string) => (body ?? "").replace(MARKER_RE, "");
