import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus } from "lucide-react";
import { isApiError } from "../../dataStore/v2Api/client";
import { friendlyError } from "../../utils/v2Utils/apiErrors";
import { adminApi, enumName, POOL_TYPES, type AdminFeaturedPoolEntry, type AdminHero, type FeaturedPoolInput, type PoolType } from "../api";
import {
  AdminPage, Btn, Check, ConfirmBtn, DataTable, Drawer, ErrorBlock, Field, LoadingBlock, NumberInput, Panel, Pill, Select,
  TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useQuery, useToast } from "../hooks";
import { fmtDate, fmtDateTime, fmtNumber, fmtUsd, fromLocalInput, toLocalInput } from "../format";
import { WishlistPicker, type PickedRef } from "./PartnersPage";

import Img from "../../components/v2Components/ui/Img";
const typeOf = (e: AdminFeaturedPoolEntry) => enumName(e.poolType, POOL_TYPES);

const TYPE_TONE: Record<PoolType, "info" | "good" | "warn"> = { Editorial: "info", Paid: "good", Random: "warn" };

const TYPE_HINT: Record<PoolType, string> = {
  Editorial: "Hand-picked by the team. New picks go to the end of the editorial order; reorder them under the Editorial filter.",
  Paid: "Sponsored placement, capped by a daily impression limit.",
  Random: "Rotated in at random, weighted by its selection weight.",
};

const dash = <span className="text-ink-muted">—</span>;

// ─── Landing hero ─────────────────────────────────────────────────────────────

// The wishlist shown in the landing page hero. Without one (or once it
// expires), the hero falls back to the first featured wishlist with a photo.
function HeroPanel() {
  const { data: hero, loading, error, reload } = useQuery(() => adminApi.hero.get(), []);
  const [editing, setEditing] = useState(false);

  return (
    <Panel title="Landing page hero" className="mb-6"
      actions={!editing && !loading && !error && (
        <Btn size="sm" variant={hero ? "outline" : "primary"} onClick={() => setEditing(true)}>{hero ? "Change" : "Choose hero"}</Btn>
      )}>
      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingBlock />
      ) : editing ? (
        <HeroForm hero={hero} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); reload(); }} />
      ) : hero ? (
        <HeroSummary hero={hero} onCleared={reload} />
      ) : (
        <p className="text-sm text-ink-muted">
          No hero chosen. The landing page shows the first wishlist from the featured pool below that has a hero image.
        </p>
      )}
    </Panel>
  );
}

function HeroSummary({ hero, onCleared }: { hero: AdminHero; onCleared: () => void }) {
  const { run, busy } = useAction();
  const clear = async () => {
    const r = await run(() => adminApi.hero.clear(), { success: "Hero cleared. The landing page falls back to the featured pool." });
    if (r.ok) onCleared();
  };
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
      <div className="w-full sm:w-40 aspect-4/3 rounded-xl overflow-hidden bg-cream-deep shrink-0">
        {hero.wishlistHeroImage && <Img src={hero.wishlistHeroImage} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ink truncate">{hero.wishlistName}</span>
          {hero.isActive ? <Pill tone="good">Showing</Pill> : <Pill tone="warn">Not showing</Pill>}
        </div>
        <p className="text-sm text-ink-soft">
          {hero.heroUntil ? `Until ${fmtDateTime(hero.heroUntil)}` : "No end date"}
          {!hero.isActive && " · expired or no longer public, so the featured pool is used instead"}
        </p>
        <p className="text-xs text-ink-muted">
          Set {fmtDateTime(hero.setAt)}{hero.setByEmail ? ` by ${hero.setByEmail}` : ""}
        </p>
      </div>
      <ConfirmBtn label="Clear" confirmLabel="Clear hero" variant="outline" size="sm" loading={busy} onConfirm={() => { void clear(); }} />
    </div>
  );
}

function HeroForm({ hero, onCancel, onSaved }: { hero: AdminHero | null; onCancel: () => void; onSaved: () => void }) {
  const [wishlist, setWishlist] = useState<PickedRef | null>(hero ? { id: hero.wishlistId, label: hero.wishlistName } : null);
  const [until, setUntil] = useState(toLocalInput(hero?.heroUntil ?? null));
  const [err, setErr] = useState("");
  const { run, busy } = useAction();

  const save = async () => {
    setErr("");
    if (!wishlist) return setErr("Pick a wishlist.");
    const heroUntil = fromLocalInput(until);
    if (heroUntil && new Date(heroUntil).getTime() <= Date.now()) return setErr("The end date must be in the future.");
    const r = await run(() => adminApi.hero.set({ wishlistId: wishlist.id, heroUntil }), {
      success: "Hero updated. It can take up to a minute to show for visitors who already have the page open.",
      errors: { 404: "That wishlist no longer exists." },
    });
    if (r.ok) onSaved();
  };

  return (
    <div className="space-y-4 max-w-xl">
      <Field label="Wishlist *" hint="Must be public and have a hero image.">
        <WishlistPicker value={wishlist} onChange={setWishlist} disabled={busy} />
      </Field>
      <Field label="Show until" hint="Leave empty to keep it until you change it.">
        <div className="flex items-center gap-2">
          <TextInput type="datetime-local" value={until} onChange={e => setUntil(e.target.value)} className="max-w-64" />
          {until && <Btn size="sm" variant="ghost" onClick={() => setUntil("")}>Clear</Btn>}
        </div>
      </Field>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <Btn variant="primary" loading={busy} onClick={save}>Save hero</Btn>
        <Btn variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Btn>
      </div>
    </div>
  );
}

function EntryDrawer({ entry, onClose, onSaved }: { entry: AdminFeaturedPoolEntry | null; onClose: () => void; onSaved: () => void }) {
  const [wishlist, setWishlist] = useState<PickedRef | null>(entry ? { id: entry.wishlistId, label: entry.wishlistName } : null);
  const [poolType, setPoolType] = useState<PoolType>(entry ? typeOf(entry) : "Editorial");
  const [paidAmount, setPaidAmount] = useState<number | null>(entry?.paidAmount ?? null);
  const [limit, setLimit] = useState<number | null>(entry?.dailyImpressionLimit ?? null);
  const [weight, setWeight] = useState<number | null>(entry?.randomSelectionWeight ?? null);
  const [resetToday, setResetToday] = useState(false);
  const [err, setErr] = useState("");
  const { run, busy } = useAction();
  const del = useAction();

  const errors = { 404: "That wishlist or pool entry no longer exists.", 409: "This wishlist is already in the pool with that type." };

  const save = async () => {
    setErr("");
    if (!wishlist) return setErr("Pick a wishlist.");
    if (poolType === "Paid") {
      if (paidAmount == null || paidAmount < 0) return setErr("Paid entries need a paid amount of 0 or more.");
      if (limit == null || limit < 1 || !Number.isInteger(limit)) return setErr("Paid entries need a whole-number daily impression limit of at least 1.");
    }
    if (poolType === "Random" && (weight == null || weight <= 0)) return setErr("Random entries need a selection weight above 0.");

    // Only send the fields that matter for the chosen type.
    const typed: FeaturedPoolInput = {
      paidAmount: poolType === "Paid" ? paidAmount : null,
      dailyImpressionLimit: poolType === "Paid" ? limit : null,
      randomSelectionWeight: poolType === "Random" ? weight : null,
    };

    if (!entry) {
      // New entries: leave out fields that don't apply instead of sending null.
      const fields = Object.fromEntries(Object.entries(typed).filter(([, v]) => v != null)) as FeaturedPoolInput;
      const r = await run(() => adminApi.featuredPool.create({ wishlistId: wishlist.id, poolType, ...fields }), { success: "Added to the featured pool.", errors });
      if (r.ok) onSaved();
      return;
    }

    const body: FeaturedPoolInput = {};
    if (poolType !== typeOf(entry)) body.poolType = poolType;
    if (typed.paidAmount !== (entry.paidAmount ?? null)) body.paidAmount = typed.paidAmount;
    if (typed.dailyImpressionLimit !== (entry.dailyImpressionLimit ?? null)) body.dailyImpressionLimit = typed.dailyImpressionLimit;
    if (typed.randomSelectionWeight !== (entry.randomSelectionWeight ?? null)) body.randomSelectionWeight = typed.randomSelectionWeight;
    if (resetToday) body.resetImpressionsToday = true;
    if (!Object.keys(body).length) return onClose();
    const r = await run(() => adminApi.featuredPool.update(entry.featuredWishlistPoolId, body), { success: "Pool entry saved.", errors });
    if (r.ok) onSaved();
  };

  const remove = async () => {
    if (!entry) return;
    // A 404 means it's already gone (e.g. unfeaturing removed it), which is what we wanted.
    const r = await del.run(async () => {
      try { await adminApi.featuredPool.remove(entry.featuredWishlistPoolId); }
      catch (e) { if (!isApiError(e, 404)) throw e; }
    }, { success: "Removed from the featured pool." });
    if (r.ok) onSaved();
  };

  return (
    <Drawer open onClose={onClose} title={entry ? entry.wishlistName : "Add to featured pool"}
      footer={<>
        {entry && <span className="mr-auto"><ConfirmBtn label="Remove" confirmLabel="Remove from pool" loading={del.busy} onConfirm={remove} /></span>}
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={busy} onClick={save}>{entry ? "Save" : "Add entry"}</Btn>
      </>}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-soft">Wishlist *</span>
          <WishlistPicker value={wishlist} onChange={setWishlist} disabled={!!entry} />
        </div>
        <Field label="Pool type" hint={TYPE_HINT[poolType]}>
          <Select value={poolType} onChange={setPoolType} label="Pool type" options={POOL_TYPES.map(t => ({ value: t, label: t }))} />
        </Field>
        {poolType === "Paid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Paid amount (USD) *"><NumberInput value={paidAmount} onChange={setPaidAmount} min={0} step={1} /></Field>
            <Field label="Daily impression limit *"><NumberInput value={limit} onChange={setLimit} min={1} step={1} /></Field>
          </div>
        )}
        {poolType === "Random" && (
          <Field label="Selection weight *" hint="Relative chance of being picked; higher = more often.">
            <NumberInput value={weight} onChange={setWeight} min={0} step={0.1} />
          </Field>
        )}
        {entry && (
          <div className="rounded-lg border border-line px-4 py-3 flex flex-col gap-2">
            <p className="text-sm text-ink-soft">
              {fmtNumber(entry.currentImpressionsToday)} impressions today · last rotation {fmtDate(entry.lastRotationDate)}
            </p>
            <Check label="Reset today's impressions" checked={resetToday} onChange={setResetToday} />
          </div>
        )}
        {err && <p className="text-sm text-red-700">{err}</p>}
      </div>
    </Drawer>
  );
}

// ─── Editorial order ──────────────────────────────────────────────────────────

// Editorial picks show to visitors in this order. Drag a row (or use the
// arrows) and the whole new order is saved straight away.
function EditorialList({ version, onOpen, onReordered }: {
  version: number; onOpen: (e: AdminFeaturedPoolEntry) => void; onReordered: () => void;
}) {
  const notify = useToast();
  const { data, setData, loading, error, reload } = useQuery(() => adminApi.featuredPool.list("Editorial"), [version]);
  const [pending, setPending] = useState<AdminFeaturedPoolEntry[] | null>(null); // shown while saving
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const rows = pending ?? data ?? [];

  const save = async (next: AdminFeaturedPoolEntry[]) => {
    setPending(next);
    setSaving(true);
    try {
      setData(await adminApi.featuredPool.reorderEditorial(next.map(e => e.featuredWishlistPoolId)));
      notify("Order saved.");
      onReordered();
    } catch (e) {
      if (isApiError(e, 400)) {
        notify("The Editorial list changed while you were reordering, so it's been reloaded. Try again.", "error");
        reload();
        onReordered(); // the counts above may have changed too
      } else {
        notify(friendlyError(e, {}, "Couldn't save the order."), "error");
      }
    } finally {
      setPending(null);
      setSaving(false);
    }
  };

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void save(next);
  };

  const endDrag = () => { setDragFrom(null); setDropAt(null); };

  if (error) return <ErrorBlock message={error} onRetry={reload} />;
  if (loading && !data) return <LoadingBlock />;
  if (!rows.length) return <p className="text-sm text-ink-muted py-8 text-center border border-dashed border-line rounded-2xl">No editorial picks yet. Featuring a wishlist adds it here.</p>;

  return (
    <div>
      <p className="text-sm text-ink-soft mb-3">Visitors see editorial picks in this order. Drag a row to move it; the new order saves straight away.</p>
      <ol className={`bg-white border border-line rounded-2xl divide-y divide-line ${saving ? "opacity-70" : ""}`} aria-busy={saving}>
        {rows.map((e, i) => (
          <li key={e.featuredWishlistPoolId}
            draggable={!saving}
            onDragStart={ev => { setDragFrom(i); ev.dataTransfer.effectAllowed = "move"; ev.dataTransfer.setData("text/plain", e.featuredWishlistPoolId); }}
            onDragOver={ev => { if (dragFrom === null) return; ev.preventDefault(); setDropAt(i); }}
            onDrop={ev => { ev.preventDefault(); if (dragFrom !== null) move(dragFrom, i); endDrag(); }}
            onDragEnd={endDrag}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${dragFrom === i ? "opacity-40" : ""} ${
              dropAt === i && dragFrom !== null && dragFrom !== i ? (dragFrom < i ? "shadow-[inset_0_-2px_0_var(--color-ink)]" : "shadow-[inset_0_2px_0_var(--color-ink)]") : ""}`}>
            <GripVertical className="w-4 h-4 text-ink-muted shrink-0 cursor-grab active:cursor-grabbing" aria-hidden />
            <span className="w-6 text-right text-sm text-ink-muted tabular-nums shrink-0">{i + 1}</span>
            <button type="button" onClick={() => onOpen(e)} className="flex-1 min-w-0 text-left text-ink truncate hover:underline underline-offset-4">
              {e.wishlistName}
            </button>
            <Btn size="sm" variant="ghost" aria-label={`Move ${e.wishlistName} up`} disabled={i === 0 || saving} onClick={() => move(i, i - 1)}><ArrowUp className="w-3.5 h-3.5" /></Btn>
            <Btn size="sm" variant="ghost" aria-label={`Move ${e.wishlistName} down`} disabled={i === rows.length - 1 || saving} onClick={() => move(i, i + 1)}><ArrowDown className="w-3.5 h-3.5" /></Btn>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function FeaturedPoolPage() {
  const { data, loading, error, reload } = useQuery(() => adminApi.featuredPool.list(), []);
  const [filter, setFilter] = useState<"" | PoolType>("");
  const [drawer, setDrawer] = useState<{ entry: AdminFeaturedPoolEntry | null } | null>(null);
  const [version, setVersion] = useState(0);

  const counts = useMemo(() => {
    const c: Record<PoolType, number> = { Editorial: 0, Paid: 0, Random: 0 };
    for (const e of data ?? []) c[typeOf(e)]++;
    return c;
  }, [data]);

  // The server returns Editorial first, in its display order, then Paid and Random.
  const rows = useMemo(() => (data ?? []).filter(e => !filter || typeOf(e) === filter), [data, filter]);

  const columns: Column<AdminFeaturedPoolEntry>[] = [
    { key: "name", header: "Wishlist", render: e => <span className="text-ink">{e.wishlistName}</span> },
    { key: "order", header: "Editorial #", className: "text-right", render: e => (e.editorialOrder == null ? dash : e.editorialOrder) },
    { key: "type", header: "Pool", render: e => <Pill tone={TYPE_TONE[typeOf(e)]}>{typeOf(e)}</Pill> },
    { key: "paid", header: "Paid", render: e => (e.paidAmount == null ? dash : fmtUsd(e.paidAmount)), className: "text-right" },
    { key: "limit", header: "Daily limit", render: e => (e.dailyImpressionLimit == null ? dash : fmtNumber(e.dailyImpressionLimit)), className: "text-right" },
    {
      key: "today", header: "Today", className: "text-right", render: e => {
        const over = e.dailyImpressionLimit != null && e.currentImpressionsToday >= e.dailyImpressionLimit;
        return <span className={over ? "text-red-700" : ""}>{fmtNumber(e.currentImpressionsToday)}</span>;
      },
    },
    { key: "weight", header: "Weight", render: e => (e.randomSelectionWeight == null ? dash : fmtNumber(e.randomSelectionWeight)), className: "text-right" },
    { key: "rotation", header: "Last rotation", render: e => <span className="text-ink-soft whitespace-nowrap">{fmtDate(e.lastRotationDate)}</span> },
  ];

  const total = data?.length ?? 0;

  return (
    <AdminPage title="Featured pool" description="Wishlists eligible for featured slots: editorial picks, paid placements and random rotation."
      actions={<Btn variant="primary" onClick={() => setDrawer({ entry: null })}><Plus className="w-4 h-4" /> Add entry</Btn>}>
      <HeroPanel />

      <Toolbar>
        <div className="inline-flex flex-wrap gap-1">
          <Btn size="sm" variant={filter === "" ? "primary" : "outline"} onClick={() => setFilter("")}>All · {total}</Btn>
          {POOL_TYPES.map(t => (
            <Btn key={t} size="sm" variant={filter === t ? "primary" : "outline"} onClick={() => setFilter(t)}>{t} · {counts[t]}</Btn>
          ))}
        </div>
      </Toolbar>

      {filter === "Editorial" ? (
        <EditorialList version={version} onOpen={e => setDrawer({ entry: e })} onReordered={reload} />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={e => e.featuredWishlistPoolId} loading={loading}
          onRowClick={e => setDrawer({ entry: e })}
          empty={filter ? `No ${filter.toLowerCase()} entries.` : "The featured pool is empty."} />
      )}

      {drawer && (
        <EntryDrawer key={drawer.entry?.featuredWishlistPoolId ?? "new"} entry={drawer.entry}
          onClose={() => setDrawer(null)} onSaved={() => { setDrawer(null); reload(); setVersion(v => v + 1); }} />
      )}
    </AdminPage>
  );
}
