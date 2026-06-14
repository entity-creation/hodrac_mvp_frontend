import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { wishlistsApi } from "../../../../dataStore/v2Api/client";
import type { PersonalizationData } from "./PersonalizationModal";
import type { WishlistCard } from "../../../../types";

interface SocialValidationStripProps {
  personalization: PersonalizationData | null;
  userId?: string;
}

function vibeEmoji(tags: string[]): string {
  const map: Record<string, string> = {
    Anime: "⛩️", Food: "🍜", Luxury: "✨", Relaxation: "🧘",
    Nightlife: "🌙", Nature: "🌿", Culture: "🎭", Adventure: "🧗",
    Budget: "💸", Romance: "💑", Hidden: "💎",
  };
  for (const tag of tags) if (map[tag]) return map[tag];
  return "🌏";
}

function getLabel(p: PersonalizationData | null): string {
  if (!p) return "🔥 Travelers like you are exploring:";
  if (p.interests?.includes("Anime"))  return "Travelers like you are exploring: Tokyo Anime Escapes";
  if (p.interests?.includes("Food"))   return "Travelers like you are exploring: Japan Food Tours";
  if (p.budget === "Luxury")           return "Travelers like you are exploring: Premium Japan Experiences";
  if (p.travelGroup === "Partner")     return "Travelers like you are exploring: Romantic Japan Getaways";
  if (p.travelGroup === "Family")      return "Travelers like you are exploring: Family-Friendly Adventures";
  return "Travelers like you are exploring:";
}

export default function SocialValidationStrip({ personalization, userId }: SocialValidationStripProps) {
  const navigate  = useNavigate();
  const [wishlists, setWishlists] = useState<WishlistCard[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    // Use popular?user_id to get persona-ranked results when user is authenticated.
    // Falls back to un-ranked popular list for anonymous visitors.
    wishlistsApi.popular(userId, 12)
      .then(setWishlists)
      .catch(() => setWishlists([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const label = getLabel(personalization);

  // Double the array for the infinite scroll effect
  const items = [...wishlists, ...wishlists];

  return (
    <section className="w-full py-12 bg-gray-950 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Label — personalized when onboarding is complete */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm font-medium text-gray-400 mb-6 tracking-wide"
        >
          {label}
        </motion.p>

        {/* Scrolling strip */}
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-gray-950 to-transparent z-10 pointer-events-none" />

          {loading ? (
            // Skeleton strip while loading
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shrink-0 w-56 h-14 bg-white/5 rounded-full animate-pulse" />
              ))}
            </div>
          ) : wishlists.length === 0 ? null : (
            <motion.div
              className="flex gap-4 w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            >
              {items.map((w, i) => (
                <button
                  key={`${w.wishlistId}-${i}`}
                  onClick={() => navigate(`/wishlists/${w.wishlistId}/${slugify(w.wishlistName)}`)}
                  className="shrink-0 flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <span className="text-lg">{vibeEmoji(w.psychologicalVibeTags)}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white whitespace-nowrap">
                      {w.wishlistName}
                    </p>
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      Popular among {w.peopleType}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}
