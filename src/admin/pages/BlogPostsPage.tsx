import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { totalPages } from "../api";
import { BLOG_STATUSES, blogAdminApi, blogStatusTone, type AdminBlogPostSummary } from "../blogApi";
import { AdminPage, Btn, DataTable, ErrorBlock, Pager, Pill, SearchBox, Toolbar, type Column } from "../ui";
import { useDebounced, useQuery } from "../hooks";
import { fmtDate, fmtDateTime } from "../format";

const PAGE_SIZE = 20;

// /admin/blog
export default function BlogPostsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);

  const { data, loading, error, reload } = useQuery(
    () => blogAdminApi.list({ page, pageSize: PAGE_SIZE, status: status || undefined, search: debounced || undefined }),
    [page, status, debounced],
  );

  const columns: Column<AdminBlogPostSummary>[] = [
    {
      key: "title", header: "Post", render: p => (
        <div className="min-w-56">
          <p className="text-ink">{p.title || "Untitled"}</p>
          <p className="text-xs text-ink-muted">/blog/{p.slug}</p>
        </div>
      ),
    },
    {
      key: "status", header: "Status", render: p => (
        <div className="flex flex-wrap gap-1">
          <Pill tone={blogStatusTone(p.status)}>{p.status}</Pill>
          {p.isVisible && <Pill tone="good">Live</Pill>}
        </div>
      ),
    },
    { key: "tags", header: "Tags", render: p => <span className="text-xs text-ink-soft">{p.tags.map(t => t.name).join(", ") || "—"}</span> },
    { key: "place", header: "Place", render: p => <span className="text-xs text-ink-soft">{[p.city?.name, p.country?.name].filter(Boolean).join(", ") || "—"}</span> },
    {
      key: "date", header: "Published", className: "whitespace-nowrap", render: p => (
        <span className="text-ink-soft">{p.status === "Draft" ? "—" : p.status === "Scheduled" ? fmtDateTime(p.publishedAt) : fmtDate(p.publishedAt)}</span>
      ),
    },
    { key: "updated", header: "Updated", className: "whitespace-nowrap", render: p => <span className="text-ink-soft">{fmtDate(p.updatedAt)}</span> },
  ];

  const setStatus = (s: string) => setParams(s ? { status: s } : {}, { replace: true });

  return (
    <AdminPage title="Blog" description="Travel guides at /blog. Drafts and scheduled posts are only visible here."
      actions={<Btn variant="primary" onClick={() => navigate("/admin/blog/new")}><Plus className="w-4 h-4" /> New post</Btn>}>
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder="Search titles" />
        <div className="inline-flex flex-wrap gap-1">
          {["", ...BLOG_STATUSES].map(s => (
            <Btn key={s || "all"} size="sm" variant={status === s ? "primary" : "outline"} onClick={() => setStatus(s)}>{s || "All"}</Btn>
          ))}
        </div>
      </Toolbar>

      {error ? <ErrorBlock message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={p => p.id} loading={loading}
            onRowClick={p => navigate(`/admin/blog/${p.id}`)} empty="No posts yet." />
          {data && <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount}
            onChange={p => setParams(prev => { const n = new URLSearchParams(prev); if (p === 1) n.delete("page"); else n.set("page", String(p)); return n; }, { replace: true })} />}
        </>
      )}
    </AdminPage>
  );
}
