import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { wishlistsApi } from "../../../../dataStore/v2Api/client";
import { useAuth } from "../../../../hooks/v2Hooks/useAuth";
import { useSavedContent } from "../../../../hooks/v2Hooks/useData";
import { usePersonalization } from "../../../../hooks/v2Hooks/usePersonalization";
import { WishlistCardComponent } from "../../cards/Cards";
import { Chip, WishlistCardSkeleton, buttonClasses } from "../../ui";
import { ROUTES } from "../../../../utils/v2Utils/routes";
import type { WishlistCard } from "../../../../types";

const VIBES = [
  { tag: "Food", emoji: "🍜" },
  { tag: "Nature", emoji: "🌿" },
  { tag: "Culture", emoji: "🎭" },
  { tag: "Relaxation", emoji: "🧘" },
  { tag: "Adventure", emoji: "🧗" },
  { tag: "Nightlife", emoji: "🌙" },
  { tag: "Luxury", emoji: "✨" },
  { tag: "Budget", emoji: "💸" },
  { tag: "Romance", emoji: "💑" },
  { tag: "Anime", emoji: "⛩️" },
];

// Featured wishlists topped up from popular, so the grid is never sparse.
async function loadFeatured(): Promise<WishlistCard[]> {
  const featured = await wishlistsApi.featured().catch(() => [] as WishlistCard[]);
  if (featured.length >= 6) return featured.slice(0, 6);
  const popular = await wishlistsApi.popular(undefined, 6).catch(() => [] as WishlistCard[]);
  const seen = new Set(featured.map(w => w.wishlistId));
  return [...featured, ...popular.filter(w => !seen.has(w.wishlistId))].slice(0, 6);
}

// "Can they help me?" — tap a vibe, the trips underneath change instantly.
// Selections are shared with the quiz (usePersonalization).
export default function FeaturedWishlistsSection() {
  const { isAuthenticated } = useAuth();
  const { isWishlistSaved, toggleWishlist } = useSavedContent(isAuthenticated);
  const { vibeTags, setVibeTags, openQuiz } = usePersonalization();

  const [wishlists, setWishlists] = useState<WishlistCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [noMatches, setNoMatches] = useState(false);

  const tagKey = vibeTags.join(",");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNoMatches(false);

    const load = async () => {
      if (!tagKey) return loadFeatured();
      const matched = await wishlistsApi
        .list({ vibeTags: tagKey, sort: "saves", page: 1, pageSize: 6 })
        .then(r => r.items)
        .catch(() => [] as WishlistCard[]);
      if (matched.length) return matched;
      if (!cancelled) setNoMatches(true);
      return loadFeatured();
    };

    load()
      .then(r => { if (!cancelled) setWishlists(r); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tagKey]);

  const toggleVibe = (tag: string) => {
    setVibeTags(vibeTags.includes(tag) ? vibeTags.filter(t => t !== tag) : [...vibeTags, tag]);
  };

  const exploreUrl = tagKey
    ? `${ROUTES.PUBLIC.EXPLOREWISHLIST}?vibeTags=${encodeURIComponent(tagKey)}`
    : ROUTES.PUBLIC.EXPLOREWISHLIST;

  return (
    <section id="for-you" className="py-20 md:py-28 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted mb-4">Curated for you</p>
          <h2 className="text-3xl md:text-5xl font-light text-ink leading-[1.08]">
            What kind of journey are you after?
          </h2>
          <p className="text-ink-soft mt-4 text-base md:text-lg">
            Choose a few interests and we'll suggest trips to match.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4 md:flex-wrap md:justify-center md:overflow-visible">
          {VIBES.map(v => (
            <Chip key={v.tag} active={vibeTags.includes(v.tag)} onClick={() => toggleVibe(v.tag)}>
              {v.tag}
            </Chip>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mb-10 min-h-6">
          {vibeTags.length > 0 ? (
            <button onClick={() => setVibeTags([])} className="text-sm font-medium text-ink-soft hover:text-ink underline underline-offset-4">
              Clear
            </button>
          ) : (
            <button onClick={openQuiz} className="text-sm text-ink-soft hover:text-ink underline underline-offset-4">
              Or answer four quick questions
            </button>
          )}
        </div>

        <AnimatePresence>
          {noMatches && !loading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-ink-muted mb-8 max-w-xl mx-auto"
            >
              Nothing for that exact combination yet — here are some of our favourites instead.
            </motion.p>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <WishlistCardSkeleton key={i} />)}
          </div>
        ) : wishlists.length === 0 ? (
          <p className="text-center text-ink-muted py-16">No trips to show right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((w, i) => (
              <WishlistCardComponent
                key={w.wishlistId}
                wishlist={w}
                saved={isWishlistSaved(w.wishlistId)}
                onToggleSave={() => toggleWishlist(w.wishlistId)}
                index={i}
                source="landing_for_you"
              />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to={exploreUrl} className={buttonClasses("outline", "lg")}>
            {tagKey ? "View all matches" : "View all trips"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
