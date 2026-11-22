// Renders a post body. Safe by construction: react-markdown builds React
// elements from the Markdown and ignores raw HTML (no rehype-raw), and its
// default URL check drops javascript: and similar links. Never render the
// body with dangerouslySetInnerHTML.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { embedTokenIndex, prepareBlogMarkdown, type EmbedSlot } from "../../../utils/v2Utils/blogMarkdown";
import { SITE_URL } from "../../../utils/v2Utils/seo";
import { DestinationCardInline, EventCardInline, WishlistCardInline } from "./BlogCards";
import type { BlogEmbed } from "../../../types/blog";

function EmbedCard({ slot }: { slot: EmbedSlot }) {
  if (slot.kind === "pending") {
    return (
      <div className="my-6 rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-ink-muted">
        Card: {slot.type} “{slot.ref}”. Save the post to see it.
      </div>
    );
  }
  const { destination, wishlist, event } = slot.embed;
  return (
    <div className="my-6">
      {destination ? <DestinationCardInline d={destination} />
        : wishlist ? <WishlistCardInline w={wishlist} />
        : event ? <EventCardInline e={event} />
        : null}
    </div>
  );
}

// Links to hodrac.com stay in the app; others open in a new tab.
function MdLink({ href = "", children }: { href?: string; children?: ReactNode }) {
  const internal = href.startsWith("/") && !href.startsWith("//")
    ? href
    : href.startsWith(SITE_URL) ? href.slice(SITE_URL.length) || "/" : null;
  const cls = "text-ink underline underline-offset-4 decoration-1 hover:decoration-2";
  return internal != null
    ? <Link to={internal} className={cls}>{children}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>;
}

export default function BlogMarkdown({ body, embeds, preview = false }: {
  body: string;
  embeds: BlogEmbed[];
  preview?: boolean; // admin: show markers that aren't resolved yet
}) {
  const { markdown, slots } = prepareBlogMarkdown(body, embeds, { keepUnresolved: preview });

  const components: Components = {
    p: ({ node, children }) => {
      const only = node?.children.length === 1 ? node.children[0] : null;
      const i = only?.type === "text" ? embedTokenIndex(only.value) : null;
      if (i != null && slots[i]) return <EmbedCard slot={slots[i]} />;
      return <p className="my-5 leading-[1.8] text-ink-soft">{children}</p>;
    },
    // The page title is the only h1.
    h1: ({ children }) => <h2 className="font-display text-3xl font-light text-ink mt-12 mb-4">{children}</h2>,
    h2: ({ children }) => <h2 className="font-display text-3xl font-light text-ink mt-12 mb-4">{children}</h2>,
    h3: ({ children }) => <h3 className="font-display text-2xl font-light text-ink mt-10 mb-3">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-semibold text-ink mt-8 mb-2">{children}</h4>,
    a: ({ href, children }) => <MdLink href={href}>{children}</MdLink>,
    ul: ({ children }) => <ul className="my-5 pl-6 list-disc space-y-2 text-ink-soft marker:text-ink-muted">{children}</ul>,
    ol: ({ children }) => <ol className="my-5 pl-6 list-decimal space-y-2 text-ink-soft marker:text-ink-muted">{children}</ol>,
    li: ({ children }) => <li className="leading-[1.8] pl-1">{children}</li>,
    blockquote: ({ children }) => <blockquote className="my-8 border-l-2 border-ink pl-5 font-display text-xl italic text-ink">{children}</blockquote>,
    img: ({ src, alt }) => (
      <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" className="my-8 w-full rounded-2xl" />
    ),
    hr: () => <hr className="my-12 border-line" />,
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
    code: ({ children }) => <code className="rounded bg-cream-deep px-1.5 py-0.5 text-[0.9em]">{children}</code>,
    pre: ({ children }) => <pre className="my-6 overflow-x-auto rounded-2xl bg-cream-deep p-4 text-sm">{children}</pre>,
    table: ({ children }) => <div className="my-6 overflow-x-auto"><table className="w-full text-sm border-collapse">{children}</table></div>,
    th: ({ children }) => <th className="border-b border-ink text-left font-semibold text-ink py-2 pr-4">{children}</th>,
    td: ({ children }) => <td className="border-b border-line text-ink-soft py-2 pr-4 align-top">{children}</td>,
  };

  return (
    <div className="text-[17px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}
