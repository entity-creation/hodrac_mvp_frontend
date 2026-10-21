import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { adminApi, enumName, POOL_TYPES, type AdminFeaturedPoolEntry, type FeaturedPoolInput, type PoolType } from "../api";
import {
  AdminPage, Btn, Check, ConfirmBtn, DataTable, Drawer, ErrorBlock, Field, NumberInput, Pill, Select, Toolbar, type Column,
} from "../ui";
import { useAction, useQuery } from "../hooks";
import { fmtDate, fmtNumber, fmtUsd } from "../format";
import { WishlistPicker, type PickedRef } from "./PartnersPage";

const typeOf = (e: AdminFeaturedPoolEntry) => enumName(e.poolType, POOL_TYPES);

const TYPE_TONE: Record<PoolType, "info" | "good" | "warn"> = { Editorial: "info", Paid: "good", Random: "warn" };

const TYPE_HINT: Record<PoolType, string> = {
  Editorial: "Hand-picked by the team. No extra settings.",
  Paid: "Sponsored placement, capped by a daily impression limit.",
  Random: "Rotated in at random, weighted by its selection weight.",
};

const dash = <span className="text-ink-muted">—</span>;

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
      const r = await run(() => adminApi.featuredPool.create({ wishlistId: wishlist.id, poolType, ...typed }), { success: "Added to the featured pool.", errors });
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
    const r = await del.run(() => adminApi.featuredPool.remove(entry.featuredWishlistPoolId), { success: "Removed from the featured pool.", errors });
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

export default function FeaturedPoolPage() {
  const { data, loading, error, reload } = useQuery(() => adminApi.featuredPool.list(), []);
  const [filter, setFilter] = useState<"" | PoolType>("");
  const [drawer, setDrawer] = useState<{ entry: AdminFeaturedPoolEntry | null } | null>(null);

  const counts = useMemo(() => {
    const c: Record<PoolType, number> = { Editorial: 0, Paid: 0, Random: 0 };
    for (const e of data ?? []) c[typeOf(e)]++;
    return c;
  }, [data]);

  const rows = useMemo(
    () => (data ?? [])
      .filter(e => !filter || typeOf(e) === filter)
      .sort((a, b) => POOL_TYPES.indexOf(typeOf(a)) - POOL_TYPES.indexOf(typeOf(b)) || a.wishlistName.localeCompare(b.wishlistName)),
    [data, filter]
  );

  const columns: Column<AdminFeaturedPoolEntry>[] = [
    { key: "name", header: "Wishlist", render: e => <span className="text-ink">{e.wishlistName}</span> },
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
      <Toolbar>
        <div className="inline-flex flex-wrap gap-1">
          <Btn size="sm" variant={filter === "" ? "primary" : "outline"} onClick={() => setFilter("")}>All · {total}</Btn>
          {POOL_TYPES.map(t => (
            <Btn key={t} size="sm" variant={filter === t ? "primary" : "outline"} onClick={() => setFilter(t)}>{t} · {counts[t]}</Btn>
          ))}
        </div>
      </Toolbar>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={e => e.featuredWishlistPoolId} loading={loading}
          onRowClick={e => setDrawer({ entry: e })}
          empty={filter ? `No ${filter.toLowerCase()} entries.` : "The featured pool is empty."} />
      )}

      {drawer && (
        <EntryDrawer key={drawer.entry?.featuredWishlistPoolId ?? "new"} entry={drawer.entry}
          onClose={() => setDrawer(null)} onSaved={() => { setDrawer(null); reload(); }} />
      )}
    </AdminPage>
  );
}
