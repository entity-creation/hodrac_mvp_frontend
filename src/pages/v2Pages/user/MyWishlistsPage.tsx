import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { userWishlistsApi } from "../../../dataStore/v2Api/client";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { WishlistCardComponent } from "../../../components/v2Components/cards/Cards";
import { WishlistCardSkeleton, EmptyState, PageHeader } from "../../../components/v2Components/ui";
import { useSavedContent } from "../../../hooks/v2Hooks/useData";
import type { WishlistCard } from "../../../types";

export default function MyWishlistsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isWishlistSaved, toggleWishlist } = useSavedContent(isAuthenticated);

  const [tab,     setTab]    = useState<"mine" | "shared">("mine");
  const [mine,    setMine]   = useState<WishlistCard[]>([]);
  const [shared,  setShared] = useState<WishlistCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    Promise.all([
      userWishlistsApi.list(),
      userWishlistsApi.shared(),
    ])
      .then(([m, s]) => { setMine(m); setShared(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          emoji="🔐"
          title="Sign in to see your wishlists"
          action={
            <button onClick={() => navigate("/auth/login")} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full">
              Sign In
            </button>
          }
        />
      </div>
    );
  }

  const displayed = tab === "mine" ? mine : shared;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-20">
        <PageHeader
          label="My Trips"
          title="Your wishlist collection"
          subtitle="Wishlists you've customised, plus trips shared with you."
        />

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mx-auto mb-10">
          <button
            onClick={() => setTab("mine")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === "mine" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            My Wishlists ({loading ? "…" : mine.length})
          </button>
          <button
            onClick={() => setTab("shared")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === "shared" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Shared with Me ({loading ? "…" : shared.length})
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <WishlistCardSkeleton key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            emoji={tab === "mine" ? "✏️" : "👥"}
            title={tab === "mine" ? "No wishlists yet" : "No shared wishlists"}
            subtitle={
              tab === "mine"
                ? "Fork a platform wishlist to start customising your own trip."
                : "When someone shares a wishlist with you, it will appear here."
            }
            action={
              tab === "mine" ? (
                <button
                  onClick={() => navigate("/explore/wishlists")}
                  className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full"
                >
                  Browse wishlists →
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map((w, i) => (
              <motion.div key={w.wishlistId} className="relative group">
                <WishlistCardComponent
                  wishlist={w}
                  saved={isWishlistSaved(w.wishlistId)}
                  onToggleSave={() => toggleWishlist(w.wishlistId)}
                  index={i}
                />
                {/* Edit overlay */}
                <div className="absolute bottom-5 left-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/my-wishlists/${w.wishlistId}/edit`); }}
                    className="flex-1 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/my-wishlists/${w.wishlistId}/collaborate`); }}
                    className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:border-gray-900 transition-colors"
                  >
                    👥 Collaborate
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
