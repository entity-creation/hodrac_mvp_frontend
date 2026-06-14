import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { destinationsApi, eventsApi } from "../../../../dataStore/v2Api/client";
import { useSavedContent } from "../../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../../hooks/v2Hooks/useAuth";
import { DestinationCardSkeleton } from "../../../../components/v2Components/ui";
import type { DestinationSummary } from "../../../../types";
import { ROUTES } from "../../../../utils/v2Utils/routes";

const SAFETY_LABELS = ["", "Very Safe", "Safe", "Moderate", "Use Caution", "High Risk"];
const SAFETY_COLORS = ["", "#10b981", "#10b981", "#f59e0b", "#ef4444", "#dc2626"];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export default function DestinationsSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDestinationSaved, toggleDestination } = useSavedContent(isAuthenticated);

  const [destinations, setDestinations] = useState<DestinationSummary[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    // Fetch top 6 destinations ordered by popularity
    destinationsApi.list({ sort: "popularity", pageSize: 6, page: 1 })
      .then(r => setDestinations(r.items))
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && destinations.length === 0) return null;

  return (
    <section className="w-full py-20 px-5 md:px-8 bg-white" id="destinations">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Popular Destinations
            </p>
            <h2
              className="text-3xl md:text-4xl font-black text-gray-900 leading-tight"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Places travelers are adding<br className="hidden md:block" /> to their wishlists
            </h2>
          </div>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
            Every destination links directly to structured wishlists and itineraries built around it.
          </p>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <DestinationCardSkeleton key={i} />)}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {destinations.map((dest) => (
              <motion.div
                key={dest.destinationId}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } } }}
                whileHover={{ y: -4 }}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => {
                  eventsApi.track("destination_click", dest.destinationId, dest.tags, "landing_destinations");
                  navigate(`${ROUTES.PUBLIC.DESTINATIONBASEROUTE}/${dest.destinationId}/${slugify(dest.destinationName)}`);
                }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  {dest.thumbnailUrl ? (
                    <img
                      src={dest.thumbnailUrl}
                      alt={dest.destinationName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-100 to-gray-200">🗺️</div>
                  )}

                  {/* Save button */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleDestination(dest.destinationId); }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isDestinationSaved(dest.destinationId)
                        ? "bg-red-100 text-red-500"
                        : "bg-white/80 text-gray-400 hover:bg-red-50 hover:text-red-400 backdrop-blur-sm"
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={isDestinationSaved(dest.destinationId) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>

                  {/* Safety badge */}
                  {dest.safetyLevel > 0 && (
                    <div
                      className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: SAFETY_COLORS[dest.safetyLevel] }}
                    >
                      {SAFETY_LABELS[dest.safetyLevel]}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{dest.destinationName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{dest.location}</p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dest.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                    {dest.categories.slice(0, 1).map(cat => (
                      <span key={cat} className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{cat}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-sm font-black text-gray-900">${dest.averageCostPerDay}/day</p>
                      <p className="text-[10px] text-gray-400">{"⭐".repeat(dest.luxuryRating)} Luxury {dest.luxuryRating}/5</p>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-900 transition-colors">→</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Explore CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <button
            onClick={() => navigate(ROUTES.PUBLIC.EXPLOREDESTINATION)}
            className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-gray-900 text-gray-900 text-sm font-bold rounded-full hover:bg-gray-900 hover:text-white transition-all duration-200"
          >
            Explore all destinations →
          </button>
        </motion.div>
      </div>
    </section>
  );
}
