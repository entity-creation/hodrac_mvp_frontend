import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { searchApi, wishlistsApi } from "../../../../dataStore/v2Api/client";
import type { PersonalizationData } from "./PersonalizationModal";
import type { WishlistCard } from "../../../../types";

interface HeroSectionProps {
  personalization: PersonalizationData | null;
  onPersonalizeClick: () => void;
}

const PLACEHOLDERS = [
  "Search destinations, wishlists, or travel styles...",
  "Try: 5-day Tokyo anime trip...",
  "Try: Couples food trip in Osaka...",
  "Try: Budget Japan adventure...",
];

// Gradient palette for the live preview cards — indexed by wishlist ID
const GRADIENTS = [
  "from-purple-500 to-indigo-600",
  "from-rose-500 to-orange-500",
  "from-emerald-500 to-teal-600",
];

function vibeEmoji(tags: string[]): string {
  const map: Record<string, string> = {
    Anime: "⛩️", Food: "🍜", Luxury: "✨", Relaxation: "🧘",
    Nightlife: "🌙", Nature: "🌿", Culture: "🎭", Adventure: "🧗",
    Budget: "💸", Romance: "💑",
  };
  for (const tag of tags) if (map[tag]) return map[tag];
  return "🌏";
}

export default function HeroSection({ personalization, onPersonalizeClick }: HeroSectionProps) {
  const navigate = useNavigate();
  const [query,            setQuery]            = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Live data: popular search tags from the API
  const [popularTags, setPopularTags] = useState<{ phrase: string; count: number }[]>([]);

  // Live data: featured wishlists for the hero preview cards
  const [heroWishlists, setHeroWishlists] = useState<WishlistCard[]>([]);
  const [heroLoading,   setHeroLoading]   = useState(true);

  // Rotate placeholder text
  useEffect(() => {
    const id = setInterval(() => setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(id);
  }, []);

  // Fetch popular search tags from the API
  useEffect(() => {
    searchApi.popular(6).then(setPopularTags).catch(() => {});
  }, []);

  // Fetch the top 3 featured wishlists for the hero preview cards.
  // Falls back to popular wishlists if featured returns fewer than 3.
  useEffect(() => {
    async function load() {
      setHeroLoading(true);
      try {
        let wishlists = await wishlistsApi.featured();
        if (wishlists.length < 3) {
          const popular = await wishlistsApi.popular(undefined, 3);
          // Merge, deduplicate, take first 3
          const seen = new Set(wishlists.map(w => w.wishlistId));
          for (const w of popular) {
            if (!seen.has(w.wishlistId)) wishlists.push(w);
            if (wishlists.length >= 3) break;
          }
        }
        setHeroWishlists(wishlists.slice(0, 3));
      } catch {
        setHeroWishlists([]);
      } finally {
        setHeroLoading(false);
      }
    }
    load();
  }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleTagClick = (phrase: string) => {
    navigate(`/search?q=${encodeURIComponent(phrase)}`);
  };

  const handleCardClick = (w: WishlistCard) => {
    navigate(`/wishlists/${w.wishlistId}/${slugify(w.wishlistName)}`);
  };

  // const headline = personalization?.interests?.length
  //   ? `Discover ${personalization.interests[0]} trips built around you.`
  //   : "Discover trips built around how YOU travel.";

  const renderHeadline = () => {
  if (personalization?.interests?.length) {
    return (
      <>
       <h1
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-gray-900 mb-6"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Discover {" "}
            <span
              className="relative inline-block"
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {personalization.interests[0]}
            </span>{" "} 
            trips built<br />
            around{" "}
            <span
              className="relative inline-block"
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              YOU
            </span>
          </h1>
      </>
    );
  }

  return (
    <>
      <h1
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-gray-900 mb-6"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Discover trips built<br />
            around how{" "}
            <span
              className="relative inline-block"
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              YOU
            </span>{" "}
            travel.
          </h1>
    </>
  );
};

  return (
    <section className="relative w-full pt-32 pb-20 px-5 md:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-stone-50 -z-10" />
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="max-w-4xl mx-auto">
        {/* Personalization nudge / confirmation pill */}
        {!personalization ? (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={onPersonalizeClick}
            className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Personalize your experience →
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700"
          >
            ✓ Personalized for {personalization.travelGroup || "you"} · {personalization.budget || "any budget"}
          </motion.div>
        )}

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          
            {renderHeadline()}
          
          <p className="text-base md:text-lg text-gray-500 max-w-xl leading-relaxed mb-10">
            Explore structured travel wishlists personalized to your interests, budget,
            and travel style — from anime trips in Tokyo to luxury escapes and hidden
            local experiences.
          </p>
        </motion.div>

        {/* ── Search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative mb-6"
        >
          <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl shadow-lg hover:border-gray-400 focus-within:border-gray-900 transition-all duration-200 overflow-hidden">
            <svg className="ml-5 text-gray-400 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              className="flex-1 px-4 py-4 text-sm md:text-base text-gray-800 bg-transparent outline-none placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              className="m-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 active:scale-95 transition-all duration-150 shrink-0"
            >
              Search
            </button>
          </div>
        </motion.div>

        {/* ── Popular search tags (live from API, falls back gracefully) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-2"
        >
          {popularTags.length > 0 ? (
            popularTags.map(t => (
              <button
                key={t.phrase}
                onClick={() => handleTagClick(t.phrase)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-300 hover:border-gray-900 hover:text-gray-900 hover:shadow-sm transition-all duration-150"
              >
                🔍 {t.phrase}
              </button>
            ))
          ) : (
            // Static fallback while API loads or if it fails
            [
              { emoji: "⛩️", label: "Japan for Anime Fans" },
              { emoji: "🌙", label: "Tokyo Nightlife" },
              { emoji: "💑", label: "Couple Trips" },
              { emoji: "🧘", label: "Relaxing Japan" },
              { emoji: "🍜", label: "Food Tours" },
              { emoji: "💸", label: "Budget Tokyo" },
            ].map(tag => (
              <button
                key={tag.label}
                onClick={() => handleTagClick(tag.label)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-300 hover:border-gray-900 hover:text-gray-900 hover:shadow-sm transition-all duration-150"
              >
                <span>{tag.emoji}</span>
                <span>{tag.label}</span>
              </button>
            ))
          )}
        </motion.div>
      </div>

      {/* ── Hero preview cards (live featured wishlists) ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="max-w-4xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {heroLoading ? (
          // Skeleton cards while loading
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse">
              <div className="h-3 bg-gray-200 rounded-t-2xl" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : heroWishlists.length > 0 ? (
          heroWishlists.map((w, i) => (
            <div
              key={w.wishlistId}
              onClick={() => handleCardClick(w)}
              className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className={`h-3 bg-linear-to-r ${GRADIENTS[i % GRADIENTS.length]}`} />
              <div className="p-4">
                <div className="text-2xl mb-2">{vibeEmoji(w.psychologicalVibeTags)}</div>
                <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
                  {w.wishlistName}
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  {[w.peopleType, ...w.psychologicalVibeTags].slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {w.totalDays} days · ❤️ {w.totalGlobalSaveCount.toLocaleString()} saves
                </p>
                <p className="text-sm font-bold text-gray-900">
                  ${w.basePricePerPerson.toLocaleString()}/person
                </p>
              </div>
            </div>
          ))
        ) : null}
      </motion.div>
    </section>
  );
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}
