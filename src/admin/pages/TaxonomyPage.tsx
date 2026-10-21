import { useState } from "react";
import { Plus } from "lucide-react";
import { adminApi, type AdminCategory, type AdminTag, type CategoryInput, type TagInput } from "../api";
import {
  AdminPage, Btn, ConfirmBtn, DataTable, Drawer, ErrorBlock, Field, SearchBox, TextArea, TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useQuery } from "../hooks";
import { fmtNumber } from "../format";
import { FieldError } from "./DestinationsPage";

type Tab = "tags" | "categories";

function changedFields<T extends object>(next: T, prev: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(next) as (keyof T)[]) {
    if (JSON.stringify(next[k]) !== JSON.stringify(prev[k])) out[k] = next[k];
  }
  return out;
}

const nullIfBlank = (s: string) => (s.trim() ? s.trim() : null);
const IN_USE = "It's still used by destinations.";

export default function TaxonomyPage() {
  const [tab, setTab] = useState<Tab>("tags");
  return (
    <AdminPage title="Tags & categories" description="The vocabulary used to describe and filter destinations.">
      <div className="inline-flex rounded-full border border-line bg-white p-1 mb-5" role="tablist">
        {(["tags", "categories"] as const).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${tab === t ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}>
            {t === "tags" ? "Tags" : "Categories"}
          </button>
        ))}
      </div>
      {tab === "tags" ? <TagsSection /> : <CategoriesSection />}
    </AdminPage>
  );
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

function TagsSection() {
  const tags = useQuery(() => adminApi.tags.list(), []);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<AdminTag | "new" | null>(null);

  const f = filter.trim().toLowerCase();
  const rows = (tags.data ?? []).filter(t =>
    !f || t.key.toLowerCase().includes(f) || t.tagName.toLowerCase().includes(f) || (t.targetPersonaType ?? "").toLowerCase().includes(f));

  const columns: Column<AdminTag>[] = [
    { key: "name", header: "Tag", render: t => <span className="font-medium">{t.tagName}</span> },
    { key: "key", header: "Key", render: t => <code className="text-xs text-ink-soft">{t.key}</code> },
    { key: "persona", header: "Target persona", render: t => t.targetPersonaType || <span className="text-ink-muted">—</span> },
    { key: "count", header: "Destinations", className: "text-right", render: t => fmtNumber(t.destinationCount) },
  ];

  return (
    <>
      <Toolbar>
        <SearchBox value={filter} onChange={setFilter} placeholder="Filter tags" />
        <div className="flex-1" />
        <Btn variant="primary" onClick={() => setEditing("new")}><Plus className="w-4 h-4" /> New tag</Btn>
      </Toolbar>
      {tags.error ? <ErrorBlock message={tags.error} onRetry={tags.reload} /> : (
        <DataTable columns={columns} rows={rows} rowKey={t => t.tagId} loading={tags.loading}
          onRowClick={t => setEditing(t)} empty={f ? "No tags match." : "No tags yet."} />
      )}
      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New tag" : "Edit tag"}>
        {editing && (
          <TagEditor key={editing === "new" ? "new" : editing.tagId} tag={editing === "new" ? null : editing}
            onDone={() => { setEditing(null); tags.reload(); }} />
        )}
      </Drawer>
    </>
  );
}

function TagEditor({ tag, onDone }: { tag: AdminTag | null; onDone: () => void }) {
  const [key, setKey] = useState(tag?.key ?? "");
  const [tagName, setTagName] = useState(tag?.tagName ?? "");
  const [persona, setPersona] = useState(tag?.targetPersonaType ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAction();
  const del = useAction();

  const input: TagInput = { key: key.trim(), tagName: tagName.trim(), targetPersonaType: nullIfBlank(persona) };
  const diff = tag ? changedFields(input, { key: tag.key, tagName: tag.tagName, targetPersonaType: tag.targetPersonaType }) : input;
  const dirty = Object.keys(diff).length > 0;

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!input.key) e.key = "Key is required.";
    if (!input.tagName) e.tagName = "Name is required.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const errorsMap = { 409: "A tag with this key already exists.", 404: "This tag no longer exists." };
    const r = tag
      ? await save.run(() => adminApi.tags.update(tag.tagId, diff), { success: "Tag saved", errors: errorsMap })
      : await save.run(() => adminApi.tags.create(input), { success: "Tag created", errors: errorsMap });
    if (r.ok) onDone();
  };

  const remove = async () => {
    if (!tag) return;
    const r = await del.run(() => adminApi.tags.remove(tag.tagId), { success: "Tag deleted", errors: { 409: IN_USE, 404: "This tag no longer exists." } });
    if (r.ok) onDone();
  };

  return (
    <div className="space-y-4">
      <Field label="Key *" hint="Stable identifier used in filters and URLs.">
        <TextInput value={key} onChange={e => setKey(e.target.value)} placeholder="e.g. beach" />
        <FieldError message={errors.key} />
      </Field>
      <Field label="Name *">
        <TextInput value={tagName} onChange={e => setTagName(e.target.value)} placeholder="e.g. Beach" />
        <FieldError message={errors.tagName} />
      </Field>
      <Field label="Target persona type">
        <TextInput value={persona} onChange={e => setPersona(e.target.value)} />
      </Field>
      {tag && <p className="text-xs text-ink-muted">Used by {fmtNumber(tag.destinationCount)} destinations.</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        <div>{tag && <ConfirmBtn label="Delete tag" confirmLabel="Delete" loading={del.busy} onConfirm={remove} />}</div>
        <Btn variant="primary" loading={save.busy} disabled={!!tag && !dirty} onClick={submit}>{tag ? "Save changes" : "Create tag"}</Btn>
      </div>
    </div>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────

function Swatch({ hex }: { hex: string | null }) {
  return (
    <span className="inline-block w-4 h-4 rounded-full border border-line shrink-0"
      style={{ background: hex && /^#?[0-9a-f]{3,8}$/i.test(hex) ? (hex.startsWith("#") ? hex : `#${hex}`) : "transparent" }} />
  );
}

function CategoriesSection() {
  const cats = useQuery(() => adminApi.categories.list(), []);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);

  const f = filter.trim().toLowerCase();
  const rows = (cats.data ?? []).filter(c =>
    !f || c.key.toLowerCase().includes(f) || c.categoryName.toLowerCase().includes(f) || (c.categoryDescription ?? "").toLowerCase().includes(f));

  const columns: Column<AdminCategory>[] = [
    {
      key: "name", header: "Category",
      render: c => <span className="flex items-center gap-2 font-medium"><Swatch hex={c.colorHex} />{c.categoryName}</span>,
    },
    { key: "key", header: "Key", render: c => <code className="text-xs text-ink-soft">{c.key}</code> },
    { key: "desc", header: "Description", render: c => <span className="text-ink-soft line-clamp-2 max-w-md">{c.categoryDescription || "—"}</span> },
    { key: "icon", header: "Icon", render: c => c.iconName || <span className="text-ink-muted">—</span> },
    { key: "color", header: "Colour", render: c => <code className="text-xs text-ink-soft">{c.colorHex || "—"}</code> },
    { key: "count", header: "Destinations", className: "text-right", render: c => fmtNumber(c.destinationCount) },
  ];

  return (
    <>
      <Toolbar>
        <SearchBox value={filter} onChange={setFilter} placeholder="Filter categories" />
        <div className="flex-1" />
        <Btn variant="primary" onClick={() => setEditing("new")}><Plus className="w-4 h-4" /> New category</Btn>
      </Toolbar>
      {cats.error ? <ErrorBlock message={cats.error} onRetry={cats.reload} /> : (
        <DataTable columns={columns} rows={rows} rowKey={c => c.categoryId} loading={cats.loading}
          onRowClick={c => setEditing(c)} empty={f ? "No categories match." : "No categories yet."} />
      )}
      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New category" : "Edit category"}>
        {editing && (
          <CategoryEditor key={editing === "new" ? "new" : editing.categoryId} category={editing === "new" ? null : editing}
            onDone={() => { setEditing(null); cats.reload(); }} />
        )}
      </Drawer>
    </>
  );
}

function CategoryEditor({ category, onDone }: { category: AdminCategory | null; onDone: () => void }) {
  const [form, setForm] = useState({
    key: category?.key ?? "",
    categoryName: category?.categoryName ?? "",
    categoryDescription: category?.categoryDescription ?? "",
    iconName: category?.iconName ?? "",
    colorHex: category?.colorHex ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useAction();
  const del = useAction();
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const input: CategoryInput = {
    key: form.key.trim(),
    categoryName: form.categoryName.trim(),
    categoryDescription: nullIfBlank(form.categoryDescription),
    iconName: nullIfBlank(form.iconName),
    colorHex: nullIfBlank(form.colorHex),
  };
  const diff = category
    ? changedFields(input, {
      key: category.key, categoryName: category.categoryName, categoryDescription: category.categoryDescription,
      iconName: category.iconName, colorHex: category.colorHex,
    })
    : input;
  const dirty = Object.keys(diff).length > 0;
  const validHex = /^#[0-9a-f]{6}$/i.test(form.colorHex);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!input.key) e.key = "Key is required.";
    if (!input.categoryName) e.categoryName = "Name is required.";
    if (form.colorHex.trim() && !/^#?[0-9a-f]{3,8}$/i.test(form.colorHex.trim())) e.colorHex = "Use a hex colour like #1A2B3C.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const errorsMap = { 409: "A category with this key already exists.", 404: "This category no longer exists." };
    const r = category
      ? await save.run(() => adminApi.categories.update(category.categoryId, diff), { success: "Category saved", errors: errorsMap })
      : await save.run(() => adminApi.categories.create(input), { success: "Category created", errors: errorsMap });
    if (r.ok) onDone();
  };

  const remove = async () => {
    if (!category) return;
    const r = await del.run(() => adminApi.categories.remove(category.categoryId), {
      success: "Category deleted", errors: { 409: IN_USE, 404: "This category no longer exists." },
    });
    if (r.ok) onDone();
  };

  return (
    <div className="space-y-4">
      <Field label="Key *" hint="Stable identifier used in filters and URLs.">
        <TextInput value={form.key} onChange={e => set("key", e.target.value)} placeholder="e.g. culture" />
        <FieldError message={errors.key} />
      </Field>
      <Field label="Name *">
        <TextInput value={form.categoryName} onChange={e => set("categoryName", e.target.value)} placeholder="e.g. Culture" />
        <FieldError message={errors.categoryName} />
      </Field>
      <Field label="Description">
        <TextArea value={form.categoryDescription} onChange={e => set("categoryDescription", e.target.value)} />
      </Field>
      <Field label="Icon name" hint="Lucide icon name, e.g. landmark">
        <TextInput value={form.iconName} onChange={e => set("iconName", e.target.value)} />
      </Field>
      <div>
        <p className="text-xs font-medium text-ink-soft mb-1">Colour</p>
        <div className="flex items-center gap-2">
          <input type="color" aria-label="Pick colour" value={validHex ? form.colorHex : "#000000"}
            onChange={e => set("colorHex", e.target.value.toUpperCase())}
            className="w-10 h-10 rounded-lg border border-line bg-white p-1 cursor-pointer" />
          <Swatch hex={form.colorHex || null} />
          <TextInput value={form.colorHex} onChange={e => set("colorHex", e.target.value)} placeholder="#1A2B3C" className="max-w-40" />
          {form.colorHex && <Btn size="sm" variant="ghost" onClick={() => set("colorHex", "")}>Clear</Btn>}
        </div>
        <FieldError message={errors.colorHex} />
      </div>
      {category && <p className="text-xs text-ink-muted">Used by {fmtNumber(category.destinationCount)} destinations.</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        <div>{category && <ConfirmBtn label="Delete category" confirmLabel="Delete" loading={del.busy} onConfirm={remove} />}</div>
        <Btn variant="primary" loading={save.busy} disabled={!!category && !dirty} onClick={submit}>{category ? "Save changes" : "Create category"}</Btn>
      </div>
    </div>
  );
}
