import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { searchApi, eventsApi } from "../../../dataStore/v2Api/client";
import { useSavedContent } from "../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { WishlistCardComponent } from "../../../components/v2Components/cards/Cards";
import { DestinationCardComponent } from "../../../components/v2Components/cards/Cards";
import { WishlistCardSkeleton, DestinationCardSkeleton, EmptyState } from "../../../components/v2Components/ui";
import type { SearchResponse } from "../../../types";

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isWishlistSaved, toggleWishlist, isDestinationSaved, toggleDestination } = useSavedContent(isAuthenticated);

  const q = searchParams.get("q") ?? "";
  const [input,    setInput]    = useState(q);
  const [results,  setResults]  = useState<SearchResponse | null>(null);
  const [loading,  setLoading]  = useState(!!q);
  const [popular,  setPopular]  = useState<{ phrase: string; count: number }[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "wishlists" | "destinations">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load popular searches on mount
  useEffect(() => {
    searchApi.popular(8).then(setPopular).catch(() => {});
  }, []);

  // Run search when q changes
  useEffect(() => {
    if (!q.trim()) { setResults(null); setLoading(false); return; }
    setLoading(true);
    searchApi.search(q, user?.userId)
      .then(r => {
        setResults(r);
        eventsApi.track("search", r.clusterId || q, [], "search_page");
      })
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [q, user?.userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSearchParams({ q: input.trim() });
  };

  const handlePopularClick = (phrase: string) => {
    setInput(phrase);
    setSearchParams({ q: phrase });
  };

  const wishlists    = results?.wishlists ?? [];
  const destinations = results?.destinations ?? [];
  const hasResults   = wishlists.length > 0 || destinations.length > 0;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-5 md:px-8 pb-20">

        {/* Search bar */}
        <div className="pt-10 pb-8">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center bg-white border border-line rounded-2xl shadow-sm hover:border-ink/30 focus-within:border-ink transition-all duration-200 overflow-hidden">
              <svg className="ml-5 text-ink-muted shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Search destinations, wishlists, or travel styles..."
                className="flex-1 px-4 py-4 text-ink bg-transparent outline-none placeholder:text-ink-muted"
                autoFocus
              />
              {input && (
                <button
                  type="button"
                  onClick={() => { setInput(""); setSearchParams({}); setResults(null); }}
                  className="mr-3 w-6 h-6 rounded-full bg-ink/10 text-ink-soft flex items-center justify-center text-xs hover:bg-ink/10 transition-colors"
                >✕</button>
              )}
              <button
                type="submit"
                className="m-2 px-5 py-2.5 bg-ink text-white text-sm font-semibold rounded-xl hover:bg-ink-soft transition-colors shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular searches (shown when no query) */}
          <AnimatePresence>
            {!q && popular.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6"
              >
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {popular.map(p => (
                    <button
                      key={p.phrase}
                      onClick={() => handlePopularClick(p.phrase)}
                      className="px-4 py-2 bg-white border border-line rounded-full text-sm text-ink hover:border-ink hover:text-ink transition-all"
                    >
                      🔍 {p.phrase}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results header */}
        {q && !loading && (
          <div className="mb-6">
            <p className="text-sm text-ink-soft">
              {hasResults
                ? `Showing results for "${results?.canonicalPhrase ?? q}"`
                : `No results for "${q}"`}
            </p>
          </div>
        )}

        {/* Tabs (only when results exist) */}
        {hasResults && !loading && (
          <div className="flex gap-1 bg-cream-deep p-1 rounded-2xl w-fit mb-8">
            {[
              { key: "all",          label: `All (${wishlists.length + destinations.length})` },
              { key: "wishlists",    label: `Wishlists (${wishlists.length})` },
              { key: "destinations", label: `Destinations (${destinations.length})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-white text-ink-muted shadow-sm"
                    : "text-ink hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-10">
            <div>
              <p className="text-sm font-semibold text-ink mb-4">Wishlists</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => <WishlistCardSkeleton key={i} />)}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink mb-4">Destinations</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => <DestinationCardSkeleton key={i} />)}
              </div>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && q && !hasResults && (
          <EmptyState
            emoji="🔍"
            title="No results found"
            subtitle={`We couldn't find anything for "${q}". Try a different search term or explore our content.`}
            action={
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => navigate("/explore/wishlists")} className="px-5 py-2.5 bg-ink text-white text-sm font-semibold rounded-full">
                  Browse wishlists
                </button>
                <button onClick={() => navigate("/explore/destinations")} className="px-5 py-2.5 border border-line text-ink-muted text-sm font-semibold rounded-full">
                  Browse destinations
                </button>
              </div>
            }
          />
        )}

        {/* Results */}
        {!loading && hasResults && (
          <div className="flex flex-col gap-12">
            {/* A tab with nothing in it (e.g. no wishlists for this search) */}
            {activeTab === "wishlists" && wishlists.length === 0 && (
              <TabEmpty
                title={`No wishlists for “${q}” yet`}
                subtitle="There are destinations that match, though."
                actionLabel={`See ${destinations.length} destination${destinations.length === 1 ? "" : "s"}`}
                onAction={() => setActiveTab("destinations")}
              />
            )}
            {activeTab === "destinations" && destinations.length === 0 && (
              <TabEmpty
                title={`No destinations for “${q}”`}
                subtitle="There are wishlists that match, though."
                actionLabel={`See ${wishlists.length} wishlist${wishlists.length === 1 ? "" : "s"}`}
                onAction={() => setActiveTab("wishlists")}
              />
            )}
            {activeTab === "all" && wishlists.length === 0 && (
              <p className="text-sm text-ink-muted">
                No wishlists match “{q}” yet. Here are the destinations that do.
              </p>
            )}
            {/* Wishlists */}
            {(activeTab === "all" || activeTab === "wishlists") && wishlists.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <p
                    className="font-display text-xl font-normal text-ink"
                  >
                    Wishlists
                  </p>
                  {activeTab === "all" && (
                    <button onClick={() => setActiveTab("wishlists")} className="text-sm text-ink hover:text-ink">
                      See all →
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishlists.map((w, i) => (
                    <WishlistCardComponent
                      key={w.wishlistId}
                      wishlist={w}
                      saved={isWishlistSaved(w.wishlistId)}
                      onToggleSave={() => toggleWishlist(w.wishlistId)}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Destinations */}
            {(activeTab === "all" || activeTab === "destinations") && destinations.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <p
                    className="font-display text-xl font-normal text-ink"
                  >
                    Destinations
                  </p>
                  {activeTab === "all" && (
                    <button onClick={() => setActiveTab("destinations")} className="text-sm text-ink-muted hover:text-ink">
                      See all →
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {destinations.map((d, i) => (
                    <DestinationCardComponent
                      key={d.destinationId}
                      destination={d}
                      saved={isDestinationSaved(d.destinationId)}
                      onToggleSave={() => toggleDestination(d.destinationId)}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabEmpty({
  title, subtitle, actionLabel, onAction,
}: { title: string; subtitle: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="text-center py-16">
      <h3 className="text-2xl font-light text-ink mb-2">{title}</h3>
      <p className="text-ink-muted text-sm mb-6">{subtitle}</p>
      <button onClick={onAction} className="text-sm text-ink underline underline-offset-4 hover:text-ink-soft">
        {actionLabel}
      </button>
    </div>
  );
}
