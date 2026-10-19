import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Map, PenLine, Loader2, Send } from "lucide-react";
import type {
  DestinationSearchResult,
  WishlistSearchResult,
  TripApiClient,
  CreateTripPayload,
  TripPost,
} from "../../../types";
import { Button, PageHeader } from "../ui";

type Mode = "destination" | "wishlist" | "freetext";
type SearchResult = DestinationSearchResult | WishlistSearchResult;

export type InitialTripSelection =
  | { mode: "destination"; item: DestinationSearchResult }
  | { mode: "wishlist"; item: WishlistSearchResult };

interface CreateTripPostProps {
  api: Pick<TripApiClient, "searchDestinations" | "searchWishlists">;
  onSubmit: (payload: CreateTripPayload) => Promise<TripPost>;
  // Preselects a destination/wishlist, e.g. when arriving from its page.
  initialSelection?: InitialTripSelection | null;
  onCreated?: (trip: TripPost) => void;
}

const MODES: { value: Mode; label: string; description: string; icon: typeof MapPin }[] = [
  { value: "destination", label: "A place", description: "Pick a destination", icon: MapPin },
  { value: "wishlist", label: "An itinerary", description: "Follow a wishlist", icon: Map },
  { value: "freetext", label: "Describe it", description: "Anywhere at all", icon: PenLine },
];

const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export default function CreateTripPost({
  api,
  onSubmit,
  initialSelection,
  onCreated,
}: CreateTripPostProps) {
  const [mode, setMode] = useState<Mode>(initialSelection?.mode ?? "destination");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(initialSelection?.item ?? null);
  const [freeText, setFreeText] = useState("");
  const [searching, setSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDateFlexible, setIsDateFlexible] = useState(false);
  const [caption, setCaption] = useState("");
  const [maxGroupSize, setMaxGroupSize] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A preselection that arrives after mount (resolved async by the page).
  useEffect(() => {
    if (initialSelection) {
      setMode(initialSelection.mode);
      setSelected(initialSelection.item);
    }
  }, [initialSelection]);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setSelected(null);
    setResults([]);
    setQuery("");
    setFreeText("");
  };

  // Debounced search.
  useEffect(() => {
    if (mode === "freetext" || !query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const found =
          mode === "destination"
            ? await api.searchDestinations(query.trim())
            : await api.searchWishlists(query.trim());
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query, mode, api]);

  const hasPlace = mode === "freetext" ? !!freeText.trim() : !!selected;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPlace) {
      setError(mode === "freetext" ? "Tell people where you're going." : "Pick where you're going first.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const trip = await onSubmit({
        destinationId: mode === "destination" ? (selected as DestinationSearchResult | null)?.id ?? null : null,
        wishlistId: mode === "wishlist" ? (selected as WishlistSearchResult | null)?.id ?? null : null,
        freeTextDestination: mode === "freetext" ? freeText.trim() || null : null,
        startDate: isDateFlexible ? null : startDate || null,
        endDate: isDateFlexible ? null : endDate || null,
        isDateFlexible,
        caption: caption.trim(),
        maxGroupSize: maxGroupSize ? Number(maxGroupSize) : null,
      });

      onCreated?.(trip);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post this trip. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 pb-20">
      <PageHeader
        label="Post a trip"
        title="Find people to go with"
        subtitle="Say where you're headed and when. Other travellers can ask to join, and you choose who comes."
      />

      <form onSubmit={handleSubmit} className="bg-white border border-line rounded-2xl shadow-pop-lg overflow-hidden">
        {/* Step 1: where */}
        <div className="p-5 md:p-7 border-b border-line">
          <StepLabel n={1} text="What are you planning?" />

          <div className="grid grid-cols-3 gap-2 mb-5" role="tablist" aria-label="Trip destination type">
            {MODES.map((item) => {
              const active = mode === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchMode(item.value)}
                  className={`flex flex-col items-center justify-center text-center rounded-2xl px-2 py-3.5 border transition-all ${
                    active
                      ? "border-ink bg-ink text-white shadow-pop-sm"
                      : "border-line bg-cream text-ink hover:border-ink"
                  }`}
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className={`text-[11px] mt-0.5 hidden sm:block ${active ? "text-white/70" : "text-ink-muted"}`}>
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {mode === "freetext" ? (
              <motion.div key="freetext" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-2">
                <input
                  id="trip-freetext"
                  type="text"
                  aria-label="Where are you going?"
                  placeholder="e.g. Japan, Southeast Asia, or the Amalfi Coast"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-ink-muted px-1">
                  Not in our catalog yet? No problem, just describe it.
                </p>
              </motion.div>
            ) : (
              <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-2">
                {selected ? (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-sun-100 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center">
                        {mode === "destination" ? <MapPin className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                      </span>
                      <span className="text-sm font-medium text-ink truncate">{selectedLabel(mode, selected)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="shrink-0 text-xs font-medium text-ink-soft hover:text-ink underline underline-offset-4"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        id="trip-search"
                        type="text"
                        aria-label={mode === "destination" ? "Search destinations" : "Search wishlists"}
                        placeholder={mode === "destination" ? "Search destinations…" : "Search your wishlists…"}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={inputClass}
                      />
                      {searching && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-brand-500" />
                      )}
                    </div>

                    {results.length > 0 && (
                      <ul className="rounded-2xl border border-line overflow-hidden bg-white max-h-64 overflow-y-auto">
                        {results.map((result) => (
                          <li key={result.id}>
                            <button
                              type="button"
                              onClick={() => setSelected(result)}
                              className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-cream border-b border-line last:border-b-0 transition-colors"
                            >
                              <span className="shrink-0 w-9 h-9 rounded-full bg-cream flex items-center justify-center">
                                {mode === "destination" ? <MapPin className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                              </span>
                              <span className="text-sm font-semibold text-ink truncate">{selectedLabel(mode, result)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {query.trim() && !searching && results.length === 0 && (
                      <p className="text-xs text-ink-muted px-1">No matches. Try another search, or switch to "Describe it".</p>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 2: when */}
        <div className="p-5 md:p-7 border-b border-line">
          <div className="flex items-center justify-between gap-4 mb-4">
            <StepLabel n={2} text="When are you going?" className="mb-0" />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDateFlexible}
                onChange={(e) => setIsDateFlexible(e.target.checked)}
                className="w-4 h-4 accent-brand-500"
              />
              <span className="text-sm font-medium text-ink">I'm flexible</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>
              <span className="block text-xs font-medium text-ink-soft mb-1.5 px-1">Start date</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isDateFlexible} className={inputClass} />
            </label>
            <label>
              <span className="block text-xs font-medium text-ink-soft mb-1.5 px-1">End date</span>
              <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} disabled={isDateFlexible} className={inputClass} />
            </label>
          </div>
        </div>

        {/* Step 3: who */}
        <div className="p-5 md:p-7 space-y-5">
          <StepLabel n={3} text="Who are you hoping to meet?" />

          <label className="block">
            <span className="block text-xs font-medium text-ink-soft mb-1.5 px-1">About the trip</span>
            <textarea
              rows={4}
              placeholder="Two weeks between Tokyo and Kyoto. Big on food markets and onsens, happy to split an Airbnb…"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </label>

          <label className="block max-w-xs">
            <span className="block text-xs font-medium text-ink-soft mb-1.5 px-1">Max group size</span>
            <input
              type="number"
              min="1"
              placeholder="No limit"
              value={maxGroupSize}
              onChange={(e) => setMaxGroupSize(e.target.value)}
              className={inputClass}
            />
          </label>

          <AnimatePresence>
            {error && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-2 flex justify-end">
            <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
              {!submitting && <Send className="w-4 h-4" />}
              {submitting ? "Posting…" : "Post my trip"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function StepLabel({ n, text, className = "mb-4" }: { n: number; text: string; className?: string }) {
  return (
    <p className={`flex items-center gap-3 font-display text-lg font-semibold text-ink ${className}`}>
      <span className="w-7 h-7 rounded-full bg-brand-500 border border-line text-white text-sm flex items-center justify-center">
        {n}
      </span>
      {text}
    </p>
  );
}

function selectedLabel(mode: Mode, item: SearchResult): string {
  if (mode === "destination") {
    const destination = item as DestinationSearchResult;
    return destination.country ? `${destination.name}, ${destination.country}` : destination.name;
  }

  const wishlist = item as WishlistSearchResult;
  return wishlist.stopNames?.length
    ? `${wishlist.name} (${wishlist.stopNames.join(" → ")})`
    : wishlist.name;
}
