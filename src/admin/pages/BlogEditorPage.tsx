import { useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, X } from "lucide-react";
import { adminApi } from "../api";
import { blogAdminApi, blogStatusTone, type AdminBlogPost, type BlogPostInput } from "../blogApi";
import { SearchPicker, type PickedRef } from "./PartnersPage";
import { AdminPage, Btn, ConfirmBtn, ErrorBlock, LoadingBlock, Panel, Pill, TextArea, TextInput } from "../ui";
import { useQuery, useToast } from "../hooks";
import { fmtDateTime, fromLocalInput, toLocalInput } from "../format";
import BlogMarkdown from "../../components/v2Components/blog/BlogMarkdown";
import { fieldErrors, formErrorText } from "../../utils/v2Utils/host";
import { blogPath } from "../../utils/v2Utils/routes";

// ─── Form model ───────────────────────────────────────────────────────────────

interface Form {
  title: string; slug: string; excerpt: string; bodyMarkdown: string;
  coverImageUrl: string; coverImageAlt: string; authorName: string;
  metaTitle: string; metaDescription: string; canonicalUrl: string;
  city: PickedRef | null; country: PickedRef | null;
  tagKeys: string[];
  destinations: PickedRef[]; wishlists: PickedRef[]; events: PickedRef[];
}

const TEXT_FIELDS = [
  "title", "slug", "excerpt", "bodyMarkdown", "coverImageUrl", "coverImageAlt",
  "authorName", "metaTitle", "metaDescription", "canonicalUrl",
] as const;

const emptyForm: Form = {
  title: "", slug: "", excerpt: "", bodyMarkdown: "", coverImageUrl: "", coverImageAlt: "", authorName: "Hodrac Team",
  metaTitle: "", metaDescription: "", canonicalUrl: "", city: null, country: null, tagKeys: [],
  destinations: [], wishlists: [], events: [],
};

const fmtShortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function toForm(p: AdminBlogPost): Form {
  return {
    title: p.title, slug: p.slug, excerpt: p.excerpt, bodyMarkdown: p.bodyMarkdown,
    coverImageUrl: p.coverImageUrl ?? "", coverImageAlt: p.coverImageAlt ?? "", authorName: p.authorName ?? "",
    metaTitle: p.metaTitle ?? "", metaDescription: p.metaDescription ?? "", canonicalUrl: p.canonicalUrl ?? "",
    city: p.city ? { id: p.city.id, label: p.city.name } : null,
    country: p.country ? { id: p.country.id, label: p.country.name } : null,
    tagKeys: p.tagKeys,
    // Keep the saved order (the id lists); the card lists give the names.
    destinations: p.destinationIds.map(id => {
      const d = p.destinations.find(x => x.id === id);
      return { id, label: d?.name ?? id, sub: d ? [d.city, d.country].filter(Boolean).join(", ") : null };
    }),
    wishlists: p.wishlistIds.map(id => {
      const w = p.wishlists.find(x => x.id === id);
      return { id, label: w?.name ?? id, sub: w ? `${w.totalDays} days` : null };
    }),
    events: p.eventIds.map(id => {
      const e = p.events.find(x => x.id === id);
      return { id, label: e?.name ?? id, sub: e ? fmtShortDate(e.startsAt) : null };
    }),
  };
}

const ids = (refs: PickedRef[]) => refs.map(r => r.id);
const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const orNull = (s: string) => (s.trim() ? s.trim() : null);

function createBody(f: Form): BlogPostInput {
  return {
    title: f.title.trim(), slug: orNull(f.slug), excerpt: f.excerpt.trim(), bodyMarkdown: f.bodyMarkdown,
    coverImageUrl: orNull(f.coverImageUrl), coverImageAlt: orNull(f.coverImageAlt), authorName: orNull(f.authorName),
    metaTitle: orNull(f.metaTitle), metaDescription: orNull(f.metaDescription), canonicalUrl: orNull(f.canonicalUrl),
    cityId: f.city?.id ?? null, countryId: f.country?.id ?? null, tagKeys: f.tagKeys,
    destinationIds: ids(f.destinations), wishlistIds: ids(f.wishlists), eventIds: ids(f.events),
    status: "Draft", publishedAt: null,
  };
}

// Edit: only what changed. "" clears optional text; arrays replace the set.
function patchBody(f: Form, saved: Form): BlogPostInput {
  const body: BlogPostInput = {};
  for (const k of TEXT_FIELDS) {
    if (f[k] === saved[k]) continue;
    if (k === "slug") { if (f.slug.trim()) body.slug = f.slug.trim(); continue; } // can't blank a slug
    if (k === "bodyMarkdown") body.bodyMarkdown = f.bodyMarkdown;
    else body[k] = f[k].trim();
  }
  if (f.city?.id !== saved.city?.id) { if (f.city) body.cityId = f.city.id; else body.clearCity = true; }
  if (f.country?.id !== saved.country?.id) { if (f.country) body.countryId = f.country.id; else body.clearCountry = true; }
  if (!sameIds(f.tagKeys, saved.tagKeys)) body.tagKeys = f.tagKeys;
  if (!sameIds(ids(f.destinations), ids(saved.destinations))) body.destinationIds = ids(f.destinations);
  if (!sameIds(ids(f.wishlists), ids(saved.wishlists))) body.wishlistIds = ids(f.wishlists);
  if (!sameIds(ids(f.events), ids(saved.events))) body.eventIds = ids(f.events);
  return body;
}

// ─── Searches for the pickers ─────────────────────────────────────────────────

const searchDestinations = (search: string) =>
  adminApi.destinations.list({ search, pageSize: 10 }).then(r =>
    r.items.map(d => ({ id: d.destinationId, label: d.destinationName, sub: d.countryName })));
const searchWishlists = (search: string) =>
  adminApi.wishlists.list({ search, pageSize: 10 }).then(r =>
    r.items.map(w => ({ id: w.wishlistId, label: w.wishlistName, sub: `${w.totalDays} days` })));
const searchEvents = (search: string) =>
  blogAdminApi.searchEvents(search).then(r =>
    r.items.map(e => ({ id: e.id, label: e.name, sub: fmtShortDate(e.startsAt) })));
const searchCities = (search: string) =>
  adminApi.cities.list({ search }).then(r =>
    r.slice(0, 10).map(c => ({ id: c.cityId, label: c.cityName, sub: c.countryName })));
const searchCountries = (search: string) =>
  adminApi.countries.list().then(r =>
    r.filter(c => c.countryName.toLowerCase().includes(search.trim().toLowerCase()))
      .slice(0, 10).map(c => ({ id: c.countryId, label: c.countryName })));

const CARD_SEARCH = { destination: searchDestinations, wishlist: searchWishlists, event: searchEvents } as const;
type CardType = keyof typeof CARD_SEARCH;

// ─── Page ─────────────────────────────────────────────────────────────────────

// /admin/blog/new and /admin/blog/:id
export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const { data, loading, error, reload } = useQuery(() => (isNew ? Promise.resolve(null) : blogAdminApi.get(id!)), [id]);

  return (
    <AdminPage title={isNew ? "New post" : data?.title || "Edit post"}
      actions={<Link to="/admin/blog" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="w-4 h-4" /> All posts</Link>}>
      {isNew ? <Editor key="new" post={null} />
        : error ? <ErrorBlock message={error} onRetry={reload} />
        : loading && !data ? <LoadingBlock />
        : data && <Editor key={`${data.id}:${data.updatedAt}:${data.status}`} post={data} />}
    </AdminPage>
  );
}

function Editor({ post: initial }: { post: AdminBlogPost | null }) {
  const navigate = useNavigate();
  const notify = useToast();
  const [post, setPost] = useState(initial);
  const saved = useMemo(() => (post ? toForm(post) : emptyForm), [post]);
  const [form, setForm] = useState<Form>(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState(post?.status === "Scheduled" ? toLocalInput(post.publishedAt) : "");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const createdId = useRef<string | null>(null);

  // The server may fill things in (e.g. the slug), so the form follows it after each save.
  const apply = (p: AdminBlogPost) => {
    setPost(p);
    setForm(toForm(p));
    setScheduleAt(p.status === "Scheduled" ? toLocalInput(p.publishedAt) : "");
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));
  const dirty = !post || Object.keys(patchBody(form, saved)).length > 0;

  const fail = (e: unknown, fallback: string) => {
    setErrors(fieldErrors(e));
    setFormError(formErrorText(e, { 404: "This post no longer exists." }, fallback));
  };

  // Saves if needed; returns the saved post (or null on failure).
  const save = async (): Promise<AdminBlogPost | null> => {
    setErrors({}); setFormError("");
    if (!form.title.trim()) { setErrors({ title: "Give the post a title." }); return null; }
    try {
      if (!post) {
        const created = await blogAdminApi.create(createBody(form));
        apply(created);
        createdId.current = created.id; // the URL moves to it once the action is done
        return created;
      }
      if (!dirty) return post;
      const updated = await blogAdminApi.update(post.id, patchBody(form, saved));
      apply(updated);
      return updated;
    } catch (e) {
      fail(e, "Couldn't save the post.");
      return null;
    }
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    try { await fn(); } finally { setBusy(null); }
    if (createdId.current) navigate(`/admin/blog/${createdId.current}`, { replace: true });
  };

  const onSave = () => run("save", async () => { if (await save()) notify("Saved."); });

  const onPublish = (when: string | null) => run(when ? "schedule" : "publish", async () => {
    const p = await save();
    if (!p) return;
    try {
      const published = await blogAdminApi.publish(p.id, when);
      apply(published);
      notify(published.status === "Scheduled" ? `Scheduled for ${fmtDateTime(published.publishedAt)}.` : "Published.");
    } catch (e) { fail(e, "Couldn't publish the post."); }
  });

  const onUnpublish = () => run("unpublish", async () => {
    if (!post) return;
    try { apply(await blogAdminApi.unpublish(post.id)); notify("Moved back to draft."); }
    catch (e) { fail(e, "Couldn't unpublish the post."); }
  });

  const onDelete = () => run("delete", async () => {
    if (!post) return;
    try { await blogAdminApi.remove(post.id); createdId.current = null; notify("Post deleted."); navigate("/admin/blog"); }
    catch (e) { fail(e, "Couldn't delete the post."); }
  });

  // Puts a card marker on its own line at the cursor.
  const insertMarker = (type: CardType, ref: PickedRef) => {
    const marker = `{{${type}:${ref.id}}}`;
    const el = bodyRef.current;
    const text = form.bodyMarkdown;
    const at = el ? el.selectionStart : text.length;
    const before = text.slice(0, at).replace(/\s*$/, "");
    const after = text.slice(at).replace(/^\s*/, "");
    set("bodyMarkdown", `${before}${before ? "\n\n" : ""}${marker}\n\n${after}`);
    requestAnimationFrame(() => {
      if (!el) return;
      const pos = before.length + (before ? 2 : 0) + marker.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const err = (k: string) => errors[k] ? <p className="text-xs text-red-700">{errors[k]}</p> : null;
  const status = post?.status ?? "Draft";

  return (
    <div className="space-y-6">
      {/* Status and actions */}
      <div className="sticky top-0 z-10 -mx-1 px-1 py-3 bg-cream/95 backdrop-blur flex flex-wrap items-center gap-2 border-b border-line">
        <Pill tone={blogStatusTone(status)}>{post ? status : "Not saved"}</Pill>
        {post?.isVisible && <Pill tone="good">Live</Pill>}
        {post?.status === "Scheduled" && <span className="text-xs text-ink-muted">Goes live {fmtDateTime(post.publishedAt)}</span>}
        {post?.status === "Published" && post.publishedAt && <span className="text-xs text-ink-muted">Published {fmtDateTime(post.publishedAt)}</span>}
        {dirty && post && <span className="text-xs text-sun-500">Unsaved changes</span>}
        <span className="flex-1" />
        {post?.isVisible && (
          <a href={blogPath(post.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-ink underline underline-offset-4">
            View on site <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <Btn variant={status === "Published" ? "primary" : "outline"} loading={busy === "save"} disabled={!!busy || (!!post && !dirty)} onClick={onSave}>
          {post ? "Save changes" : "Save draft"}
        </Btn>
        {status !== "Published" && (
          <Btn variant="primary" loading={busy === "publish"} disabled={!!busy} onClick={() => onPublish(null)}>
            {dirty ? "Save and publish now" : "Publish now"}
          </Btn>
        )}
      </div>

      {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          <Panel>
            <div className="space-y-4">
              <Labeled label="Title">
                <TextInput value={form.title} onChange={e => set("title", e.target.value)} maxLength={200} placeholder="Things to Do in Benin City" className="text-lg" />
                {err("title")}
              </Labeled>
              <Labeled label="Link" hint={post ? `Changing it keeps the old link working (it redirects).${post.previousSlugs.length ? ` Old links: ${post.previousSlugs.join(", ")}` : ""}` : "Leave empty to make one from the title."}>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-ink-muted">/blog/</span>
                  <TextInput value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="things-to-do-in-benin-city" />
                </div>
                {err("slug")}
              </Labeled>
              <Labeled label="Excerpt" hint="One or two sentences for the post list and search results. Needed to publish.">
                <TextArea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={2} maxLength={500} />
                {err("excerpt")}
              </Labeled>
            </div>
          </Panel>

          <Panel title="Body" padded>
            <div className="space-y-3">
              <CardInserter onInsert={insertMarker} />
              <div className="grid gap-4 2xl:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-ink-soft mb-1">Markdown</p>
                  <textarea ref={bodyRef} value={form.bodyMarkdown} onChange={e => set("bodyMarkdown", e.target.value)}
                    className="w-full min-h-[560px] rounded-lg border border-line bg-white px-3 py-2 font-mono text-[13px] leading-relaxed focus:outline-none focus:border-ink resize-y"
                    placeholder={"## Cinemas\n\nWrite in Markdown. **Bold**, *italic*, [links](https://…), lists and ## headings.\n\n{{destination:kada-plaza}}"} />
                  {err("bodyMarkdown")}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink-soft mb-1">Preview</p>
                  <div className="rounded-lg border border-line bg-white px-5 py-2 max-h-[720px] overflow-y-auto">
                    {form.bodyMarkdown.trim()
                      ? <BlogMarkdown body={form.bodyMarkdown} embeds={post?.embeds ?? []} preview />
                      : <p className="py-6 text-sm text-ink-muted">Nothing to preview yet.</p>}
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">Cards added since the last save show as placeholders until you save.</p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Linked items" padded>
            <p className="text-sm text-ink-soft mb-4">Shown at the end of the post as “Book this trip” or “Places in this post”, and used for related posts on those pages.</p>
            <div className="grid gap-6 lg:grid-cols-3">
              <MultiPicker title="Itineraries" value={form.wishlists} onChange={v => set("wishlists", v)} search={searchWishlists} />
              <MultiPicker title="Places" value={form.destinations} onChange={v => set("destinations", v)} search={searchDestinations} />
              <MultiPicker title="Events" value={form.events} onChange={v => set("events", v)} search={searchEvents} />
            </div>
            {err("destinationIds")}{err("wishlistIds")}{err("eventIds")}
          </Panel>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Panel title="Publishing">
            <div className="space-y-3">
              <Labeled label="Schedule for" hint="Your local time. It goes live by itself at that time.">
                <TextInput type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} />
                {err("publishedAt")}
              </Labeled>
              <Btn loading={busy === "schedule"} disabled={!!busy || !scheduleAt || new Date(scheduleAt) <= new Date()}
                onClick={() => onPublish(fromLocalInput(scheduleAt))}>
                {post?.status === "Scheduled" ? "Change the time" : "Schedule"}
              </Btn>
              {post && status !== "Draft" && (
                <div>
                  <ConfirmBtn label="Unpublish" confirmLabel="Yes, move to draft" loading={busy === "unpublish"} variant="outline"
                    message="The post comes off the site and goes back to draft." onConfirm={() => { void onUnpublish(); }} />
                </div>
              )}
              {post && (
                <div>
                  <ConfirmBtn label="Delete post" confirmLabel="Yes, delete" loading={busy === "delete"}
                    message="This can't be undone. Its link will stop working." onConfirm={() => { void onDelete(); }} />
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Cover and author">
            <div className="space-y-3">
              <Labeled label="Cover image URL">
                <TextInput value={form.coverImageUrl} onChange={e => set("coverImageUrl", e.target.value)} placeholder="https://…" />
                {err("coverImageUrl")}
              </Labeled>
              {form.coverImageUrl.startsWith("http") && <img src={form.coverImageUrl} alt="" className="w-full aspect-[16/9] object-cover rounded-lg bg-cream-deep" />}
              <Labeled label="Cover image description" hint="For screen readers and search engines.">
                <TextInput value={form.coverImageAlt} onChange={e => set("coverImageAlt", e.target.value)} />
              </Labeled>
              <Labeled label="Author">
                <TextInput value={form.authorName} onChange={e => set("authorName", e.target.value)} />
              </Labeled>
            </div>
          </Panel>

          <Panel title="Topic and place">
            <div className="space-y-4">
              <TagPicker value={form.tagKeys} onChange={v => set("tagKeys", v)} />
              {err("tagKeys")}
              <div>
                <p className="text-xs font-medium text-ink-soft mb-1">City</p>
                <SearchPicker value={form.city} onChange={v => set("city", v)} search={searchCities} placeholder="Search cities" />
                {err("cityId")}
              </div>
              <div>
                <p className="text-xs font-medium text-ink-soft mb-1">Country</p>
                <SearchPicker value={form.country} onChange={v => set("country", v)} search={searchCountries} placeholder="Search countries" />
                {err("countryId")}
              </div>
            </div>
          </Panel>

          <Panel title="Search engines">
            <div className="space-y-3">
              <Labeled label={`SEO title (${form.metaTitle.length}/70)`} hint="Leave empty to use the post title.">
                <TextInput value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)} maxLength={70} />
                {err("metaTitle")}
              </Labeled>
              <Labeled label={`SEO description (${form.metaDescription.length}/160)`} hint="Leave empty to use the excerpt.">
                <TextArea value={form.metaDescription} onChange={e => set("metaDescription", e.target.value)} rows={3} maxLength={160} />
                {err("metaDescription")}
              </Labeled>
              <Labeled label="Canonical URL" hint="Only if this post first appeared on another site.">
                <TextInput value={form.canonicalUrl} onChange={e => set("canonicalUrl", e.target.value)} placeholder="https://…" />
                {err("canonicalUrl")}
              </Labeled>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

// Like Field, but a <div>: pickers and buttons can't sit inside a <label>.
function Labeled({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-ink-muted">{hint}</span>}
    </div>
  );
}

function CardInserter({ onInsert }: { onInsert: (type: CardType, ref: PickedRef) => void }) {
  const [type, setType] = useState<CardType | null>(null);
  return (
    <div className="rounded-lg border border-line bg-cream-deep/40 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-soft">Insert a card at the cursor:</span>
        {(Object.keys(CARD_SEARCH) as CardType[]).map(t => (
          <Btn key={t} size="sm" variant={type === t ? "primary" : "outline"} onClick={() => setType(type === t ? null : t)}>
            {t === "destination" ? "Place" : t === "wishlist" ? "Itinerary" : "Event"}
          </Btn>
        ))}
      </div>
      {type && (
        <SearchPicker key={type} value={null} search={CARD_SEARCH[type]} placeholder={`Search ${type === "destination" ? "places" : type === "wishlist" ? "itineraries" : "events"}`}
          onChange={v => { if (v) { onInsert(type, v); setType(null); } }} />
      )}
    </div>
  );
}

function MultiPicker({ title, value, onChange, search }: {
  title: string; value: PickedRef[]; onChange: (v: PickedRef[]) => void; search: (term: string) => Promise<PickedRef[]>;
}) {
  const [adding, setAdding] = useState(false);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink-soft">{title}</p>
      {value.length > 0 && (
        <ol className="divide-y divide-line rounded-lg border border-line">
          {value.map((r, i) => (
            <li key={r.id} className="flex items-center gap-1 px-2 py-1.5">
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-ink truncate">{r.label}</span>
                {r.sub && <span className="block text-[11px] text-ink-muted truncate">{r.sub}</span>}
              </span>
              <Btn size="sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-3.5 h-3.5" /></Btn>
              <Btn size="sm" variant="ghost" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-3.5 h-3.5" /></Btn>
              <Btn size="sm" variant="ghost" aria-label={`Remove ${r.label}`} onClick={() => onChange(value.filter(x => x.id !== r.id))}><X className="w-3.5 h-3.5" /></Btn>
            </li>
          ))}
        </ol>
      )}
      {adding ? (
        <div className="space-y-2">
          <SearchPicker value={null} search={search} placeholder={`Search ${title.toLowerCase()}`}
            onChange={v => { if (v && !value.some(x => x.id === v.id)) onChange([...value, v]); setAdding(false); }} />
          <Btn size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Btn>
        </div>
      ) : (
        <Btn size="sm" onClick={() => setAdding(true)}>Add</Btn>
      )}
    </div>
  );
}

function TagPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { data, loading, error, reload } = useQuery(() => adminApi.tags.list(), []);
  const toggle = (key: string) => onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);
  return (
    <div>
      <p className="text-xs font-medium text-ink-soft mb-1">Tags</p>
      {error ? <ErrorBlock message={error} onRetry={reload} /> : loading && !data ? <p className="text-xs text-ink-muted">Loading…</p> : (
        <div className="flex flex-wrap gap-1.5">
          {(data ?? []).map(t => {
            const on = value.includes(t.key);
            return (
              <button key={t.tagId} type="button" onClick={() => toggle(t.key)} aria-pressed={on}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${on ? "bg-ink text-white border-ink" : "border-line text-ink hover:border-ink"}`}>
                {t.tagName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
