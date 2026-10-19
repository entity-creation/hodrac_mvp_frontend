import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSavedContent } from "../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { WishlistCardComponent } from "../../../components/v2Components/cards/Cards";
import { DestinationCardComponent } from "../../../components/v2Components/cards/Cards";
import { WishlistCardSkeleton, DestinationCardSkeleton, EmptyState, PageHeader } from "../../../components/v2Components/ui";
import type { DestinationSummary, WishlistCard } from "../../../types";
import { useWishlistSignalR } from "../../../hooks/v2Hooks/useSignalR";

export default function SavedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    data, loading,
    isWishlistSaved, toggleWishlist,
    isDestinationSaved, toggleDestination, reload
  } = useSavedContent(isAuthenticated);

  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState<"wishlists" | "destinations">("wishlists");

  useWishlistSignalR(
    selectedId!,
    {onWishlistUpdated: () => {
      reload();
    }
  });

  const savedWishlists    = data?.savedWishlists ?? [];
  const savedDestinations = data?.savedDestinations ?? [];

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-20">
        <PageHeader
          label="My Library"
          title="Saved trips & destinations"
          subtitle="Everything you've saved, in one place."
        />

        {/* Tabs */}
        <div className="flex gap-1 bg-cream-deep p-1 rounded-2xl w-fit mx-auto mb-10">
          <button
            onClick={() => setTab("wishlists")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === "wishlists" ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            Wishlists ({loading ? "…" : savedWishlists.length})
          </button>
          <button
            onClick={() => setTab("destinations")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === "destinations" ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            Destinations ({loading ? "…" : savedDestinations.length})
          </button>
        </div>

        {/* Wishlists */}
        {tab === "wishlists" && (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <WishlistCardSkeleton key={i} />)}
            </div>
          ) : savedWishlists.length === 0 ? (
            <EmptyState
              emoji="🗺️"
              title="No saved wishlists yet"
              subtitle="Browse our curated wishlists and save the ones that speak to your travel style."
              action={
                <button onClick={() => navigate("/explore/wishlists")} className="px-5 py-2.5 bg-ink text-white text-sm font-semibold rounded-full">
                  Explore wishlists →
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedWishlists.map((w: WishlistCard, i: number) => (
                <WishlistCardComponent
                  key={w.wishlistId}
                  wishlist={w}
                  saved={isWishlistSaved(w.wishlistId)}
                  onToggleSave={() => {
                    setSelectedId(w.wishlistId)
                    toggleWishlist(w.wishlistId)}}
                  index={i}
                />
              ))}
            </div>
          )
        )}

        {/* Destinations */}
        {tab === "destinations" && (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => <DestinationCardSkeleton key={i} />)}
            </div>
          ) : savedDestinations.length === 0 ? (
            <EmptyState
              emoji="📍"
              title="No saved destinations yet"
              subtitle="Discover destinations and save the ones you want to visit."
              action={
                <button onClick={() => navigate("/explore/destinations")} className="px-5 py-2.5 bg-ink text-white text-sm font-semibold rounded-full">
                  Explore destinations →
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {savedDestinations.map((d: DestinationSummary, i: number) => (
                <DestinationCardComponent
                  key={d.destinationId}
                  destination={d}
                  saved={isDestinationSaved(d.destinationId)}
                  onToggleSave={() => toggleDestination(d.destinationId)}
                  index={i}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
