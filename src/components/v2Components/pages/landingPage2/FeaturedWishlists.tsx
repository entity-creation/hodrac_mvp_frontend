import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { wishlistsApi, eventsApi } from "../../../../dataStore/v2Api/client";
import { useSavedContent } from "../../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../../hooks/v2Hooks/useAuth";
import { WishlistCardSkeleton } from "../../../../components/v2Components/ui";
import type { WishlistCard } from "../../../../types";
import type { PersonalizationData } from "./PersonalizationModal";
import { ROUTES } from "../../../../utils/v2Utils/routes";
import { useWishlistSignalR } from "../../../../hooks/v2Hooks/useSignalR";

interface FeaturedWishlistsProps {
  personalization: PersonalizationData | null;
  userId?: string;
}

const GRADIENT_PALETTE = [
  ["#6366f1", "#8b5cf6"],
  ["#10b981", "#0891b2"],
  ["#f59e0b", "#ef4444"],
  ["#f97316", "#ec4899"],
  ["#7c3aed", "#db2777"],
  ["#ec4899", "#f97316"],
];

function getGradient(id: string) {
  return GRADIENT_PALETTE[id.charCodeAt(0) % GRADIENT_PALETTE.length];
}

function vibeEmoji(tags: string[]): string {
  const map: Record<string, string> = {
    Anime: "⛩️", Food: "🍜", Luxury: "✨", Relaxation: "🧘",
    Nightlife: "🌙", Nature: "🌿", Culture: "🎭", Adventure: "🧗",
    Budget: "💸", Romance: "💑",
  };
  for (const tag of tags) if (map[tag]) return map[tag];
  return "🌏";
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

function WishlistFeatureCard({
  wishlist, saved, onToggleSave, index,
}: { wishlist: WishlistCard; saved: boolean; onToggleSave: () => void; index: number }) {
  const navigate = useNavigate();
  const [from, to] = getGradient(wishlist.wishlistId);
  const emoji = vibeEmoji(wishlist.psychologicalVibeTags);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.5 }}
      className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
      onClick={() => {
        eventsApi.track("wishlist_view", wishlist.wishlistId, wishlist.psychologicalVibeTags, "landing_featured");
        navigate(`${ROUTES.PUBLIC.WISHLISTBASEROUTE}/${wishlist.wishlistId}/${slugify(wishlist.wishlistName)}`);
      }}
    >
      <div className="h-2" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <span className="text-3xl">{emoji}</span>
          <button
            onClick={e => { e.stopPropagation(); onToggleSave(); }}
            className={`p-0! w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              saved ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          {wishlist.isFeatured && (
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Featured</span>
          )}
          <span className="text-xs text-gray-400">❤️ {wishlist.totalGlobalSaveCount.toLocaleString()} saves</span>
        </div>

        {/* Title */}
        <h3
          className="font-black text-gray-900 text-base leading-snug"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          {wishlist.wishlistName}
        </h3>

        {/* Short story */}
        {wishlist.shortStory && (
          <p className="text-xs italic text-gray-400 line-clamp-2 border-l-2 border-gray-200 pl-2">
            "{wishlist.shortStory}"
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {[wishlist.peopleType, ...wishlist.psychologicalVibeTags].slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Price + days */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div>
            <p
              className="text-base font-black"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              ${wishlist.basePricePerPerson.toLocaleString()}/person
            </p>
            <p className="text-[10px] text-gray-400">{wishlist.totalDays} days · {wishlist.peopleType}</p>
          </div>
          <div className="text-gray-400 group-hover:text-gray-900 transition-colors">→</div>
        </div>
      </div>
    </motion.article>
  );
}

export default function FeaturedWishlistsSection({ personalization, userId }: FeaturedWishlistsProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isWishlistSaved, toggleWishlist } = useSavedContent(isAuthenticated);

  const [wishlists, setWishlists] = useState<WishlistCard[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  useWishlistSignalR(
      selectedId!,
      {onWishlistUpdated: () => {
        setRefreshKey(k => k + 1);
      }
    });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // When personalization is available, use matching-user for persona-ranked results.
        // Otherwise use featured (paid + editorial + random rotation).
        let results: WishlistCard[];
        if (userId && personalization) {
          results = await wishlistsApi.matchingUser(userId, 6);
          // Pad with featured if matching-user returns fewer than 6
          if (results.length < 6) {
            const featured = await wishlistsApi.featured();
            const seen = new Set(results.map(w => w.wishlistId));
            for (const w of featured) {
              if (!seen.has(w.wishlistId)) results.push(w);
              if (results.length >= 6) break;
            }
          }
        } else {
          results = await wishlistsApi.featured();
          if (results.length < 6) {
            const popular = await wishlistsApi.popular(undefined, 6);
            const seen = new Set(results.map(w => w.wishlistId));
            for (const w of popular) {
              if (!seen.has(w.wishlistId)) results.push(w);
              if (results.length >= 6) break;
            }
          }
        }
        setWishlists(results.slice(0, 6));
      } catch {
        setWishlists([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, personalization, refreshKey]);

  return (
    <section className="w-full py-20 px-5 md:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
            {personalization ? "Picked for you" : "Featured Wishlists"}
          </p>
          <h2
            className="text-3xl md:text-5xl font-black text-gray-900 mb-4"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Trips designed around real<br className="hidden md:block" /> traveler experiences
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            {personalization
              ? `Curated for ${personalization.travelGroup ?? "you"} · ${personalization.budget ?? "any budget"}`
              : "Explore structured wishlists created for different travel styles, personalities, and goals."}
          </p>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <WishlistCardSkeleton key={i} />)}
          </div>
        ) : wishlists.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No wishlists available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((w, i) => (
              <WishlistFeatureCard
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
        )}

        {/* Explore CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button
            onClick={() => navigate(ROUTES.PUBLIC.EXPLOREWISHLIST)}
            className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-gray-900 text-gray-200 text-sm font-bold rounded-full hover:bg-gray-900 hover:text-white transition-all duration-200"
          >
            Explore all wishlists →
          </button>
        </motion.div>
      </div>
    </section>
  );
}
