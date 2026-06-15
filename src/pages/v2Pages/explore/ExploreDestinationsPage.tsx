import { useState, useEffect } from "react";
import { destinationsApi } from "../../../dataStore/v2Api/client";
import { useFilterOptions, useSavedContent } from "../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { DestinationCardComponent } from "../../../components/v2Components/cards/Cards";
import { DestinationFilterPanel } from "../../../components/v2Components/filters/FilterPanel";
import { DestinationCardSkeleton, EmptyState, PageHeader, SortBar } from "../../../components/v2Components/ui";
import type { DestinationSummary, DestinationFilters, PagedResult } from "../../../types";
import { motion } from "framer-motion";

const DEFAULT_FILTERS: DestinationFilters = { sort: "popularity", page: 1, pageSize: 12 };

const QUICK_TAGS = [
  { emoji: "💎", label: "Hidden Gems",      key: "hidden_gem" },
  { emoji: "📸", label: "Tourist Spots",    key: "tourist_hotspot" },
  { emoji: "🏘️", label: "Local Favorites", key: "local_favorite" },
  { emoji: "🌿", label: "Nature",           key: "nature" },
  { emoji: "🎨", label: "Art & Culture",    key: "culture" },
  { emoji: "🍜", label: "Food Scene",       key: "food" },
  { emoji: "🌙", label: "Nightlife",        key: "nightlife" },
  { emoji: "🧘", label: "Wellness",         key: "relaxation" },
];

export default function ExploreDestinationsPage() {
  const { isAuthenticated }                              = useAuth();
  const { data: filterOptions, loading: filterLoading }  = useFilterOptions();
  const { isDestinationSaved, toggleDestination }        = useSavedContent(isAuthenticated);
  const [filters,  setFilters]  = useState<DestinationFilters>(DEFAULT_FILTERS);
  const [result,   setResult]   = useState<PagedResult<DestinationSummary> | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    destinationsApi.list(filters)
      .then(r => { if (!cancelled) setResult(r); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const toggleQuickTag = (key: string) => {
    const current = filters.tags?.split(",").filter(Boolean) ?? [];
    const next = current.includes(key)
      ? current.filter(t => t !== key)
      : [...current, key];
    setFilters(f => ({ ...f, tags: next.join(","), page: 1 }));
  };

  const isQuickTagActive = (key: string) =>
    (filters.tags ?? "").split(",").includes(key);

  const handlePage = (p: number) => {
    setFilters(f => ({ ...f, page: p }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-20">
        <PageHeader
          label="Explore Destinations"
          title="Places travelers are adding to their wishlists"
          subtitle="Discover structured destinations with real insights — hidden costs, crowd levels, ideal duration, and more."
        />

        {/* Quick-filter tag strip */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {QUICK_TAGS.map(tag => (
            <motion.button
              key={tag.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleQuickTag(tag.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                isQuickTagActive(tag.key)
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-400 bg-white hover:border-gray-400"
              }`}
            >
              <span>{tag.emoji}</span>
              <span>{tag.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Filters + sort */}
        <div className="flex flex-col gap-4 mb-6">
          {filterOptions && !filterLoading && (
            <DestinationFilterPanel
              options={filterOptions}
              filters={filters}
              onChange={f => setFilters(f)}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
          )}
          {filterOptions && (
            <SortBar
              options={filterOptions.destinationSortOptions}
              value={filters.sort ?? "popularity"}
              onChange={sort => setFilters(f => ({ ...f, sort, page: 1 }))}
            />
          )}
        </div>

        {result && (
          <p className="text-sm text-gray-400 mb-6">
            {result.totalCount.toLocaleString()} destinations found
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <DestinationCardSkeleton key={i} />)}
          </div>
        ) : !result?.items.length ? (
          <EmptyState
            emoji="🔍"
            title="No destinations found"
            subtitle="Try broadening your filters or exploring a different category."
            action={
              <button onClick={() => setFilters(DEFAULT_FILTERS)} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full">
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {result.items.map((d, i) => (
                <DestinationCardComponent
                  key={d.destinationId}
                  destination={d}
                  saved={isDestinationSaved(d.destinationId)}
                  onToggleSave={() => toggleDestination(d.destinationId)}
                  index={i}
                />
              ))}
            </div>

            {result.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => handlePage((filters.page ?? 1) - 1)}
                  disabled={(filters.page ?? 1) <= 1}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-900 disabled:opacity-30 transition-all"
                >← Previous</button>
                <span className="text-sm text-gray-500">
                  Page {filters.page} of {result.totalPages}
                </span>
                <button
                  onClick={() => handlePage((filters.page ?? 1) + 1)}
                  disabled={(filters.page ?? 1) >= result.totalPages}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-900 disabled:opacity-30 transition-all"
                >Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
