import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { adminApi, type AdminFeaturedDestination } from "../api";
import {
  AdminPage, Btn, ConfirmBtn, DataTable, Drawer, ErrorBlock, Field, NumberInput, Pill, TextInput, type Column,
} from "../ui";
import { useAction, useQuery } from "../hooks";
import { fmtDateTime, fromLocalInput, toLocalInput } from "../format";
import { SearchPicker, type PickedRef } from "./PartnersPage";
import { Thumb } from "./DestinationsPage";

// Featured destinations, in the order the public app shows them.
// Expired entries (featuredUntil passed) stay listed as inactive until
// unfeatured or given a new date.
export default function FeaturedDestinationsPage() {
  const list = useQuery(() => adminApi.featuredDestinations.list(), []);
  const reorder = useAction();
  const unfeature = useAction();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AdminFeaturedDestination | null>(null);

  const rows = [...(list.data ?? [])].sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
  const activeCount = rows.filter(r => r.isActive).length;

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map(r => r.destinationId);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    // Optimistic: show the new order straight away.
    list.setData(ids.map((id, i) => ({ ...rows.find(r => r.destinationId === id)!, featuredOrder: i + 1 })));
    const res = await reorder.run(() => adminApi.featuredDestinations.reorder(ids), {
      fallback: "Couldn't save the new order.",
    });
    if (res.ok && Array.isArray(res.result)) list.setData(res.result);
    else if (!res.ok) list.reload();
  };

  const remove = async (row: AdminFeaturedDestination) => {
    const res = await unfeature.run(() => adminApi.destinations.unfeature(row.destinationId), {
      success: `${row.destinationName} is no longer featured.`,
      errors: { 404: "That destination no longer exists." },
    });
    if (res.ok) list.reload();
  };

  const columns: Column<AdminFeaturedDestination>[] = [
    {
      key: "order", header: "#", className: "w-24",
      render: r => {
        const i = rows.indexOf(r);
        return (
          <div className="flex items-center gap-1">
            <span className="w-6 text-ink-muted">{i + 1}</span>
            <Btn size="sm" variant="ghost" aria-label="Move up" disabled={i === 0 || reorder.busy} onClick={() => move(i, -1)}>
              <ArrowUp className="w-3.5 h-3.5" />
            </Btn>
            <Btn size="sm" variant="ghost" aria-label="Move down" disabled={i === rows.length - 1 || reorder.busy} onClick={() => move(i, 1)}>
              <ArrowDown className="w-3.5 h-3.5" />
            </Btn>
          </div>
        );
      },
    },
    {
      key: "name", header: "Destination",
      render: r => (
        <div className="flex items-center gap-3 min-w-52">
          <Thumb src={r.heroThumbnailUrl} alt="" />
          <div>
            <p className="font-medium text-ink">{r.destinationName}</p>
            <p className="text-xs text-ink-muted">{r.countryName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status", header: "Status",
      render: r => (r.isActive ? <Pill tone="good">Showing</Pill> : <Pill tone="warn">Expired</Pill>),
    },
    {
      key: "until", header: "Featured until",
      render: r => <span className="whitespace-nowrap text-ink-soft">{r.featuredUntil ? fmtDateTime(r.featuredUntil) : "No end date"}</span>,
    },
    {
      key: "actions", header: "", className: "text-right",
      render: r => (
        <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
          <Btn size="sm" onClick={() => setEditing(r)}>Change dates</Btn>
          <ConfirmBtn size="sm" label="Unfeature" confirmLabel="Unfeature" loading={unfeature.busy} onConfirm={() => { void remove(r); }} />
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      title="Featured destinations"
      description={`Shown on the home page and in the Featured filter, in this order. ${activeCount} showing now.`}
      actions={<Btn variant="primary" onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> Feature a destination</Btn>}
    >
      {list.error ? (
        <ErrorBlock message={list.error} onRetry={list.reload} />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={r => r.destinationId} loading={list.loading}
          empty="No featured destinations yet. Feature one to show it on the home page." />
      )}
      <p className="text-xs text-ink-muted mt-3">
        Expired destinations stop showing to visitors straight away but stay here until you unfeature them or set a new date.
        You can also feature a destination from its page in <Link to="/admin/destinations" className="underline underline-offset-4">Destinations</Link>.
      </p>

      <Drawer open={adding} onClose={() => setAdding(false)} title="Feature a destination">
        {adding && (
          <FeatureForm
            nextPosition={rows.length + 1}
            onDone={updated => { setAdding(false); if (updated) list.setData(updated); else list.reload(); }}
          />
        )}
      </Drawer>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing ? `Change dates · ${editing.destinationName}` : ""}>
        {editing && (
          <FeatureForm
            existing={editing}
            nextPosition={rows.length}
            onDone={updated => { setEditing(null); if (updated) list.setData(updated); else list.reload(); }}
          />
        )}
      </Drawer>
    </AdminPage>
  );
}

// Feature a new destination, or change an existing entry's end date/position.
export function FeatureForm({ existing, fixedDestination, nextPosition, onDone }: {
  existing?: AdminFeaturedDestination | { destinationId: string; destinationName: string; featuredUntil?: string | null; featuredOrder?: number | null };
  fixedDestination?: boolean;
  nextPosition: number;
  // Receives the updated featured list from the API.
  onDone: (updated?: AdminFeaturedDestination[]) => void;
}) {
  const [picked, setPicked] = useState<PickedRef | null>(
    existing ? { id: existing.destinationId, label: existing.destinationName } : null
  );
  const [until, setUntil] = useState(toLocalInput(existing?.featuredUntil ?? null));
  const [order, setOrder] = useState<number | null>(existing?.featuredOrder ?? null);
  const [error, setError] = useState("");
  const save = useAction();
  // Updating an entry that's already featured vs featuring for the first time.
  const isUpdate = !!existing && ("isActive" in existing || existing.featuredOrder != null);

  const submit = async () => {
    setError("");
    if (!picked) return setError("Choose a destination.");
    const featuredUntil = fromLocalInput(until);
    if (featuredUntil && new Date(featuredUntil).getTime() <= Date.now()) return setError("The end date must be in the future.");
    if (order != null && (!Number.isInteger(order) || order < 1)) return setError("Position must be a whole number from 1.");

    // Each call replaces both settings, so always send them explicitly:
    // an empty position keeps an existing entry where it is (omitting it
    // would move it to the end), and an empty date means "no end date".
    const position = order ?? (isUpdate ? existing?.featuredOrder ?? undefined : undefined);
    const res = await save.run(
      () => adminApi.destinations.feature(picked.id, { featuredUntil, order: position }),
      {
        success: isUpdate ? "Featured dates updated." : `${picked.label} is now featured.`,
        errors: { 400: "Check the end date (it must be in the future) and position.", 404: "That destination no longer exists." },
      }
    );
    if (res.ok) onDone(Array.isArray(res.result) ? res.result : undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Destination">
        {existing || fixedDestination ? (
          <TextInput value={picked?.label ?? ""} disabled />
        ) : (
          <SearchPicker
            value={picked}
            onChange={setPicked}
            placeholder="Search destinations"
            search={async term => {
              const r = await adminApi.destinations.list({ search: term, pageSize: 10 });
              return r.items.map(d => ({
                id: d.destinationId,
                label: d.destinationName,
                sub: d.isFeatured ? `${d.countryName} · already featured` : d.countryName,
              }));
            }}
          />
        )}
      </Field>
      <Field
        label="Featured until"
        hint={isUpdate
          ? "Leave empty for no end date (this removes any current end date). To stop featuring it now, use Unfeature."
          : "Optional. Leave empty to keep it featured until you unfeature it."}
      >
        <TextInput type="datetime-local" value={until} onChange={e => setUntil(e.target.value)} />
      </Field>
      <Field label="Position" hint={`Optional, 1 = first. Leave empty to put it ${isUpdate ? "where it is" : `last (#${nextPosition})`}.`}>
        <NumberInput min={1} value={order} onChange={setOrder} />
      </Field>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end">
        <Btn variant="primary" loading={save.busy} onClick={submit}>{isUpdate ? "Save" : "Feature"}</Btn>
      </div>
    </div>
  );
}
