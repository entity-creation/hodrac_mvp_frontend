import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";
import { adminApi, type AdminCity, type AdminCountry, type CityInput, type CountryInput } from "../api";
import {
  AdminPage, Btn, DataTable, Drawer, ErrorBlock, Field, NumberInput, Panel, SearchBox, TextArea, TextInput, Toolbar, type Column,
} from "../ui";
import { useAction, useQuery } from "../hooks";
import { fmtNumber } from "../format";
import { FieldError, Thumb } from "./DestinationsPage";

function changedFields<T extends object>(next: T, prev: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(next) as (keyof T)[]) {
    if (JSON.stringify(next[k]) !== JSON.stringify(prev[k])) out[k] = next[k];
  }
  return out;
}

const nullIfBlank = (s: string) => (s.trim() ? s.trim() : null);
const selectCls = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink";

export default function PlacesPage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("country") ?? "";
  const select = (id: string) => setParams(prev => {
    const next = new URLSearchParams(prev);
    if (id) next.set("country", id); else next.delete("country");
    return next;
  }, { replace: true });

  const countries = useQuery(() => adminApi.countries.list(), []);
  const [filter, setFilter] = useState("");
  const [editingCountry, setEditingCountry] = useState<AdminCountry | "new" | null>(null);

  const f = filter.trim().toLowerCase();
  const rows = (countries.data ?? [])
    .filter(c => !f || c.countryName.toLowerCase().includes(f) || (c.continent ?? "").toLowerCase().includes(f))
    .sort((a, b) => a.countryName.localeCompare(b.countryName));
  const selected = countries.data?.find(c => c.countryId === selectedId) ?? null;

  const columns: Column<AdminCountry>[] = [
    {
      key: "name", header: "Country",
      render: c => (
        <span className={`flex items-center gap-2 whitespace-nowrap ${c.countryId === selectedId ? "font-semibold" : "font-medium"}`}>
          <span className="text-lg leading-none" aria-hidden>{c.countryFlagEmoji || "🏳️"}</span>{c.countryName}
        </span>
      ),
    },
    { key: "continent", header: "Continent", render: c => c.continent || "—" },
    { key: "cities", header: "Cities", className: "text-right", render: c => fmtNumber(c.cityCount) },
    { key: "dest", header: "Destinations", className: "text-right", render: c => fmtNumber(c.destinationCount) },
    { key: "drive", header: "Driving", render: c => c.drivingSide || "—" },
    { key: "plug", header: "Plug", render: c => c.powerPlugType || "—" },
    { key: "tax", header: "Daily tax", className: "text-right", render: c => (c.estimatedDailyTaxRate == null ? "—" : c.estimatedDailyTaxRate) },
    {
      key: "edit", header: "",
      render: c => (
        <Btn size="sm" variant="ghost" aria-label={`Edit ${c.countryName}`} onClick={e => { e.stopPropagation(); setEditingCountry(c); }}>
          <Pencil className="w-3.5 h-3.5" />
        </Btn>
      ),
    },
  ];

  return (
    <AdminPage title="Countries & cities" description="Select a country to manage its cities."
      actions={<Btn variant="primary" onClick={() => setEditingCountry("new")}><Plus className="w-4 h-4" /> New country</Btn>}>
      <div className="grid xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
        <div className="min-w-0">
          <Toolbar><SearchBox value={filter} onChange={setFilter} placeholder="Filter countries" /></Toolbar>
          {countries.error ? <ErrorBlock message={countries.error} onRetry={countries.reload} /> : (
            <DataTable columns={columns} rows={rows} rowKey={c => c.countryId} loading={countries.loading}
              onRowClick={c => select(c.countryId === selectedId ? "" : c.countryId)}
              empty={f ? "No countries match." : "No countries yet."} />
          )}
        </div>
        <div className="min-w-0 xl:sticky xl:top-6">
          {selected ? (
            <CitiesPanel key={selected.countryId} country={selected} onChanged={countries.reload} />
          ) : (
            <Panel title="Cities">
              <p className="text-sm text-ink-muted py-8 text-center">Select a country to see its cities.</p>
            </Panel>
          )}
        </div>
      </div>

      <Drawer open={editingCountry !== null} onClose={() => setEditingCountry(null)}
        title={editingCountry === "new" ? "New country" : "Edit country"}>
        {editingCountry && (
          <CountryEditor key={editingCountry === "new" ? "new" : editingCountry.countryId}
            country={editingCountry === "new" ? null : editingCountry}
            onDone={created => { setEditingCountry(null); countries.reload(); if (created) select(created); }} />
        )}
      </Drawer>
    </AdminPage>
  );
}

// ─── Country editor ───────────────────────────────────────────────────────────

function CountryEditor({ country, onDone }: { country: AdminCountry | null; onDone: (createdId?: string) => void }) {
  const [form, setForm] = useState({
    countryName: country?.countryName ?? "",
    continent: country?.continent ?? "",
    countryFlagEmoji: country?.countryFlagEmoji ?? "",
    globalHeroImage: country?.globalHeroImage ?? "",
    visaRequirementsSummary: country?.visaRequirementsSummary ?? "",
    powerPlugType: country?.powerPlugType ?? "",
    drivingSide: country?.drivingSide ?? "",
    estimatedDailyTaxRate: country?.estimatedDailyTaxRate ?? null as number | null,
  });
  const [error, setError] = useState("");
  const save = useAction();
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const input: CountryInput = {
    countryName: form.countryName.trim(),
    continent: nullIfBlank(form.continent),
    countryFlagEmoji: nullIfBlank(form.countryFlagEmoji),
    globalHeroImage: nullIfBlank(form.globalHeroImage),
    visaRequirementsSummary: nullIfBlank(form.visaRequirementsSummary),
    powerPlugType: nullIfBlank(form.powerPlugType),
    drivingSide: nullIfBlank(form.drivingSide),
    estimatedDailyTaxRate: form.estimatedDailyTaxRate,
  };
  const diff = country
    ? changedFields(input, {
      countryName: country.countryName, continent: country.continent, countryFlagEmoji: country.countryFlagEmoji,
      globalHeroImage: country.globalHeroImage, visaRequirementsSummary: country.visaRequirementsSummary,
      powerPlugType: country.powerPlugType, drivingSide: country.drivingSide, estimatedDailyTaxRate: country.estimatedDailyTaxRate,
    })
    : input;
  const dirty = Object.keys(diff).length > 0;
  const drivingOptions = ["", "Left", "Right", ...(form.drivingSide && !["Left", "Right"].includes(form.drivingSide) ? [form.drivingSide] : [])];

  const submit = async () => {
    if (!input.countryName) { setError("Name is required."); return; }
    setError("");
    const errorsMap = { 409: "A country with this name already exists.", 404: "This country no longer exists." };
    if (country) {
      const r = await save.run(() => adminApi.countries.update(country.countryId, diff), { success: "Country saved", errors: errorsMap });
      if (r.ok) onDone();
    } else {
      const r = await save.run(() => adminApi.countries.create(input), { success: "Country created", errors: errorsMap });
      if (r.ok) onDone(r.result.countryId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[5rem_1fr] gap-3">
        <Field label="Flag">
          <TextInput value={form.countryFlagEmoji} onChange={e => set("countryFlagEmoji", e.target.value)} placeholder="🇮🇹" className="text-center text-lg" />
        </Field>
        <Field label="Name *">
          <TextInput value={form.countryName} onChange={e => set("countryName", e.target.value)} placeholder="e.g. Italy" />
          <FieldError message={error} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Continent"><TextInput value={form.continent} onChange={e => set("continent", e.target.value)} /></Field>
        <Field label="Driving side">
          <select value={form.drivingSide} onChange={e => set("drivingSide", e.target.value)} className={selectCls} aria-label="Driving side">
            {drivingOptions.map(o => <option key={o} value={o}>{o || "—"}</option>)}
          </select>
        </Field>
        <Field label="Power plug type"><TextInput value={form.powerPlugType} onChange={e => set("powerPlugType", e.target.value)} placeholder="e.g. C, F, L" /></Field>
        <Field label="Estimated daily tax rate">
          <NumberInput step="any" value={form.estimatedDailyTaxRate} onChange={v => set("estimatedDailyTaxRate", v)} />
        </Field>
      </div>
      <Field label="Hero image URL">
        <TextInput value={form.globalHeroImage} onChange={e => set("globalHeroImage", e.target.value)} placeholder="https://…" />
      </Field>
      {form.globalHeroImage.trim() && <Thumb src={form.globalHeroImage.trim()} alt="Hero preview" size="w-full h-36" />}
      <Field label="Visa requirements summary">
        <TextArea rows={4} value={form.visaRequirementsSummary} onChange={e => set("visaRequirementsSummary", e.target.value)} />
      </Field>
      <div className="flex justify-end border-t border-line pt-4">
        <Btn variant="primary" loading={save.busy} disabled={!!country && !dirty} onClick={submit}>{country ? "Save changes" : "Create country"}</Btn>
      </div>
    </div>
  );
}

// ─── Cities ───────────────────────────────────────────────────────────────────

function CitiesPanel({ country, onChanged }: { country: AdminCountry; onChanged: () => void }) {
  const cities = useQuery(() => adminApi.cities.list({ countryId: country.countryId }), [country.countryId]);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<AdminCity | "new" | null>(null);
  const f = filter.trim().toLowerCase();
  const rows = (cities.data ?? [])
    .filter(c => !f || c.cityName.toLowerCase().includes(f))
    .sort((a, b) => a.cityName.localeCompare(b.cityName));

  const columns: Column<AdminCity>[] = [
    { key: "name", header: "City", render: c => <span className="font-medium whitespace-nowrap">{c.cityName}</span> },
    {
      key: "coords", header: "Lat / long",
      render: c => <span className="text-xs text-ink-soft whitespace-nowrap">{c.latitude != null && c.longitude != null ? `${c.latitude.toFixed(3)}, ${c.longitude.toFixed(3)}` : "—"}</span>,
    },
    { key: "dest", header: "Destinations", className: "text-right", render: c => fmtNumber(c.destinationCount) },
  ];

  return (
    <Panel padded={false}
      title={`${country.countryFlagEmoji ?? ""} ${country.countryName} · cities`.trim()}
      actions={<Btn size="sm" variant="primary" onClick={() => setEditing("new")}><Plus className="w-3.5 h-3.5" /> New city</Btn>}>
      <div className="p-4 space-y-3">
        <SearchBox value={filter} onChange={setFilter} placeholder="Filter cities" />
        {cities.error ? <ErrorBlock message={cities.error} onRetry={cities.reload} /> : (
          <DataTable columns={columns} rows={rows} rowKey={c => c.cityId} loading={cities.loading}
            onRowClick={c => setEditing(c)} empty={f ? "No cities match." : "No cities yet."} />
        )}
      </div>
      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? `New city in ${country.countryName}` : "Edit city"}>
        {editing && (
          <CityEditor key={editing === "new" ? "new" : editing.cityId} countryId={country.countryId} city={editing === "new" ? null : editing}
            onDone={() => { setEditing(null); cities.reload(); onChanged(); }} />
        )}
      </Drawer>
    </Panel>
  );
}

function CityEditor({ city, countryId, onDone }: { city: AdminCity | null; countryId: string; onDone: () => void }) {
  const [name, setName] = useState(city?.cityName ?? "");
  const [desc, setDesc] = useState(city?.cityDescription ?? "");
  const [lat, setLat] = useState<number | null>(city?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(city?.longitude ?? null);
  const [error, setError] = useState("");
  const save = useAction();

  const input: CityInput = { cityName: name.trim(), countryId, cityDescription: nullIfBlank(desc), latitude: lat, longitude: lng };
  const diff = city
    ? changedFields(input, { cityName: city.cityName, countryId: city.countryId, cityDescription: city.cityDescription, latitude: city.latitude, longitude: city.longitude })
    : input;
  const dirty = Object.keys(diff).length > 0;

  const submit = async () => {
    if (!input.cityName) { setError("Name is required."); return; }
    setError("");
    const errorsMap = { 409: "A city with this name already exists in this country.", 404: "This city no longer exists." };
    const r = city
      ? await save.run(() => adminApi.cities.update(city.cityId, diff), { success: "City saved", errors: errorsMap })
      : await save.run(() => adminApi.cities.create(input), { success: "City created", errors: errorsMap });
    if (r.ok) onDone();
  };

  return (
    <div className="space-y-4">
      <Field label="Name *">
        <TextInput value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Florence" />
        <FieldError message={error} />
      </Field>
      <Field label="Description"><TextArea rows={4} value={desc} onChange={e => setDesc(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Latitude"><NumberInput step="any" value={lat} onChange={setLat} /></Field>
        <Field label="Longitude"><NumberInput step="any" value={lng} onChange={setLng} /></Field>
      </div>
      {city && <p className="text-xs text-ink-muted">Used by {fmtNumber(city.destinationCount)} destinations.</p>}
      <div className="flex justify-end border-t border-line pt-4">
        <Btn variant="primary" loading={save.busy} disabled={!!city && !dirty} onClick={submit}>{city ? "Save changes" : "Create city"}</Btn>
      </div>
    </div>
  );
}
