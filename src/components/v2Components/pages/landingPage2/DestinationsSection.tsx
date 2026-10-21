import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import { destinationsApi, eventsApi } from "../../../../dataStore/v2Api/client";
import { useSavedContent } from "../../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../../hooks/v2Hooks/useAuth";
import { SaveButton, Section, buttonClasses } from "../../ui";
import { SponsoredTag } from "../../partner/Partner";
import type { DestinationSummary } from "../../../../types";
import { ROUTES } from "../../../../utils/v2Utils/routes";
import { slugify } from "../../../../utils/v2Utils/slugify";
import { useCurrency } from "../../../../hooks/v2Hooks/useCurrency";

// The headline "Popular right now" block: one large feature plus four tiles,
// image-led with frosted-glass labels.
export default function DestinationsSection() {
  const { isAuthenticated } = useAuth();
  const { isDestinationSaved, toggleDestination } = useSavedContent(isAuthenticated);

  const [destinations, setDestinations] = useState<DestinationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin-featured destinations lead (in their curated order); popular ones
  // fill the remaining tiles.
  useEffect(() => {
    const TILES = 5;
    Promise.all([
      destinationsApi.featured(TILES).catch(() => [] as DestinationSummary[]),
      destinationsApi.list({ sort: "popularity", pageSize: TILES, page: 1 }).then(r => r.items).catch(() => [] as DestinationSummary[]),
    ])
      .then(([featured, popular]) => {
        const seen = new Set(featured.map(d => d.destinationId));
        setDestinations([...featured, ...popular.filter(d => !seen.has(d.destinationId))].slice(0, TILES));
      })
      .finally(() => setLoading(false));
  }, []);

  const anyFeatured = destinations.some(d => d.isFeatured);

  if (!loading && destinations.length === 0) return null;

  return (
    <Section
      id="popular"
      eyebrow={anyFeatured ? "Featured & popular" : "Popular right now"}
      title="The destinations everyone is talking about"
      subtitle="Each comes with an honest guide (daily costs, safety, insider tips) and the trips that go there."
      action={{ label: "All destinations", to: ROUTES.PUBLIC.EXPLOREDESTINATION }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4 md:gap-5 lg:h-160">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl bg-cream-deep animate-pulse ${i === 0 ? "aspect-4/5 sm:col-span-2 lg:aspect-auto lg:row-span-2" : "aspect-4/3 lg:aspect-auto"}`}
              />
            ))
          : destinations.slice(0, 5).map((d, i) => (
              <PopularTile
                key={d.destinationId}
                destination={d}
                rank={i + 1}
                large={i === 0}
                saved={isDestinationSaved(d.destinationId)}
                onToggleSave={() => toggleDestination(d.destinationId)}
              />
            ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link to={ROUTES.PUBLIC.EXPLOREDESTINATION} className={buttonClasses("outline", "lg")}>
          Explore every destination
        </Link>
      </div>
    </Section>
  );
}

function PopularTile({
  destination: d, rank, large, saved, onToggleSave,
}: {
  destination: DestinationSummary;
  rank: number;
  large: boolean;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const { formatPrice } = useCurrency();
  const href = `/destinations/${d.destinationId}/${slugify(d.destinationName)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: rank * 0.06, duration: 0.6 }}
      className={`relative group rounded-2xl overflow-hidden bg-cream-deep ${
        large ? "aspect-4/5 sm:col-span-2 lg:aspect-auto lg:row-span-2" : "aspect-4/3 lg:aspect-auto"
      }`}
    >
      <Link
        to={href}
        onClick={() => eventsApi.track("destination_click", d.destinationId, d.tags, "landing_popular", rank)}
        className="absolute inset-0"
        aria-label={d.destinationName}
      >
        {d.thumbnailUrl ? (
          <img
            src={d.thumbnailUrl}
            alt=""
            loading={large ? "eager" : "lazy"}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-1000"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-ink-muted" strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-ink/30 via-transparent to-transparent" />
      </Link>

      {/* Rank + save */}
      <div className="absolute top-4 inset-x-4 flex items-start justify-between pointer-events-none">
        <span className="glass rounded-full px-3 py-1 text-xs text-ink pointer-events-auto">
          {d.isFeatured ? "Featured" : `No. ${rank}`}
        </span>
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <SaveButton saved={saved} onToggle={onToggleSave} size="sm" />
          {d.partner && <SponsoredTag partner={d.partner} />}
        </div>
      </div>

      {/* Glass label */}
      <Link
        to={href}
        className={`glass absolute bottom-4 inset-x-4 rounded-xl flex items-center justify-between gap-3 ${large ? "p-5 md:p-6" : "p-4"}`}
      >
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-ink-muted truncate">{d.location}</span>
          <span className={`block font-display font-light text-ink truncate ${large ? "text-3xl md:text-4xl mt-1" : "text-xl"}`}>
            {d.destinationName}
          </span>
          {large && (
            <span className="block text-sm text-ink-soft mt-1">
              From {formatPrice(d.averageCostPerDay)} a day · {d.tags.slice(0, 2).join(" · ")}
            </span>
          )}
        </span>
        <span className={`rounded-full bg-ink text-white flex items-center justify-center shrink-0 ${large ? "w-11 h-11" : "w-9 h-9"}`}>
          <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
        </span>
      </Link>
    </motion.div>
  );
}
