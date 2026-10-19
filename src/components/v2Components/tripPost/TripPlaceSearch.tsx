import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Map, Search, X } from "lucide-react";
import { searchApi } from "../../../dataStore/v2Api/client";

export type PlaceSelection = { kind: "destination" | "wishlist"; id: string; name: string };

type Option =
  | { type: "destination"; id: string; name: string; detail: string }
  | { type: "wishlist"; id: string; name: string; detail: string }
  | { type: "text"; text: string };

interface TripPlaceSearchProps {
  selected: PlaceSelection | null;
  text: string;
  onSelect: (selection: PlaceSelection) => void;
  onText: (text: string) => void;
  onClear: () => void;
}

const MAX_PER_GROUP = 5;

// Type-ahead for Browse Trips: finds destinations and wishlists via the
// global search (/api/search, public), or searches trips by free text.
export default function TripPlaceSearch({ selected, text, onSelect, onText, onClear }: TripPlaceSearchProps) {
  const [query, setQuery] = useState(text);
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep the input in sync when the applied text changes (e.g. "Clear all").
  useEffect(() => { setQuery(text); }, [text]);

  // Debounced search.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q || selected) {
      setOptions([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchApi.search(q);
        setOptions([
          ...(res.destinations ?? []).slice(0, MAX_PER_GROUP).map(d => ({
            type: "destination" as const, id: d.destinationId, name: d.destinationName, detail: d.location,
          })),
          ...(res.wishlists ?? []).slice(0, MAX_PER_GROUP).map(w => ({
            type: "wishlist" as const, id: w.wishlistId, name: w.wishlistName, detail: `${w.totalDays} days`,
          })),
          { type: "text" as const, text: q },
        ]);
      } catch {
        setOptions([{ type: "text", text: q }]);
      } finally {
        setSearching(false);
        setActive(0);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query, selected]);

  // Close on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const choose = (opt: Option) => {
    setOpen(false);
    if (opt.type === "text") {
      onText(opt.text);
    } else {
      setQuery("");
      onSelect({ kind: opt.type, id: opt.id, name: opt.name });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive(i => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(i => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      // Enter always works: picks the highlighted option when the list is
      // open, otherwise searches trips for the typed text.
      e.preventDefault();
      if (open && options[active]) choose(options[active]);
      else onText(query.trim());
      setOpen(false);
    }
  };

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink/30 bg-white px-4 py-3">
        <span className="flex items-center gap-2 min-w-0 text-sm text-ink">
          {selected.kind === "destination"
            ? <MapPin className="w-4 h-4 shrink-0 text-ink-muted" />
            : <Map className="w-4 h-4 shrink-0 text-ink-muted" />}
          <span className="truncate">{selected.name}</span>
          <span className="text-xs text-ink-muted shrink-0">
            {selected.kind === "destination" ? "Destination" : "Wishlist"}
          </span>
        </span>
        <button type="button" onClick={onClear} aria-label="Clear" className="text-ink-muted hover:text-ink shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const destinations = options.filter(o => o.type === "destination");
  const wishlists = options.filter(o => o.type === "wishlist");
  const indexOf = (o: Option) => options.indexOf(o);

  const row = (o: Option, icon: React.ReactNode, label: React.ReactNode, detail?: string) => {
    const i = indexOf(o);
    return (
      <li key={o.type === "text" ? "text" : `${o.type}-${o.id}`} role="option" aria-selected={i === active}>
        <button
          type="button"
          onMouseEnter={() => setActive(i)}
          onClick={() => choose(o)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === active ? "bg-cream-deep" : ""}`}
        >
          <span className="w-8 h-8 rounded-full bg-cream-deep flex items-center justify-center shrink-0 text-ink-muted">{icon}</span>
          <span className="min-w-0">
            <span className="block text-sm text-ink truncate">{label}</span>
            {detail && <span className="block text-xs text-ink-muted truncate">{detail}</span>}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Destination, wishlist or anything"
          className="w-full rounded-2xl border border-line bg-white pl-10 pr-10 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
        />
        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-ink-muted" />}
        {!searching && query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { setQuery(""); if (text) onClear(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && options.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 w-full max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border border-line rounded-2xl shadow-pop-lg py-2"
        >
          {destinations.length > 0 && (
            <>
              <li className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-[0.2em] text-ink-muted" role="presentation">Destinations</li>
              {destinations.map(o => o.type === "destination" && row(o, <MapPin className="w-4 h-4" />, o.name, o.detail))}
            </>
          )}
          {wishlists.length > 0 && (
            <>
              <li className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.2em] text-ink-muted" role="presentation">Wishlists</li>
              {wishlists.map(o => o.type === "wishlist" && row(o, <Map className="w-4 h-4" />, o.name, o.detail))}
            </>
          )}
          {(destinations.length > 0 || wishlists.length > 0) && (
            <li role="presentation" className="border-t border-line my-2" />
          )}
          {options.map(o => o.type === "text" && row(o, <Search className="w-4 h-4" />, <>Search trips for “{o.text}”</>))}
        </ul>
      )}
    </div>
  );
}
