import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { wishlistsApi } from "../../../dataStore/v2Api/client";
import { useFilterOptions, useSavedContent } from "../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { WishlistCardComponent } from "../../../components/v2Components/cards/Cards";
import { WishlistFilterPanel } from "../../../components/v2Components/filters/FilterPanel";
import { WishlistCardSkeleton, EmptyState, PageHeader, SortBar } from "../../../components/v2Components/ui";
import type { WishlistCard, WishlistFilters, PagedResult } from "../../../types";
import {useWishlistSignalR } from "../../../hooks/v2Hooks/useSignalR";

const DEFAULT_FILTERS: WishlistFilters = { sort: "saves", page: 1, pageSize: 12 };

export default function ExploreWishlistsPage() {
  const {isAuthenticated }                            = useAuth();
  const { data: filterOptions, loading: filterLoading }      = useFilterOptions();
  const { isWishlistSaved, toggleWishlist}                  = useSavedContent(isAuthenticated);
  const [filters, setFilters]   = useState<WishlistFilters>(DEFAULT_FILTERS);
  const [result,  setResult]    = useState<PagedResult<WishlistCard> | null>(null);
  const [loading, setLoading]   = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

useWishlistSignalR(
    selectedId!,
    {onWishlistUpdated: () => {
      setRefreshKey(k => k + 1);
    }
  });
  
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    wishlistsApi.list(filters)
      .then(r => { if (!cancelled) setResult(r); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters, refreshKey]);

  const handleFilterChange = (f: WishlistFilters) => setFilters(f);

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  const handlePage = (p: number) => {
    setFilters(f => ({ ...f, page: p }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Psychographic tags ────────────────────────────────────────────────────
  // Featured tags derived from the landing page personalization flow.
  const PERSONA_TAGS = [
    { emoji: "⛩️", label: "Anime Escapes",    vibeTag: "Anime" },
    { emoji: "🍜", label: "Food Tours",        vibeTag: "Food" },
    { emoji: "✨", label: "Luxury Getaways",   vibeTag: "Luxury" },
    { emoji: "🧘", label: "Wellness Retreats", vibeTag: "Relaxation" },
    { emoji: "🌙", label: "Nightlife",         vibeTag: "Nightlife" },
    { emoji: "💸", label: "Budget Trips",      vibeTag: "Budget" },
    { emoji: "💑", label: "Couple Trips",      personaType: "Young Couple" },
    { emoji: "👨‍👩‍👧", label: "Family Travel", personaType: "Family" },
  ];

  const handlePersonaTag = (tag: typeof PERSONA_TAGS[0]) => {
    if (tag.vibeTag) {
      const current = filters.vibeTags?.split(",").filter(Boolean) ?? [];
      const next = current.includes(tag.vibeTag)
        ? current.filter(t => t !== tag.vibeTag).join(",")
        : [...current, tag.vibeTag].join(",");
      setFilters(f => ({ ...f, vibeTags: next, page: 1 }));
    } else if (tag.personaType) {
      const current = filters.personaTypes?.split(",").filter(Boolean) ?? [];
      const next = current.includes(tag.personaType)
        ? current.filter(t => t !== tag.personaType).join(",")
        : [...current, tag.personaType].join(",");
      setFilters(f => ({ ...f, personaTypes: next, page: 1 }));
    }
  };

  const isPersonaTagActive = (tag: typeof PERSONA_TAGS[0]) => {
    if (tag.vibeTag) return (filters.vibeTags ?? "").split(",").includes(tag.vibeTag);
    if (tag.personaType) return (filters.personaTypes ?? "").split(",").includes(tag.personaType);
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-20">
        <PageHeader
          label="Explore Wishlists"
          title="Trips designed around real traveler experiences"
          subtitle="Explore structured wishlists curated for different travel styles, personalities, and budgets."
        />

        {/* Psychographic quick-filter tags */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {PERSONA_TAGS.map(tag => (
            <motion.button
              key={tag.label}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePersonaTag(tag)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                isPersonaTagActive(tag)
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-400 bg-white hover:border-gray-400"
              }`}
            >
              <span>{tag.emoji}</span>
              <span>{tag.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Filters + Sort row */}
        <div className="flex flex-col gap-4 mb-6">
          {filterOptions && !filterLoading && (
            <WishlistFilterPanel
              options={filterOptions}
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          )}
          {filterOptions && (
            <SortBar
              options={filterOptions.wishlistSortOptions}
              value={filters.sort ?? "saves"}
              onChange={sort => setFilters(f => ({ ...f, sort, page: 1 }))}
            />
          )}
        </div>

        {/* Results count */}
        {result && (
          <p className="text-sm text-gray-400 mb-6">
            {result.totalCount.toLocaleString()} wishlists found
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <WishlistCardSkeleton key={i} />)}
          </div>
        ) : !result?.items.length ? (
          <EmptyState
            emoji="🗺️"
            title="No wishlists found"
            subtitle="Try adjusting your filters or explore a different travel style."
            action={
              <button onClick={handleReset} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full">
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.items.map((w, i) => (
                <WishlistCardComponent
                  key={w.wishlistId}
                  wishlist={w}
                  saved={isWishlistSaved(w.wishlistId)}
                  onToggleSave={() => {
                    setSelectedId(w.wishlistId)
                    toggleWishlist(w.wishlistId)
                  }}
                  index={i}
                />
              ))}
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => handlePage((filters.page ?? 1) - 1)}
                  disabled={(filters.page ?? 1) <= 1}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-900 disabled:opacity-30 transition-all"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {filters.page} of {result.totalPages}
                </span>
                <button
                  onClick={() => handlePage((filters.page ?? 1) + 1)}
                  disabled={(filters.page ?? 1) >= result.totalPages}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-900 disabled:opacity-30 transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
