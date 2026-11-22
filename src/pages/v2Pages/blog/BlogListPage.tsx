import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { blogApi } from "../../../dataStore/v2Api/blogApi";
import { BlogPostCard } from "../../../components/v2Components/blog/BlogCards";
import { EmptyState } from "../../../components/v2Components/ui";
import { usePageMeta } from "../../../utils/v2Utils/seo";
import { STATIC_PAGE_META } from "../../../utils/v2Utils/pageMeta";
import { ROUTES, blogTagPath } from "../../../utils/v2Utils/routes";
import { friendlyError } from "../../../utils/v2Utils/apiErrors";
import type { BlogPaged, BlogPostSummary, BlogTagCount } from "../../../types/blog";

const PAGE_SIZE = 12;

// /blog and /blog/tag/:tag (?page=2 for older posts).
export default function BlogListPage() {
  const { tag } = useParams<{ tag?: string }>();
  const [params] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const key = `${tag ?? ""}|${page}`;

  const [result, setResult] = useState<{ key: string; data?: BlogPaged<BlogPostSummary>; error?: string } | null>(null);
  const [tags, setTags] = useState<BlogTagCount[]>([]);

  useEffect(() => {
    let cancelled = false;
    blogApi.list({ tag, page, pageSize: PAGE_SIZE })
      .then(data => { if (!cancelled) setResult({ key, data }); })
      .catch(e => { if (!cancelled) setResult({ key, error: friendlyError(e, {}, "Couldn't load articles.") }); });
    return () => { cancelled = true; };
  }, [key, tag, page]);

  useEffect(() => {
    blogApi.tags().then(t => setTags(t.filter(x => x.postCount > 0))).catch(() => setTags([]));
  }, []);

  const current = result?.key === key ? result : null;
  const tagName = tag ? tags.find(t => t.key === tag)?.name ?? tag.replace(/-/g, " ") : null;
  const basePath = tag ? blogTagPath(tag) : ROUTES.PUBLIC.BLOG;
  const pageHref = (n: number) => (n <= 1 ? basePath : `${basePath}?page=${n}`);

  usePageMeta(tag
    ? { title: `${tagName} · Travel guides`, description: `Hodrac articles about ${tagName?.toLowerCase()}: local guides, things to do and trip ideas.`, path: basePath }
    : { ...STATIC_PAGE_META["/blog"], path: basePath });

  const items = current?.data?.items ?? [];
  const [lead, ...rest] = !tag && page === 1 ? items : [null, ...items];
  const totalPages = current?.data?.totalPages ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-10 pb-24">
      <header className="max-w-3xl mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink-muted mb-4">
          {tag ? <Link to={ROUTES.PUBLIC.BLOG} className="hover:text-ink">Journal</Link> : "Journal"}
        </p>
        <h1 className="text-4xl md:text-6xl font-light text-ink leading-[1.02]">
          {tag ? tagName : <>Travel guides <em className="italic text-ink-soft">and local tips</em></>}
        </h1>
        {!tag && <p className="text-lg text-ink-soft mt-4">Where to go, what to do and how to plan it, from the Hodrac team and the travellers we work with.</p>}
      </header>

      {tags.length > 0 && (
        <nav aria-label="Topics" className="flex flex-wrap gap-2 mb-12">
          <TagChip to={ROUTES.PUBLIC.BLOG} active={!tag}>All</TagChip>
          {tags.map(t => <TagChip key={t.key} to={blogTagPath(t.key)} active={t.key === tag}>{t.name}</TagChip>)}
        </nav>
      )}

      {!current ? (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="motion-safe:animate-pulse">
              <div className="aspect-[4/3] rounded-3xl bg-cream-deep" />
              <div className="h-5 rounded bg-cream-deep mt-4 w-4/5" />
              <div className="h-4 rounded bg-cream-deep mt-3 w-3/5" />
            </div>
          ))}
        </div>
      ) : current.error ? (
        <p className="text-ink-soft">{current.error}</p>
      ) : items.length === 0 ? (
        <EmptyState emoji="📝" title="No articles here yet" subtitle={tag ? "Try another topic." : "Check back soon."} />
      ) : (
        <>
          {lead && <div className="mb-16"><BlogPostCard post={lead} large /></div>}
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map(p => p && <BlogPostCard key={p.id} post={p} />)}
          </div>
          {totalPages > 1 && (
            <nav aria-label="Pages" className="flex items-center justify-between mt-16 pt-8 border-t border-line text-sm">
              {page > 1 ? <Link to={pageHref(page - 1)} className="inline-flex items-center gap-2 text-ink hover:underline"><ArrowLeft className="w-4 h-4" /> Newer</Link> : <span />}
              <span className="text-ink-muted">Page {page} of {totalPages}</span>
              {page < totalPages ? <Link to={pageHref(page + 1)} className="inline-flex items-center gap-2 text-ink hover:underline">Older <ArrowRight className="w-4 h-4" /></Link> : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function TagChip({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link to={to} aria-current={active ? "page" : undefined}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${active ? "bg-ink text-white border-ink" : "border-line text-ink hover:border-ink"}`}>
      {children}
    </Link>
  );
}
