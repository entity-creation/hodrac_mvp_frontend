import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Users, PlusCircle } from "lucide-react";
import { tripClient } from "../../../../dataStore/v2Api/client";
import { useRequireAuth } from "../../../../hooks/v2Hooks/useRequireAuth";
import { Section } from "../../ui";
import { colourwayFor } from "../../../../utils/v2Utils/format";
import { ROUTES, tripsForPlacePath } from "../../../../utils/v2Utils/routes";
import type { TripPost } from "../../../../types";

function dateLabel(t: TripPost) {
  if (t.isDateFlexible || !t.startDate) return "Flexible dates";
  return new Date(t.startDate).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

// Where a trip card links: the filtered trips list for its first stop/wishlist.
function tripHref(t: TripPost) {
  if (t.wishlistId) return tripsForPlacePath({ wishlistId: t.wishlistId, name: t.destinationLabel });
  if (t.stops[0]) return tripsForPlacePath({ destinationId: t.stops[0].destinationId, name: t.stops[0].name });
  return `${ROUTES.PUBLIC.BROWSETRIPS}?dest=${encodeURIComponent(t.destinationLabel)}`;
}

// "Don't want to go alone?" — a peek at open trips from other travellers.
export default function TripsStrip() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [trips, setTrips] = useState<TripPost[] | null>(null);

  useEffect(() => {
    tripClient.findTrips({ destination: "", from: "", to: "" }, 1, 12)
      .then(r => setTrips(r.items.filter(t => t.status === "Open").slice(0, 8)))
      .catch(() => setTrips([]));
  }, []);

  const postTrip = () => requireAuth(() => navigate(ROUTES.AUTH.CREATETRIPS), ROUTES.AUTH.CREATETRIPS);

  return (
    <Section
      eyebrow="Travel together"
      title="Travel in good company."
      subtitle="Travellers already planning their next journey. Ask to join, or share your own plans and choose your companions."
      action={{ label: "See all open trips", to: ROUTES.PUBLIC.BROWSETRIPS }}
      className="bg-white border-y border-line"
    >
      <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5 md:mx-0 md:px-0 snap-x">
        {trips === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-72 h-88 rounded-2xl bg-cream-deep animate-pulse" />
            ))
          : trips.map(t => {
              const colour = colourwayFor(t.id);
              return (
                <Link
                  key={t.id}
                  to={tripHref(t)}
                  className="shrink-0 w-72 h-88 snap-start bg-white rounded-2xl border border-line shadow-pop pop-hover overflow-hidden flex flex-col"
                >
                  <div className={`h-44 shrink-0 ${colour.bg} relative`}>
                    {t.coverImageUrl
                      ? <img src={t.coverImageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                      : <div className="w-full h-full" />}
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/70 backdrop-blur-md rounded-full px-2.5 py-1 text-xs font-medium text-ink">
                      <CalendarDays className="w-3.5 h-3.5" /> {dateLabel(t)}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col gap-2 flex-1">
                    <p className="font-display text-xl font-light text-ink leading-tight truncate">{t.destinationLabel}</p>
                    <p className="text-sm text-ink-soft line-clamp-2 min-h-[2lh]">{t.caption}</p>
                    <p className="mt-auto inline-flex items-center gap-1.5 text-xs text-ink-muted">
                      <Users className="w-3.5 h-3.5" />
                      {t.maxGroupSize ? `Group of up to ${t.maxGroupSize}` : "Open to companions"}
                    </p>
                  </div>
                </Link>
              );
            })}

        {/* Always offer the "post your own" route */}
        <button
          onClick={postTrip}
          className="shrink-0 w-72 h-88 snap-start rounded-2xl border border-dashed border-ink/20 hover:border-ink flex flex-col items-center justify-center gap-3 p-6 text-center transition-colors"
        >
          <span className="w-12 h-12 rounded-full border border-ink/20 text-ink flex items-center justify-center">
            <PlusCircle className="w-5 h-5" strokeWidth={1.5} />
          </span>
          <span className="font-display text-xl font-light text-ink">
            {trips && trips.length === 0 ? "Be the first to share a trip" : "Share your own trip"}
          </span>
          <span className="text-sm text-ink-soft">Say where and when. Others can ask to join, and you choose who comes.</span>
        </button>
      </div>
    </Section>
  );
}
