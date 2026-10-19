import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Map } from "lucide-react";
import { SaveButton } from "../ui";
import { SponsoredTag } from "../partner/Partner";
import type { WishlistCard, DestinationSummary } from "../../../types";
import { slugify } from "../../../utils/v2Utils/slugify";
import { colourwayFor } from "../../../utils/v2Utils/format";
import { eventsApi } from "../../../dataStore/v2Api/client";
import { useCurrency } from "../../../hooks/v2Hooks/useCurrency";

// Both cards use fixed-height slots (image ratio, clamped title, reserved
// description lines, pinned footer) so a grid of them always lines up.

// ─── Wishlist card ─────────────────────────────────────────────────────────────

interface WishlistCardProps {
  wishlist: WishlistCard;
  saved: boolean;
  onToggleSave: () => void;
  index?: number;
  // Analytics label for where the card was shown.
  source?: string;
}

export function WishlistCardComponent({ wishlist, saved, onToggleSave, index = 0, source = "explore" }: WishlistCardProps) {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const colour = colourwayFor(wishlist.wishlistId);
  const href = `/wishlists/${wishlist.wishlistId}/${slugify(wishlist.wishlistName)}`;
  const meta = [`${wishlist.totalDays} days`, wishlist.peopleType].filter(Boolean).join(" · ");

  const handleClick = () => {
    eventsApi.track("wishlist_view", wishlist.wishlistId, wishlist.psychologicalVibeTags, source);
    navigate(href);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 6) * 0.05, duration: 0.5 }}
      className="group h-full bg-white rounded-2xl border border-line shadow-pop pop-hover overflow-hidden flex flex-col cursor-pointer"
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) handleClick(); }}
      tabIndex={0}
      role="link"
      aria-label={wishlist.wishlistName}
    >
      <div className={`relative aspect-4/3 shrink-0 overflow-hidden ${colour.bg}`}>
        {wishlist.wishlistHeroImage ? (
          <img
            src={wishlist.wishlistHeroImage}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Map className="w-8 h-8 text-ink-muted" strokeWidth={1.25} />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <SaveButton saved={saved} onToggle={onToggleSave} size="sm" />
        </div>
        <div className="absolute top-3 left-3">
          {wishlist.partner ? (
            <SponsoredTag partner={wishlist.partner} />
          ) : wishlist.isFeatured ? (
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] bg-white/70 backdrop-blur-md text-ink rounded-full px-2.5 py-1">
              Featured
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted truncate h-4">
          {meta}
        </p>

        <h3 className="mt-2 font-display text-xl font-normal text-ink leading-snug line-clamp-2 min-h-[2lh]">
          {wishlist.wishlistName}
        </h3>

        <p className="mt-2 text-sm text-ink-soft line-clamp-2 min-h-[2lh]">
          {wishlist.shortStory || wishlist.psychologicalVibeTags.slice(0, 3).join(" · ")}
        </p>

        <div className="flex items-end justify-between mt-auto pt-4 border-t border-line">
          <p className="text-sm text-ink-muted">
            From <span className="font-display text-lg text-ink">{formatPrice(wishlist.basePricePerPerson)}</span>
            <span className="text-xs"> / person</span>
          </p>
          <span className="text-xs text-ink-muted">♡ {wishlist.totalGlobalSaveCount.toLocaleString()}</span>
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
  source?: string;
}

const SAFETY_LABELS = ["", "Very safe", "Safe", "Moderate", "Use caution", "High risk"];

export function DestinationCardComponent({ destination, saved, onToggleSave, index = 0, source = "explore" }: DestinationCardProps) {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const colour = colourwayFor(destination.destinationId);

  const handleClick = () => {
    eventsApi.track("destination_click", destination.destinationId, destination.tags, source);
    navigate(`/destinations/${destination.destinationId}/${slugify(destination.destinationName)}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 6) * 0.05, duration: 0.5 }}
      className="group h-full bg-white rounded-2xl border border-line shadow-pop pop-hover overflow-hidden cursor-pointer flex flex-col"
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) handleClick(); }}
      tabIndex={0}
      role="link"
      aria-label={destination.destinationName}
    >
      <div className={`relative aspect-4/3 shrink-0 overflow-hidden ${colour.bg}`}>
        {destination.thumbnailUrl ? (
          <img
            src={destination.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-ink-muted" strokeWidth={1.25} />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <SaveButton saved={saved} onToggle={onToggleSave} size="sm" />
        </div>
        {destination.partner && (
          <div className="absolute top-3 left-3">
            <SponsoredTag partner={destination.partner} />
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted truncate h-4">
          {destination.location}
        </p>
        <h3 className="mt-2 font-display text-xl font-normal text-ink leading-snug truncate">
          {destination.destinationName}
        </h3>
        <p className="mt-2 text-sm text-ink-soft truncate h-5">
          {[...destination.tags.slice(0, 2), ...destination.categories.slice(0, 1)].join(" · ")}
        </p>

        <div className="flex items-end justify-between mt-auto pt-4 border-t border-line">
          <p className="text-sm text-ink-muted">
            <span className="font-display text-lg text-ink">{formatPrice(destination.averageCostPerDay)}</span>
            <span className="text-xs"> / day</span>
          </p>
          {destination.safetyLevel > 0 && (
            <span className="text-xs text-ink-muted">{SAFETY_LABELS[destination.safetyLevel]}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
