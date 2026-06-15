import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FilterOptions, DestinationFilters, WishlistFilters } from "../../../types";

// ─── Filter chip ──────────────────────────────────────────────────────────────

function Chip({
  label, active, color, onClick,
}: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all duration-150 ${
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 text-gray-600 hover:border-gray-400"
      }`}
      style={active && color ? { borderColor: color, backgroundColor: color } : {}}
    >
      {label}
    </button>
  );
}

// ─── Range slider row ─────────────────────────────────────────────────────────

function RangeRow({
  label, min, max, valueMin, valueMax, prefix = "",
  onChangeMin, onChangeMax,
}: {
  label: string; min: number; max: number;
  valueMin: number; valueMax: number; prefix?: string;
  onChangeMin: (v: number) => void; onChangeMax: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          {prefix}{valueMin.toLocaleString()} – {prefix}{valueMax.toLocaleString()}
        </span>
      </div>
      <div className="flex gap-3 items-center">
        <input
          type="range" min={min} max={max} value={valueMin}
          onChange={e => onChangeMin(Number(e.target.value))}
          className="flex-1 accent-gray-900"
        />
        <input
          type="range" min={min} max={max} value={valueMax}
          onChange={e => onChangeMax(Number(e.target.value))}
          className="flex-1 accent-gray-900"
        />
      </div>
    </div>
  );
}

// ─── Destination filter panel ─────────────────────────────────────────────────

interface DestinationFilterPanelProps {
  options: FilterOptions;
  filters: DestinationFilters;
  onChange: (filters: DestinationFilters) => void;
  onReset: () => void;
}

export function DestinationFilterPanel({
  options, filters, onChange, onReset,
}: DestinationFilterPanelProps) {
  const [open, setOpen] = useState(false);

  const selectedTags = filters.tags?.split(",").filter(Boolean) ?? [];
  const selectedCats = filters.categories?.split(",").filter(Boolean) ?? [];

  const toggleTag = (key: string) => {
    const next = selectedTags.includes(key)
      ? selectedTags.filter(t => t !== key)
      : [...selectedTags, key];
    onChange({ ...filters, tags: next.join(","), page: 1 });
  };

  const toggleCat = (key: string) => {
    const next = selectedCats.includes(key)
      ? selectedCats.filter(c => c !== key)
      : [...selectedCats, key];
    onChange({ ...filters, categories: next.join(","), page: 1 });
  };

  const activeCount = [
    selectedTags.length, selectedCats.length,
    filters.countryId, filters.accessibility,
    filters.minLuxury, filters.maxLuxury,
    filters.maxSafetyLevel, filters.minCost, filters.maxCost,
  ].filter(Boolean).length;

  return (
    <div className="w-full">
      {/* Toggle button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-200 text-sm font-medium text-gray-200 hover:border-gray-900 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 bg-gray-900 text-white text-[10px] rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Reset all
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 flex flex-col gap-6">

              {/* Tags */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Travel Style</p>
                <div className="flex flex-wrap gap-2">
                  {options.tags.map(tag => (
                    <Chip
                      key={tag.key}
                      label={tag.tagName}
                      active={selectedTags.includes(tag.key)}
                      onClick={() => toggleTag(tag.key)}
                    />
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
                <div className="flex flex-wrap gap-2">
                  {options.categories.map(cat => (
                    <Chip
                      key={cat.key}
                      label={cat.categoryName}
                      active={selectedCats.includes(cat.key)}
                      color={cat.colorHex}
                      onClick={() => toggleCat(cat.key)}
                    />
                  ))}
                </div>
              </div>

              {/* Country */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Country</p>
                <select
                  value={filters.countryId ?? ""}
                  onChange={e => onChange({ ...filters, countryId: e.target.value || undefined, page: 1 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-900 transition"
                >
                  <option value="">All countries</option>
                  {options.countries.map(c => (
                    <option key={c.countryId} value={c.countryId}>
                      {c.flagEmoji} {c.countryName} ({c.destinationCount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price range */}
              <RangeRow
                label="Cost per day"
                min={options.destinationPriceRange.min}
                max={options.destinationPriceRange.max}
                valueMin={filters.minCost ?? options.destinationPriceRange.min}
                valueMax={filters.maxCost ?? options.destinationPriceRange.max}
                prefix="$"
                onChangeMin={v => onChange({ ...filters, minCost: v, page: 1 })}
                onChangeMax={v => onChange({ ...filters, maxCost: v, page: 1 })}
              />

              {/* Luxury */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Luxury Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => onChange({ ...filters, minLuxury: n, maxLuxury: n === (filters.minLuxury) ? undefined : n, page: 1 })}
                      className={`w-9 h-9 rounded-full text-sm font-bold border-2 transition-all ${
                        filters.minLuxury === n
                          ? "border-amber-400 bg-amber-50 text-amber-600"
                          : "border-gray-200 text-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Max Safety Level (lower = safer)</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => onChange({ ...filters, maxSafetyLevel: filters.maxSafetyLevel === n ? undefined : n, page: 1 })}
                      className={`w-9 h-9 rounded-full text-sm font-bold border-2 transition-all ${
                        filters.maxSafetyLevel === n
                          ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                          : "border-gray-200 text-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Wishlist filter panel ────────────────────────────────────────────────────

interface WishlistFilterPanelProps {
  options: FilterOptions;
  filters: WishlistFilters;
  onChange: (filters: WishlistFilters) => void;
  onReset: () => void;
}

export function WishlistFilterPanel({
  options, filters, onChange, onReset,
}: WishlistFilterPanelProps) {
  const [open, setOpen] = useState(false);

  const selectedPersonas = filters.personaTypes?.split(",").filter(Boolean) ?? [];
  const selectedVibes    = filters.vibeTags?.split(",").filter(Boolean) ?? [];

  const togglePersona = (p: string) => {
    const next = selectedPersonas.includes(p)
      ? selectedPersonas.filter(x => x !== p)
      : [...selectedPersonas, p];
    onChange({ ...filters, personaTypes: next.join(","), page: 1 });
  };

  const toggleVibe = (v: string) => {
    const next = selectedVibes.includes(v)
      ? selectedVibes.filter(x => x !== v)
      : [...selectedVibes, v];
    onChange({ ...filters, vibeTags: next.join(","), page: 1 });
  };

  const activeCount = [
    selectedPersonas.length, selectedVibes.length,
    filters.minPrice, filters.maxPrice, filters.minDays, filters.maxDays,
  ].filter(Boolean).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-200 text-sm font-medium text-gray-200 hover:border-gray-900 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filters {activeCount > 0 && <span className="w-5 h-5 bg-gray-900 text-white text-[10px] rounded-full flex items-center justify-center">{activeCount}</span>}
        </button>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-700">Reset all</button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 flex flex-col gap-6">

              {/* Traveling as */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Traveling as</p>
                <div className="flex flex-wrap gap-2">
                  {options.personaTypes.map(p => (
                    <Chip key={p} label={p} active={selectedPersonas.includes(p)} onClick={() => togglePersona(p)} />
                  ))}
                </div>
              </div>

              {/* Vibe tags */}
              <div>
                <p className="text-xs font-semibold text-gray-200 uppercase tracking-wider mb-3">Trip Vibe</p>
                <div className="flex flex-wrap gap-2">
                  {options.tags.map(tag => (
                    <Chip key={tag.key} label={tag.tagName} active={selectedVibes.includes(tag.tagName)} onClick={() => toggleVibe(tag.tagName)} />
                  ))}
                </div>
              </div>

              {/* Budget range */}
              <RangeRow
                label="Budget per person"
                min={options.wishlistPriceRange.min}
                max={options.wishlistPriceRange.max}
                valueMin={filters.minPrice ?? options.wishlistPriceRange.min}
                valueMax={filters.maxPrice ?? options.wishlistPriceRange.max}
                prefix="$"
                onChangeMin={v => onChange({ ...filters, minPrice: v, page: 1 })}
                onChangeMax={v => onChange({ ...filters, maxPrice: v, page: 1 })}
              />

              {/* Trip length */}
              <RangeRow
                label="Trip length (days)"
                min={options.tripDurations.min}
                max={options.tripDurations.max}
                valueMin={filters.minDays ?? options.tripDurations.min}
                valueMax={filters.maxDays ?? options.tripDurations.max}
                onChangeMin={v => onChange({ ...filters, minDays: v, page: 1 })}
                onChangeMax={v => onChange({ ...filters, maxDays: v, page: 1 })}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
