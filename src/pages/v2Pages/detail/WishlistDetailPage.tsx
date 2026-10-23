import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronDown, Users, UsersRound, Check, Train, ExternalLink, Map, Image as ImageIcon,
} from "lucide-react";
import { useWishlistDetail, useSimilarWishlists, useSavedContent, useDestinationsInWishlist } from "../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import {
  Button, SaveButton, CountdownTimer, SectionTitle, Badge,
  Skeleton, EmptyState, WishlistCardSkeleton, DestinationCardSkeleton,
} from "../../../components/v2Components/ui";
import { WishlistCardComponent, DestinationCardComponent } from "../../../components/v2Components/cards/Cards";
import { PartnerBadge, PartnerBookingButton } from "../../../components/v2Components/partner/Partner";
import TripsForPlace from "../../../components/v2Components/tripPost/TripsForPlace";
import type { ItineraryDay, ItineraryItem, WishlistCreatorAttributionDto } from "../../../types";
import { useWishlistSignalR } from "../../../hooks/v2Hooks/useSignalR";
import { colourwayFor } from "../../../utils/v2Utils/format";
import { useCurrency } from "../../../hooks/v2Hooks/useCurrency";
import ShareButton from "../../../components/v2Components/share/ShareButton";

const PLATFORM_ICONS: Record<string, string> = {
  YouTube: "▶",
  Instagram: "📷",
  TikTok: "🎵",
  Blog: "✍️",
  "Twitter/X": "𝕏",
  Podcast: "🎙️",
};

// ─── Creator attribution ──────────────────────────────────────────────────────

function CreatorAttributionCard({ attribution }: { attribution: WishlistCreatorAttributionDto }) {
  const { creator } = attribution;
  const icon = PLATFORM_ICONS[creator.platformName] ?? "🔗";

  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-line rounded-3xl shadow-pop-sm">
      {creator.avatarUrl ? (
        <img src={creator.avatarUrl} alt={creator.displayName} className="w-12 h-12 rounded-full object-cover shrink-0 border border-line" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-grape-500 border border-line flex items-center justify-center text-lg font-semibold text-white shrink-0">
          {creator.displayName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a href={creator.profileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-ink text-sm hover:underline truncate">
            {creator.displayName}
          </a>
          {creator.isVerified && <Badge tone="sky">✓ Verified</Badge>}
        </div>
        <p className="text-xs text-ink-muted mt-0.5">{icon} @{creator.handle} · {creator.platformName}</p>
        {creator.bio && <p className="text-xs text-ink-soft mt-1.5 line-clamp-2 leading-relaxed">{creator.bio}</p>}
        {attribution.originalContentUrl && (
          <a
            href={attribution.originalContentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Watch the original <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function CreatorAttributionSection({ attributions }: { attributions: WishlistCreatorAttributionDto[] }) {
  if (!attributions || attributions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-ink-muted uppercase tracking-widest">
        {attributions.length === 1 ? "Inspired by" : "Inspired by these creators"}
      </p>
      {attributions.map(a => (
        <CreatorAttributionCard key={a.wishlistCreatorAttributionId} attribution={a} />
      ))}
    </div>
  );
}

// ─── Itinerary ────────────────────────────────────────────────────────────────

function ItineraryItemRow({ item }: { item: ItineraryItem }) {
  const { formatPrice } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        item.isSelectedByDefault ? "border-line bg-white" : "border-dashed border-line bg-cream"
      }`}
    >
      <button onClick={() => setExpanded(e => !e)} aria-expanded={expanded} className="w-full flex items-start gap-3 p-3.5 text-left">
        {/* No lazy-loading: day panels open with a height animation from 0,
            which can stop lazy images from ever being fetched. */}
        {item.imageUrl && !imgFailed ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            onError={() => setImgFailed(true)}
            className="w-20 h-20 rounded-xl object-cover shrink-0 bg-cream-deep"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-cream-deep shrink-0 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-ink-muted" strokeWidth={1.25} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-wider">{item.timeOfDay}</span>
            {item.isOptional && <Badge tone="sky">Optional</Badge>}
            {item.socialProofBadge && <Badge tone="sun">⭐ {item.socialProofBadge}</Badge>}
          </div>
          <p className="font-medium text-ink text-sm mt-0.5">{item.title}</p>
          {item.costModifier > 0 && (
            <p className="text-xs text-mint-500 font-medium mt-0.5">+{formatPrice(item.costModifier)}</p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-ink-muted transition-transform duration-200 shrink-0 mt-1 ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && item.description && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="px-4 pb-4 text-sm text-ink-soft leading-relaxed border-t border-line pt-3">{item.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ItineraryDayCard({ day }: { day: ItineraryDay }) {
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(day.dayNumber === 1);
  const cities = [day.morningCity, day.afternoonCity, day.eveningCity]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(" → ");

  return (
    <div className="border border-line rounded-3xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-cream border border-line text-ink flex flex-col items-center justify-center shrink-0 leading-none">
            <span className="text-[8px] uppercase tracking-wider text-ink-muted">Day</span>
            <span className="text-base font-semibold">{day.dayNumber}</span>
          </div>
          <div>
            <p className="font-display font-normal text-ink">{day.dayTitle}</p>
            {cities && <p className="text-xs text-ink-muted">{cities}</p>}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-ink transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {day.transitFromPreviousDay && (
              <div className="mx-5 mb-3 mt-1 px-3 py-2 bg-sky-100 rounded-xl text-xs text-ink font-semibold flex items-center gap-2">
                <Train className="w-4 h-4 shrink-0" />
                <span>
                  {day.transitFromPreviousDay.transitType} from {day.transitFromPreviousDay.fromCity} → {day.transitFromPreviousDay.toCity}
                  {" · "}{day.transitFromPreviousDay.durationMinutes} min
                  {" · "}{formatPrice(day.transitFromPreviousDay.costPerPerson)}/person
                </span>
              </div>
            )}
            <div className="px-5 pb-5 flex flex-col gap-2.5">
              {[...day.items]
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map(item => <ItineraryItemRow key={item.itemId} item={item} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WishlistDetailPage() {
  const { formatPrice, formatUsd, isConverted, currency } = useCurrency();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: wishlist, loading, error, refetch } = useWishlistDetail(id!);
  const { data: similar, loading: similarLoading } = useSimilarWishlists(id!);
  const [pageNumber, setPageNumber] = useState(1);
  const { data: destinations, loading: destLoading } = useDestinationsInWishlist(id!, pageNumber);
  const { isWishlistSaved, toggleWishlist, isDestinationSaved, toggleDestination } = useSavedContent(isAuthenticated);
  useWishlistSignalR(id!, { onWishlistUpdated: () => { refetch(); } });

  const [activeTab, setActiveTab] = useState<"itinerary" | "inclusions" | "info">("itinerary");
  const [travelers, setTravelers] = useState(2);

  if (loading) return <WishlistDetailSkeleton />;
  if (error || !wishlist) return (
    <EmptyState
      emoji="😕"
      title="Wishlist not found"
      subtitle="This wishlist may have been removed."
      action={<Button onClick={() => navigate(-1)}>Go back</Button>}
    />
  );

  const scrollToTrips = () => document.getElementById("trips")?.scrollIntoView({ behavior: "smooth" });

  const partner = wishlist.partner ?? null;
  const colour = colourwayFor(wishlist.wishlistId);
  const totalEstimate = formatPrice(wishlist.basePricePerPerson * travelers);
  const partnerCtx = { entityType: "wishlist" as const, entityId: wishlist.wishlistId, entityTags: wishlist.psychologicalVibeTags };
  const TABS = [
    { key: "itinerary", label: "Day by day" },
    { key: "inclusions", label: "What's included" },
    { key: "info", label: "Good to know" },
  ] as const;

  return (
    <div className="pb-24 lg:pb-0">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <ShareButton type="wishlist" id={wishlist.wishlistId} label="Share this trip" />
            <SaveButton saved={isWishlistSaved(wishlist.wishlistId)} onToggle={() => toggleWishlist(wishlist.wishlistId)} />
          </div>
        </div>

        <div className={`relative aspect-16/9 md:aspect-21/9 rounded-2xl overflow-hidden ${colour.bg}`}>
          {wishlist.wishlistHeroImage ? (
            <img src={wishlist.wishlistHeroImage} alt={wishlist.wishlistName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Map className="w-12 h-12 text-ink-muted" strokeWidth={1} />
            </div>
          )}
        </div>

        <div className="max-w-3xl pt-10 pb-4">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {partner && <PartnerBadge partner={partner} />}
            {wishlist.isFeatured && <Badge tone="neutral">Featured</Badge>}
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted mb-4">
            {[`${wishlist.totalDays} days`, wishlist.peopleType, ...wishlist.psychologicalVibeTags.slice(0, 2)].filter(Boolean).join("  ·  ")}
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-ink leading-[1.05]">
            {wishlist.wishlistName}
          </h1>
          <p className="mt-4 text-sm text-ink-muted">
            Saved by {wishlist.totalGlobalSaveCount.toLocaleString()} travellers
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Left: main content ── */}
          <div className="lg:col-span-2 flex flex-col gap-12 min-w-0">
            {(wishlist.shortStory || wishlist.wishlistDescription) && (
              <div className="flex flex-col gap-4">
                {wishlist.shortStory && (
                  <p className="font-display text-2xl md:text-3xl font-light italic text-ink leading-snug">
                    “{wishlist.shortStory}”
                  </p>
                )}
                {wishlist.wishlistDescription && (
                  <p className="text-ink-soft leading-relaxed text-base md:text-lg">{wishlist.wishlistDescription}</p>
                )}
              </div>
            )}

            <CreatorAttributionSection attributions={wishlist.creatorAttributions ?? []} />

            {/* Tabs */}
            <div>
              <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar" role="tablist">
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

              {activeTab === "itinerary" && (
                <div className="flex flex-col gap-3">
                  {wishlist.itineraryDays.length === 0 ? (
                    <EmptyState emoji="📅" title="Itinerary coming soon" subtitle="This wishlist is still being built." />
                  ) : (
                    [...wishlist.itineraryDays]
                      .sort((a, b) => a.dayNumber - b.dayNumber)
                      .map(day => <ItineraryDayCard key={day.dayId ?? day.dayNumber} day={day} />)
                  )}
                </div>
              )}

              {activeTab === "inclusions" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Stay", text: wishlist.accommodationInclusions ?? wishlist.globalInclusions.find(i => i.toLowerCase().includes("hotel")), bg: "bg-white" },
                    { label: "Getting around", text: wishlist.transitInclusions ?? wishlist.globalInclusions.find(i => i.toLowerCase().includes("train")), bg: "bg-white" },
                    { label: "Things to do", text: wishlist.activityInclusions ?? wishlist.globalInclusions.find(i => i.toLowerCase().includes("activ")), bg: "bg-white" },
                  ].filter(s => s.text).map(section => (
                    <div key={section.label} className={`${section.bg} rounded-3xl border border-line p-5`}>
                      <p className="font-display font-normal text-ink mb-2">{section.label}</p>
                      <p className="text-sm text-ink-soft leading-relaxed">{section.text}</p>
                    </div>
                  ))}
                  {wishlist.globalInclusions.length > 0 && (
                    <div className="md:col-span-3 bg-white rounded-3xl border border-line p-5">
                      <p className="font-display font-normal text-ink mb-3">Everything included</p>
                      <ul className="flex flex-wrap gap-2">
                        {wishlist.globalInclusions.map(item => (
                          <li key={item} className="flex items-center gap-1.5 text-sm text-ink bg-cream border border-line px-3 py-1.5 rounded-full">
                            <Check className="w-3.5 h-3.5 text-ink-muted" strokeWidth={2} /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "info" && (
                <div className="bg-white rounded-3xl border border-line p-5 flex flex-col">
                  {[
                    { label: "Best for", value: wishlist.peopleType },
                    { label: "Trip length", value: `${wishlist.totalDays} days` },
                    { label: "Made for", value: wishlist.primaryPersonaTarget },
                    { label: "Vibe", value: wishlist.psychologicalVibeTags.join(", ") },
                    { label: "Priced for", value: wishlist.defaultTravelersCount ? `${wishlist.defaultTravelersCount} travellers` : "" },
                  ].filter(r => r.value).map(row => (
                    <div key={row.label} className="flex items-start gap-4 py-3 border-b border-line last:border-0">
                      <span className="text-xs font-medium text-ink-muted uppercase tracking-wide w-28 shrink-0 pt-0.5">{row.label}</span>
                      <span className="text-sm font-semibold text-ink">{String(row.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trips to this wishlist */}
            <TripsForPlace wishlistId={wishlist.wishlistId} placeName={wishlist.wishlistName} />

            {/* Destinations */}
            <div>
              <SectionTitle>The places you'll go</SectionTitle>
              {destLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => <DestinationCardSkeleton key={i} />)}
                </div>
              ) : destinations && destinations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {destinations.map((d, i) => (
                    <DestinationCardComponent
                      key={d.destinationId}
                      destination={d}
                      saved={isDestinationSaved(d.destinationId)}
                      onToggleSave={() => toggleDestination(d.destinationId)}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">No more destinations to show.</p>
              )}

              {(pageNumber > 1 || (destinations?.length ?? 0) > 0) && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" onClick={() => setPageNumber(p => p - 1)} disabled={pageNumber <= 1}>
                    ← Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPageNumber(p => p + 1)} disabled={!destinations || destinations.length === 0}>
                    Next →
                  </Button>
                </div>
              )}
            </div>

            {/* Similar wishlists */}
            {(similarLoading || (similar && similar.length > 0)) && (
              <div>
                <SectionTitle>If you like this, try…</SectionTitle>
                {similarLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {Array.from({ length: 2 }).map((_, i) => <WishlistCardSkeleton key={i} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {similar!.slice(0, 4).map((w, i) => (
                      <WishlistCardComponent
                        key={w.wishlistId}
                        wishlist={w}
                        saved={isWishlistSaved(w.wishlistId)}
                        onToggleSave={() => toggleWishlist(w.wishlistId)}
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: sticky sidebar ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-line shadow-pop-lg p-6 flex flex-col gap-5">
                <div>
                  <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">From</p>
                  <p className="font-display text-4xl font-light text-ink">
                    {formatPrice(wishlist.basePricePerPerson)}
                    <span className="font-sans text-sm text-ink-muted"> / person</span>
                  </p>
                </div>

                <div className="flex items-center justify-between bg-cream rounded-2xl p-4 border border-line">
                  <div>
                    <p className="text-xs font-medium text-ink-muted">Travellers</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => setTravelers(t => Math.max(1, t - 1))}
                        aria-label="Fewer travellers"
                        className="w-8 h-8 rounded-full border border-line bg-white text-ink font-semibold hover:bg-cream-deep"
                      >−</button>
                      <span className="font-semibold text-ink w-5 text-center">{travelers}</span>
                      <button
                        onClick={() => setTravelers(t => t + 1)}
                        aria-label="More travellers"
                        className="w-8 h-8 rounded-full border border-line bg-white text-ink font-semibold hover:bg-cream-deep"
                      >+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-ink-muted">Est. total</p>
                    <p className="font-display text-2xl font-normal text-ink">{totalEstimate}</p>
                  </div>
                </div>

                {isConverted && (
                  <p className="text-[11px] text-ink-muted -mt-2">
                    Shown in {currency}, converted from {formatUsd(wishlist.basePricePerPerson)} at today's rate. Final price is set by the provider.
                  </p>
                )}

                {wishlist.activePricingSnapshot && <CountdownTimer validUntil={wishlist.activePricingSnapshot.validUntil} />}

                <div className="flex flex-col gap-2.5">
                  {partner && <PartnerBookingButton partner={partner} {...partnerCtx} />}

                  <Button variant={partner ? "outline" : "primary"} size="lg" fullWidth onClick={scrollToTrips}>
                    <UsersRound className="w-4 h-4" /> Find travel buddies
                  </Button>
                </div>

                {wishlist.depositAmountRequired > 0 && (
                  <p className="text-xs text-ink-muted text-center">
                    Secure your spot with a {formatPrice(wishlist.depositAmountRequired)} deposit
                  </p>
                )}

                {partner && (
                  <p className="text-[11px] text-ink-muted text-center leading-snug">
                    Booking happens on {partner.name}'s site. Hodrac may earn a referral fee.
                  </p>
                )}

                {(wishlist.isUserOwner || wishlist.isCollaborator) && (
                  <button
                    onClick={() => navigate(`/my-wishlists/${wishlist.wishlistId}/collaborate`)}
                    className="flex items-center justify-center gap-2 text-xs font-medium text-ink-soft hover:text-ink"
                  >
                    <Users className="w-3.5 h-3.5" /> Manage collaborators
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/70 backdrop-blur-xl border-t border-white/60 px-5 py-3 flex items-center gap-3">
        <div className="shrink-0">
          <p className="text-[10px] font-medium text-ink-muted uppercase">From</p>
          <p className="font-display text-xl font-normal text-ink leading-none">{formatPrice(wishlist.basePricePerPerson)}</p>
        </div>
        <div className="flex-1">
          {partner ? (
            <PartnerBookingButton partner={partner} size="md" {...partnerCtx} />
          ) : (
            <Button fullWidth onClick={scrollToTrips}>
              <UsersRound className="w-4 h-4" /> Find travel buddies
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function WishlistDetailSkeleton() {
  return (
    <div>
      <div className="bg-cream-deep border-b border-line">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 flex flex-col gap-4">
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-2/3" />
          </div>
          <Skeleton className="lg:col-span-2 aspect-4/3 rounded-2xl" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-3xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}
