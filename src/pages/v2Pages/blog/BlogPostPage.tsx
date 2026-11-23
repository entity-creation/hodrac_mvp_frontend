import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { blogApi } from "../../../dataStore/v2Api/blogApi";
import { isApiError } from "../../../dataStore/v2Api/client";
import BlogMarkdown from "../../../components/v2Components/blog/BlogMarkdown";
import {
  BlogPostCard, DestinationCardInline, EventCardInline, ReadingTime, WishlistCardInline,
} from "../../../components/v2Components/blog/BlogCards";
import PageSkeleton from "../../../components/v2Components/layout/PageSkeleton";
import { ButtonLink } from "../../../components/v2Components/ui";
import { useCanonicalRedirect, usePageMeta } from "../../../utils/v2Utils/seo";
import { fmtPostDate } from "../../../utils/v2Utils/blogFormat";
import { friendlyError } from "../../../utils/v2Utils/apiErrors";
import { ROUTES, blogPath, blogTagPath } from "../../../utils/v2Utils/routes";
import type { BlogPost } from "../../../types/blog";

import Img from "../../../components/v2Components/ui/Img";
type State = { slug: string } & ({ post: BlogPost } | { notFound: true } | { error: string });

// /blog/:slug
export default function BlogPostPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    let cancelled = false;
    blogApi.get(slug)
      .then(post => { if (!cancelled) setState({ slug, post }); })
      .catch(e => {
        if (cancelled) return;
        setState(isApiError(e, 404) ? { slug, notFound: true } : { slug, error: friendlyError(e, {}, "Couldn't load this article.") });
      });
    return () => { cancelled = true; };
  }, [slug]);

  const current = state?.slug === slug ? state : null;
  const post = current && "post" in current ? current.post : null;

  // A renamed post: the API follows its 301 to the new slug, so move the URL there.
  useCanonicalRedirect(post ? blogPath(post.slug) : undefined);

  usePageMeta(post
    ? {
        // metaTitle falls back to the title; a different one was written for search results.
        title: post.metaTitle && post.metaTitle !== post.title ? post.metaTitle : post.title,
        exactTitle: !!post.metaTitle && post.metaTitle !== post.title,
        description: post.metaDescription || post.excerpt,
        image: post.coverImageUrl,
        path: blogPath(post.slug),
        canonicalUrl: post.canonicalUrl,
      }
    : current && "notFound" in current
      ? { title: "Article not found", noindex: true }
      : { title: "Journal", noindex: !!current });

  if (!current) return <PageSkeleton />;

  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-5 text-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-ink mb-3">
            {"notFound" in current ? "This article isn't available" : "Something went wrong"}
          </h1>
          <p className="text-ink-soft mb-8">{"error" in current ? current.error : "It may have been moved or unpublished."}</p>
          <ButtonLink to={ROUTES.PUBLIC.BLOG} size="lg">See all articles</ButtonLink>
        </div>
      </div>
    );
  }

  const place = [post.city?.name, post.country?.name].filter(Boolean).join(", ");
  const updated = post.publishedAt && new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 86_400_000;
  const linked = post.destinations.length + post.wishlists.length + post.events.length > 0;

  return (
    <article className="pb-24">
      <header className="max-w-3xl mx-auto px-5 md:px-8 pt-10">
        <nav aria-label="Breadcrumb" className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted mb-6 flex flex-wrap gap-2">
          <Link to={ROUTES.PUBLIC.BLOG} className="hover:text-ink">Journal</Link>
          {post.tags[0] && <><span aria-hidden>/</span><Link to={blogTagPath(post.tags[0].key)} className="hover:text-ink">{post.tags[0].name}</Link></>}
        </nav>
        <h1 className="text-4xl md:text-6xl font-light text-ink leading-[1.04]">{post.title}</h1>
        {post.excerpt && <p className="text-xl text-ink-soft mt-5 leading-relaxed">{post.excerpt}</p>}
        <p className="text-sm text-ink-muted mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          {post.authorName && <span className="text-ink">{post.authorName}</span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>{fmtPostDate(post.publishedAt)}</time>}
          {updated && <span>Updated <time dateTime={post.updatedAt}>{fmtPostDate(post.updatedAt)}</time></span>}
          <ReadingTime minutes={post.readingTimeMinutes} />
          {place && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {place}</span>}
        </p>
      </header>

      {post.coverImageUrl && (
        <figure className="max-w-5xl mx-auto px-5 md:px-8 mt-10">
          <Img src={post.coverImageUrl} alt={post.coverImageAlt ?? ""} className="w-full aspect-[16/9] object-cover rounded-3xl bg-cream-deep" />
        </figure>
      )}

      <div className="max-w-3xl mx-auto px-5 md:px-8 mt-10">
        <BlogMarkdown body={post.bodyMarkdown} embeds={post.embeds} />

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12">
            {post.tags.map(t => (
              <Link key={t.key} to={blogTagPath(t.key)} className="rounded-full border border-line px-3 py-1 text-sm text-ink hover:border-ink">{t.name}</Link>
            ))}
          </div>
        )}

        {linked && (
          <section className="mt-16 pt-10 border-t border-line">
            <h2 className="text-2xl md:text-3xl font-light text-ink mb-6">
              {post.wishlists.length ? "Book this trip" : "Places in this post"}
            </h2>
            <div className="grid gap-4">
              {post.wishlists.map(w => <WishlistCardInline key={w.id} w={w} />)}
              {post.destinations.map(d => <DestinationCardInline key={d.id} d={d} />)}
              {post.events.map(e => <EventCardInline key={e.id} e={e} />)}
            </div>
          </section>
        )}
      </div>

      {post.relatedPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 md:px-8 mt-20">
          <h2 className="text-2xl md:text-3xl font-light text-ink mb-8">Keep reading</h2>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {post.relatedPosts.map(p => <BlogPostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </article>
  );
}
