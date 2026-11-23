import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { useCurrency } from "../../../hooks/v2Hooks/useCurrency";
import { blogPath, destinationPath, wishlistPath } from "../../../utils/v2Utils/routes";
import { fmtEventTime, fmtPostDate } from "../../../utils/v2Utils/blogFormat";
import type {
  BlogDestinationCard, BlogEventCard, BlogPostSummary, BlogWishlistCard,
} from "../../../types/blog";

import Img from "../ui/Img";
const placeLine = (p: Pick<BlogPostSummary, "city" | "country">) => [p.city?.name, p.country?.name].filter(Boolean).join(", ");

// ─── Post cards ───────────────────────────────────────────────────────────────

export function BlogPostCard({ post, large = false }: { post: BlogPostSummary; large?: boolean }) {
  const place = placeLine(post);
  return (
    <article className="group">
      <Link to={blogPath(post.slug)} className="block">
        <div className={`overflow-hidden rounded-3xl bg-cream-deep ${large ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
          {post.coverImageUrl && (
            <Img src={post.coverImageUrl} alt={post.coverImageAlt ?? ""} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          )}
        </div>
        <div className="pt-4">
          <p className="text-xs text-ink-muted flex flex-wrap items-center gap-x-2 gap-y-1">
            {post.tags[0] && <span className="uppercase tracking-[0.15em] text-ink-soft">{post.tags[0].name}</span>}
            {place && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {place}</span>}
          </p>
          <h3 className={`font-display font-light text-ink mt-2 group-hover:underline underline-offset-4 decoration-1 ${large ? "text-3xl md:text-4xl leading-tight" : "text-xl leading-snug"}`}>
            {post.title}
          </h3>
          {post.excerpt && <p className={`text-ink-soft mt-2 leading-relaxed ${large ? "" : "text-sm line-clamp-3"}`}>{post.excerpt}</p>}
          <p className="text-xs text-ink-muted mt-3">
            {fmtPostDate(post.publishedAt)}{post.readingTimeMinutes ? ` · ${post.readingTimeMinutes} min read` : ""}
          </p>
        </div>
      </Link>
    </article>
  );
}

// "Read more" on destination and wishlist pages, so they link to the blog.
export function RelatedPosts({ posts, title = "Read more" }: { posts?: BlogPostSummary[] | null; title?: string }) {
  if (!posts?.length) return null;
  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-light text-ink">{title}</h2>
        <Link to="/blog" className="text-sm text-ink-soft hover:text-ink inline-flex items-center gap-1">
          All articles <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map(p => <BlogPostCard key={p.id} post={p} />)}
      </div>
    </section>
  );
}

// ─── Cards inside a post, and the linked-items section ────────────────────────

const cardShell = "flex gap-4 rounded-2xl border border-line bg-white p-3 hover:border-ink transition-colors not-prose";
const thumb = "w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl bg-cream-deep object-cover";

export function DestinationCardInline({ d }: { d: BlogDestinationCard }) {
  return (
    <Link to={destinationPath(d.id, d.name)} className={cardShell}>
      {d.heroImageUrl ? <Img src={d.heroImageUrl} alt="" loading="lazy" className={thumb} /> : <div className={thumb} />}
      <div className="min-w-0 py-1">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted">Place</p>
        <p className="text-lg text-ink leading-snug">{d.name}</p>
        <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 shrink-0" /> {[d.city, d.country].filter(Boolean).join(", ")}</p>
        {d.shortDescription && <p className="text-sm text-ink-soft mt-1.5 line-clamp-2">{d.shortDescription}</p>}
      </div>
    </Link>
  );
}

export function WishlistCardInline({ w }: { w: BlogWishlistCard }) {
  const { formatPrice } = useCurrency();
  return (
    <Link to={wishlistPath(w.id, w.name)} className={cardShell}>
      {w.heroImage ? <Img src={w.heroImage} alt="" loading="lazy" className={thumb} /> : <div className={thumb} />}
      <div className="min-w-0 py-1">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted">Itinerary</p>
        <p className="text-lg text-ink leading-snug">{w.name}</p>
        <p className="text-sm text-ink-soft mt-1">
          {w.totalDays ? `${w.totalDays} day${w.totalDays === 1 ? "" : "s"}` : ""}
          {w.basePricePerPerson > 0 && `${w.totalDays ? " · " : ""}from ${formatPrice(w.basePricePerPerson)} pp`}
        </p>
        <p className="text-sm text-ink mt-2 inline-flex items-center gap-1">View the trip <ArrowRight className="w-3.5 h-3.5" /></p>
      </div>
    </Link>
  );
}

// Hodrac has no event pages yet, so event cards are information only.
export function EventCardInline({ e }: { e: BlogEventCard }) {
  return (
    <div className={`${cardShell} hover:border-line`}>
      {e.imageUrl ? <Img src={e.imageUrl} alt="" loading="lazy" className={thumb} /> : <div className={thumb} />}
      <div className="min-w-0 py-1">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-muted">Event{e.isFree ? " · Free" : ""}</p>
        <p className="text-lg text-ink leading-snug">{e.name}</p>
        <p className="text-xs text-ink-soft flex items-center gap-1 mt-1">
          <CalendarDays className="w-3 h-3 shrink-0" /> {fmtEventTime(e.startsAt, e.timeZone)}
          {e.endsAt && <> – {fmtEventTime(e.endsAt, e.timeZone)}</>}
        </p>
        <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" /> {[e.venueName, e.city].filter(Boolean).join(", ")}
        </p>
      </div>
    </div>
  );
}

export function ReadingTime({ minutes }: { minutes: number }) {
  if (!minutes) return null;
  return <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {minutes} min read</span>;
}
