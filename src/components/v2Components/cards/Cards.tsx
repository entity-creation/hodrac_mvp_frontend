import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SaveButton} from "../ui";
import type { WishlistCard, DestinationSummary } from "../../../types";
import { slugify } from "../../../utils/v2Utils/slugify";
import { eventsApi } from "../../../dataStore/v2Api/client";

// ─── Wishlist card ─────────────────────────────────────────────────────────────

const GRADIENT_PALETTE = [
  ["#6366f1", "#8b5cf6"],
  ["#10b981", "#0891b2"],
  ["#f59e0b", "#ef4444"],
  ["#f97316", "#ec4899"],
  ["#7c3aed", "#db2777"],
  ["#ec4899", "#f97316"],
];

function getGradient(id: string) {
  const i = id.charCodeAt(0) % GRADIENT_PALETTE.length;
  return GRADIENT_PALETTE[i];
}

function vibeEmoji(tags: string[]): string {
  const map: Record<string, string> = {
    Anime: "⛩️", Food: "🍜", Luxury: "✨", Relaxation: "🧘",
    Nightlife: "🌙", Nature: "🌿", Culture: "🎭", Adventure: "🧗",
    Budget: "💸", Romance: "💑",
  };
  for (const tag of tags) {
    if (map[tag]) return map[tag];
  }
  return "🌏";
}

interface WishlistCardProps {
  wishlist: WishlistCard;
  saved: boolean;
  onToggleSave: () => void;
  index?: number;
}

export function WishlistCardComponent({ wishlist, saved, onToggleSave, index = 0 }: WishlistCardProps) {
  const navigate = useNavigate();
  const [from, to] = getGradient(wishlist.wishlistId);
  const emoji = vibeEmoji(wishlist.psychologicalVibeTags);

  const handleClick = () => {
    eventsApi.track("wishlist_view", wishlist.wishlistId, wishlist.psychologicalVibeTags, "explore");
    navigate(`/wishlists/${wishlist.wishlistId}/${slugify(wishlist.wishlistName)}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 6) * 0.06, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
      onClick={handleClick}
    >
      {/* Gradient accent */}
      <div className="h-2" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <span className="text-3xl">{emoji}</span>
          <SaveButton saved={saved} onToggle={onToggleSave} size="sm" />
        </div>

        {/* Save count */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            ❤️ {wishlist.totalGlobalSaveCount.toLocaleString()} saves
          </span>
          {wishlist.isFeatured && (
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Featured</span>
          )}
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

        {/* Meta */}
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
          <div className="text-gray-400 group-hover:text-gray-900 transition-colors text-lg">→</div>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Destination card ─────────────────────────────────────────────────────────

interface DestinationCardProps {
  destination: DestinationSummary;
  saved: boolean;
  onToggleSave: () => void;
  index?: number;
}

const SAFETY_LABELS = ["", "Very Safe", "Safe", "Moderate", "Use Caution", "High Risk"];
const SAFETY_COLORS = ["", "#10b981", "#10b981", "#f59e0b", "#ef4444", "#dc2626"];

export function DestinationCardComponent({ destination, saved, onToggleSave, index = 0 }: DestinationCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    eventsApi.track("destination_click", destination.destinationId, destination.tags, "explore");
    navigate(`/destinations/${destination.destinationId}/${slugify(destination.destinationName)}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 6) * 0.06, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {destination.thumbnailUrl ? (
          <img
            src={destination.thumbnailUrl}
            alt={destination.destinationName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-linear-to-br from-gray-100 to-gray-200">
            🗺️
          </div>
        )}
        {/* Save button overlay */}
        <div className="absolute top-2 right-2">
          <SaveButton saved={saved} onToggle={onToggleSave} size="sm" />
        </div>
        {/* Safety badge */}
        {destination.safetyLevel > 0 && (
          <div
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: SAFETY_COLORS[destination.safetyLevel] }}
          >
            {SAFETY_LABELS[destination.safetyLevel]}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm truncate">{destination.destinationName}</h3>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{destination.location}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {destination.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {destination.categories.slice(0, 1).map(cat => (
            <span key={cat} className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {cat}
            </span>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-sm font-black text-gray-900">
              ${destination.averageCostPerDay}/day
            </p>
            <p className="text-[10px] text-gray-400">
              {"⭐".repeat(destination.luxuryRating)} Luxury {destination.luxuryRating}/5
            </p>
          </div>
          <div className="text-gray-400 group-hover:text-gray-900 transition-colors">→</div>
        </div>
      </div>
    </motion.article>
  );
}
