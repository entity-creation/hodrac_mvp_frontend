import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Check, Image as ImageIcon, Map, Users } from "lucide-react";
import { isApiError, shareApi } from "../../../dataStore/v2Api/client";
import { useCurrency } from "../../../hooks/v2Hooks/useCurrency";
import { buttonClasses, EmptyState, FullPageSpinner } from "../../../components/v2Components/ui";
import ShareButton from "../../../components/v2Components/share/ShareButton";
import { colourwayFor } from "../../../utils/v2Utils/format";
import { ROUTES } from "../../../utils/v2Utils/routes";
import type { ItineraryDay, WishlistDetail } from "../../../types";

// /shared/wishlists/:token — read-only view of a user's own wishlist, opened
// from a link its owner shared. No login needed; 404 once the owner revokes it.
export default function SharedWishlistPage() {
  const { token = "" } = useParams<{ token: string }>();
  const { formatPrice } = useCurrency();
  const [wishlist, setWishlist] = useState<WishlistDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    shareApi.sharedWishlist(token)
      .then(w => { if (!cancelled) { setWishlist(w); setState("ready"); } })
      .catch(e => { if (!cancelled) setState(isApiError(e, 404) ? "missing" : "error"); });
    return () => { cancelled = true; };
  }, [token]);

  if (state === "loading") return <FullPageSpinner />;

  if (state !== "ready" || !wishlist) {
    return (
      <EmptyState
        emoji="🔗"
        title={state === "missing" ? "This link is no longer active" : "Couldn't open this wishlist"}
        subtitle={state === "missing"
          ? "The person who shared it may have turned sharing off. Ask them for a new link."
          : "Please try again in a moment."}
        action={<Link to={ROUTES.PUBLIC.EXPLOREWISHLIST} className={buttonClasses("primary", "md")}>Explore trips on Hodrac</Link>}
      />
    );
  }

  const w = wishlist;
  const colour = colourwayFor(w.wishlistId);
  const days = [...(w.itineraryDays ?? [])].sort((a, b) => a.dayNumber - b.dayNumber);
  const inclusions = [
    { label: "Stay", text: w.accommodationInclusions },
    { label: "Getting around", text: w.transitInclusions },
    { label: "Things to do", text: w.activityInclusions },
  ].filter(i => i.text);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 pt-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted">Shared with you · read-only</p>
        <ShareButton type="shared-wishlist" id={token} label="Share this wishlist" />
      </div>

      <div className={`aspect-16/9 md:aspect-21/9 rounded-2xl overflow-hidden ${colour.bg}`}>
        {w.wishlistHeroImage
          ? <img src={w.wishlistHeroImage} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Map className="w-12 h-12 text-ink-muted" strokeWidth={1} /></div>}
      </div>

      <div className="max-w-3xl pt-10">
        <h1 className="text-4xl md:text-5xl font-light text-ink leading-[1.05]">{w.wishlistName}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-sm text-ink-soft">
          {w.totalDays > 0 && <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {w.totalDays} days</span>}
          {w.peopleType && <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> {w.peopleType}</span>}
          {w.basePricePerPerson > 0 && <span>From {formatPrice(w.basePricePerPerson)} per person</span>}
        </div>
        {w.shortStory && <p className="mt-8 font-display text-2xl font-light italic text-ink leading-snug">“{w.shortStory}”</p>}
        {w.wishlistDescription && <p className="mt-5 text-lg text-ink-soft leading-relaxed whitespace-pre-line">{w.wishlistDescription}</p>}
      </div>

      {(inclusions.length > 0 || w.globalInclusions?.length > 0) && (
        <section className="mt-12">
          <h2 className="text-2xl font-light text-ink mb-5">What's included</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inclusions.map(i => (
              <div key={i.label} className="rounded-2xl border border-line bg-white p-5">
                <p className="text-sm font-medium text-ink mb-1">{i.label}</p>
                <p className="text-sm text-ink-soft leading-relaxed">{i.text}</p>
              </div>
            ))}
          </div>
          {w.globalInclusions?.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-4">
              {w.globalInclusions.map(item => (
                <li key={item} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-ink">
                  <Check className="w-3.5 h-3.5 text-ink-muted" /> {item}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {days.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-light text-ink mb-5">Day by day</h2>
          <ol className="flex flex-col gap-4">
            {days.map(day => <DayBlock key={day.dayId ?? day.dayNumber} day={day} formatPrice={formatPrice} />)}
          </ol>
        </section>
      )}

      <section className="mt-16 rounded-2xl bg-ink text-white p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="font-display text-2xl font-light">Planning something similar?</p>
          <p className="text-white/70 mt-1">Find ready-made trips, honest destination guides and people to travel with.</p>
        </div>
        <Link to={ROUTES.PUBLIC.EXPLOREWISHLIST} className={buttonClasses("outline", "lg", "bg-white! text-ink! border-white! shrink-0")}>
          Explore Hodrac
        </Link>
      </section>
    </div>
  );
}

function DayBlock({ day, formatPrice }: { day: ItineraryDay; formatPrice: (usd: number) => string }) {
  const cities = [day.morningCity, day.afternoonCity, day.eveningCity]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(" → ");
  const items = [...(day.items ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  return (
    <li className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-baseline gap-3">
        <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Day {day.dayNumber}</span>
        <h3 className="text-lg font-normal text-ink">{day.dayTitle}</h3>
      </div>
      {cities && <p className="text-sm text-ink-muted mt-1">{cities}</p>}
      {items.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map(item => (
            <li key={item.itemId} className="flex gap-3">
              {item.imageUrl
                ? <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 bg-cream-deep" />
                : <div className="w-16 h-16 rounded-xl bg-cream-deep shrink-0 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-ink-muted" strokeWidth={1.25} /></div>}
              <div className="min-w-0">
                <p className="text-sm text-ink">
                  {item.title}
                  {item.isOptional && <span className="ml-2 text-xs text-ink-muted">Optional</span>}
                </p>
                {item.timeOfDay && <p className="text-xs text-ink-muted">{item.timeOfDay}</p>}
                {item.description && <p className="text-sm text-ink-soft mt-1 leading-relaxed">{item.description}</p>}
                {item.costModifier > 0 && <p className="text-xs text-ink-muted mt-1">+{formatPrice(item.costModifier)}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
