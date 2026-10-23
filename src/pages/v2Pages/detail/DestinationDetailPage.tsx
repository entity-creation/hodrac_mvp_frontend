import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, UsersRound, PlusCircle } from "lucide-react";
import { useDestinationDetail, useSavedContent } from "../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { useRequireAuth } from "../../../hooks/v2Hooks/useRequireAuth";
import {
  Button, SaveButton, ScoreBar, SectionTitle, InfoRow, Badge,
  Skeleton, EmptyState, WishlistCardSkeleton,
} from "../../../components/v2Components/ui";
import { WishlistCardComponent } from "../../../components/v2Components/cards/Cards";
import { PartnerBadge, PartnerBookingButton } from "../../../components/v2Components/partner/Partner";
import TripsForPlace from "../../../components/v2Components/tripPost/TripsForPlace";
import { wishlistsApi } from "../../../dataStore/v2Api/client";
import { createTripForPlacePath } from "../../../utils/v2Utils/routes";
import type { WishlistCard } from "../../../types";
import { useCurrency } from "../../../hooks/v2Hooks/useCurrency";
import ShareButton from "../../../components/v2Components/share/ShareButton";

const SAFETY = [
  { label: "", color: "var(--color-ink-muted)" },
  { label: "Very safe", color: "var(--color-mint-500)" },
  { label: "Safe", color: "var(--color-mint-500)" },
  { label: "Moderate", color: "var(--color-sun-500)" },
  { label: "Use caution", color: "var(--color-brand-500)" },
  { label: "High risk", color: "#dc2626" },
];

// ─── Image gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images, name }: { images: Array<{ imageUrl: string; caption: string; imageType: string }>; name: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-16/10 rounded-2xl border border-line bg-sky-100 flex items-center justify-center text-7xl">
        🗺️
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-16/10 rounded-2xl overflow-hidden border border-line shadow-pop-lg bg-white">
        <img src={current.imageUrl} alt={current.caption || name} className="w-full h-full object-cover" />
        {current.caption && (
          <div className="absolute bottom-3 left-3 right-3">
            <p className="inline-block bg-white/70 backdrop-blur-md border border-line rounded-full px-3 py-1 text-xs font-semibold text-ink">
              {current.caption}
            </p>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`shrink-0 w-16 h-16 rounded-2xl overflow-hidden border transition-all ${
                i === active ? "border-ink shadow-pop-sm" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Description block ────────────────────────────────────────────────────────

function DescriptionSection({ label, text }: { label: string; text?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > 220;
  return (
    <div className="bg-white rounded-3xl border border-line p-5">
      <p className="font-display font-normal text-ink mb-2">
        {label}
      </p>
      <p className={`text-sm text-ink-soft leading-relaxed ${!expanded && isLong ? "line-clamp-3" : ""}`}>{text}</p>
      {isLong && (
        <button onClick={() => setExpanded(e => !e)} className="text-xs font-medium text-brand-600 hover:text-brand-700 mt-2">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function ChipList({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="bg-white rounded-3xl border border-line p-5">
      <p className="font-display font-normal text-ink mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(i => (
          <span key={i} className="text-xs font-semibold bg-cream border border-line text-ink px-3 py-1 rounded-full">{i}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DestinationDetailPage() {
  const { formatPrice, formatUsd, isConverted, currency } = useCurrency();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();
  const { data: dest, loading, error } = useDestinationDetail(id!);
  const { isDestinationSaved, toggleDestination, isWishlistSaved, toggleWishlist } = useSavedContent(isAuthenticated);

  const [relatedWishlists, setRelatedWishlists] = useState<WishlistCard[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "insights" | "practical">("overview");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setRelatedLoading(true);
    wishlistsApi.destinationInWishlist(id, 4)
      .then(r => { if (!cancelled) setRelatedWishlists(r); })
      .catch(() => { if (!cancelled) setRelatedWishlists([]); })
      .finally(() => { if (!cancelled) setRelatedLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <DestinationDetailSkeleton />;
  if (error || !dest) return (
    <EmptyState
      emoji="😕"
      title="Destination not found"
      action={<Button onClick={() => navigate(-1)}>Go back</Button>}
    />
  );

  const safety = SAFETY[dest.safetyLevel] ?? SAFETY[0];
  const description = dest.description ?? ({} as typeof dest.description);
  const partner = dest.partner ?? null;
  const partnerCtx = { entityType: "destination" as const, entityId: dest.destinationId, entityTags: dest.tags };
  const createPath = createTripForPlacePath({ destinationId: dest.destinationId });
  const planTrip = () => requireAuth(() => navigate(createPath), createPath);
  const scrollToTrips = () => document.getElementById("trips")?.scrollIntoView({ behavior: "smooth" });

  const TABS = [
    { key: "overview", label: "The vibe" },
    { key: "insights", label: "Insider tips" },
    { key: "practical", label: "Practical stuff" },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pb-24 lg:pb-20">
      <div className="pt-6 pb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center text-ink hover:bg-cream-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <ShareButton type="destination" id={dest.destinationId} label="Share this destination" />
          <SaveButton saved={isDestinationSaved(dest.destinationId)} onToggle={() => toggleDestination(dest.destinationId)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Left: content ── */}
        <div className="lg:col-span-2 flex flex-col gap-10 min-w-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[11px] font-medium text-ink-muted uppercase tracking-[0.25em] mb-4">{dest.countryName || dest.location}</p>
            <h1 className="text-5xl md:text-7xl font-light text-ink leading-[0.98] mb-4">{dest.destinationName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {partner && <PartnerBadge partner={partner} />}
              {dest.isFeatured && <Badge tone="neutral">Featured</Badge>}
              {safety.label && (
                <span className="text-xs font-medium px-3 py-1 rounded-full border border-line text-white" style={{ backgroundColor: safety.color }}>
                  {safety.label}
                </span>
              )}
              {dest.timeZone && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft"><Clock className="w-3.5 h-3.5" /> {dest.timeZone}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {dest.tags.map(tag => <Badge key={tag} tone="brand">{tag}</Badge>)}
              {dest.categories.map(cat => <Badge key={cat} tone="grape">{cat}</Badge>)}
            </div>
          </motion.div>

          <ImageGallery images={dest.images ?? []} name={dest.destinationName} />

          {/* Tabs */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    activeTab === tab.key ? "bg-ink text-white border-ink" : "bg-white text-ink border-line hover:border-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <>
                <DescriptionSection label="Overview" text={description.overview} />
                <DescriptionSection label="What locals say" text={description.localPerspective} />
                <DescriptionSection label="Pair it with" text={description.nearbyComplements?.join(", ")} />
              </>
            )}

            {activeTab === "insights" && (
              <>
                <DescriptionSection label="Know before you go" text={description.whatToKnow} />
                <DescriptionSection label="Watch out for" text={description.thingsToBeWaryOf} />
                <DescriptionSection label="Hidden costs" text={description.hiddenCost} />
                <DescriptionSection label="How busy it gets" text={description.crowdLevel} />
              </>
            )}

            {activeTab === "practical" && (
              <>
                <DescriptionSection label="Getting there" text={description.directions} />
                <DescriptionSection label="Accessibility" text={description.accessibility} />
                <DescriptionSection label="Best time to visit" text={description.bestTimeToVisit} />
                <DescriptionSection label="How long to stay" text={description.idealDuration} />
                <ChipList title="Languages" items={dest.languages} />
                <ChipList title="Currencies" items={dest.currencies} />
                <ChipList title="Cities" items={dest.cities} />
              </>
            )}
          </div>

          {/* Who's going */}
          <TripsForPlace destinationId={dest.destinationId} placeName={dest.destinationName} />

          {/* Wishlists featuring this destination */}
          <div>
            <SectionTitle>Ready-made wishlists that go here</SectionTitle>
            {relatedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array.from({ length: 2 }).map((_, i) => <WishlistCardSkeleton key={i} />)}
              </div>
            ) : relatedWishlists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {relatedWishlists.map((w, i) => (
                  <WishlistCardComponent
                    key={w.wishlistId}
                    wishlist={w}
                    saved={isWishlistSaved(w.wishlistId)}
                    onToggleSave={() => toggleWishlist(w.wishlistId)}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No wishlists include {dest.destinationName} yet.</p>
            )}
          </div>
        </div>

        {/* ── Right: sticky sidebar ── */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-line shadow-pop-lg p-6 flex flex-col gap-5">
              <div>
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Average spend</p>
                <p className="font-display text-4xl font-light text-ink">
                  {formatPrice(dest.averageCostPerDay)}
                  <span className="text-base font-semibold text-ink-muted"> /day</span>
                </p>
              </div>

              {isConverted && (
                <p className="text-[11px] text-ink-muted -mt-2">
                  Shown in {currency}, converted from {formatUsd(dest.averageCostPerDay)} at today's rate.
                </p>
              )}

              <div className="flex flex-col gap-3">
                <ScoreBar label="Luxury" value={dest.luxuryRating} color="var(--color-sun-500)" />
                <ScoreBar label="Family friendly" value={dest.familyFriendlyScore} color="var(--color-mint-500)" />
                <ScoreBar label="Adventure" value={dest.adventurePaceScore} color="var(--color-grape-500)" />
              </div>

              <div className="flex flex-col gap-2.5">
                {partner && <PartnerBookingButton partner={partner} {...partnerCtx} />}
                <Button variant={partner ? "outline" : "primary"} size="lg" fullWidth onClick={scrollToTrips}>
                  <UsersRound className="w-4 h-4" /> Find people going
                </Button>
                <Button variant="soft" size="lg" fullWidth onClick={planTrip}>
                  <PlusCircle className="w-4 h-4" /> Plan a trip here
                </Button>
              </div>

              {partner && (
                <p className="text-[11px] text-ink-muted text-center leading-snug">
                  Booking happens on {partner.name}'s site. Hodrac may earn a referral fee.
                </p>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-line p-5">
              <p className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-2">Quick info</p>
              {[
                { label: "Country", value: dest.countryName },
                { label: "Time zone", value: dest.timeZone },
                { label: "Best time", value: description.bestTimeToVisit },
                { label: "Ideal stay", value: description.idealDuration },
                { label: "Access", value: dest.accessibilityType },
              ].filter(r => r.value).map(r => <InfoRow key={r.label} label={r.label} value={r.value} />)}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/70 backdrop-blur-xl border-t border-white/60 px-5 py-3 flex items-center gap-3">
        <div className="shrink-0">
          <p className="text-[10px] font-medium text-ink-muted uppercase">Avg / day</p>
          <p className="font-display text-xl font-normal text-ink leading-none">{formatPrice(dest.averageCostPerDay)}</p>
        </div>
        <div className="flex-1">
          {partner ? (
            <PartnerBookingButton partner={partner} size="md" {...partnerCtx} />
          ) : (
            <Button fullWidth onClick={scrollToTrips}>
              <UsersRound className="w-4 h-4" /> Find people going
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DestinationDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 flex flex-col gap-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="aspect-16/10 w-full rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
