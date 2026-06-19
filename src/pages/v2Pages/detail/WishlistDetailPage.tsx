import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlistDetail, useSimilarWishlists, useSavedContent, useDestinationsInWishlist } from "../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { wishlistsApi } from "../../../dataStore/v2Api/client";
import {
  Button, SaveButton, CountdownTimer, SectionTitle,
  Skeleton, EmptyState, WishlistCardSkeleton, DestinationCardSkeleton,
} from "../../../components/v2Components/ui";
import { WishlistCardComponent } from "../../../components/v2Components/cards/Cards";
import { DestinationCardComponent } from "../../../components/v2Components/cards/Cards";
import type { ItineraryDay, ItineraryItem, WishlistCreatorAttributionDto } from "../../../types";
import { useWishlistSignalR } from "../../../hooks/v2Hooks/useSignalR";

// ─── Itinerary item ───────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, string> = {
  YouTube:    "▶",
  Instagram:  "📷",
  TikTok:     "🎵",
  Blog:       "✍️",
  "Twitter/X":"𝕏",
  Podcast:    "🎙️",
};

// ─── Creator attribution card ─────────────────────────────────────────────────

function CreatorAttributionCard({ attribution }: { attribution: WishlistCreatorAttributionDto }) {
  const { creator } = attribution;
  const icon = PLATFORM_ICONS[creator.platformName] ?? "🔗";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 p-4 bg-linear-to-r from-gray-50 to-white
                 border border-gray-100 rounded-2xl"
    >
      {/* Avatar */}
      {creator.avatarUrl ? (
        <img
          src={creator.avatarUrl}
          alt={creator.displayName}
          className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center
                        text-lg font-bold text-gray-500 shrink-0">
          {creator.displayName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Name + verified badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={creator.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 text-sm hover:underline truncate"
          >
            {creator.displayName}
          </a>
          {creator.isVerified && (
            <span className="text-[10px] font-semibold bg-blue-50 text-blue-600
                             px-2 py-0.5 rounded-full shrink-0">
              ✓ Verified
            </span>
          )}
        </div>

        {/* Handle + platform */}
        <p className="text-xs text-gray-400 mt-0.5">
          {icon} @{creator.handle} · {creator.platformName}
        </p>

        {/* Bio */}
        {creator.bio && (
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
            {creator.bio}
          </p>
        )}

        {/* Original content link */}
        {attribution.originalContentUrl && (
          <a
            href={attribution.originalContentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium
                       text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span>🔗</span>
            <span>View original content</span>
          </a>
        )}
      </div>

      {/* Permission badge */}
      <div className="shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide
                         bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
          ✓ Licensed
        </span>
      </div>
    </motion.div>
  );
}

// ─── Creator attribution section ──────────────────────────────────────────────

function CreatorAttributionSection({
  attributions,
}: { attributions: WishlistCreatorAttributionDto[] }) {
  if (!attributions || attributions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {attributions.length === 1 ? "Based on content by" : "Content creators"}
      </p>
      {attributions.map(a => (
        <CreatorAttributionCard key={a.wishlistCreatorAttributionId} attribution={a} />
      ))}
    </div>
  );
}

// ─── Itinerary item ───────────────────────────────────────────────────────────

function ItineraryItemRow({ item }: { item: ItineraryItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        item.isSelectedByDefault ? "border-gray-200 bg-white" : "border-dashed border-gray-200 bg-gray-50"
      }`}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        {item.imageUrl != null && item.imageUrl != "" ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        ): (<div className="w-14 h-14 rounded-xl object-cover shrink-0 object-center text-2xl">🧳</div>)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.timeOfDay}</span>
            {item.isOptional && (
              <span className="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-semibold">Optional</span>
            )}
            {item.socialProofBadge && (
              <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">
                ⭐ {item.socialProofBadge}
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-300 text-sm mt-0.5">{item.title}</p>
          {item.costModifier > 0 && (
            <p className="text-xs text-emerald-600 font-medium mt-0.5">+${item.costModifier.toLocaleString()}</p>
          )}
        </div>
        <span className={`text-gray-400 transition-transform duration-200 text-sm shrink-0 mt-1 ${expanded ? "rotate-180" : ""}`}>▼</span>
      </button>

      <AnimatePresence>
        {expanded && item.description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
              {item.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Itinerary day ────────────────────────────────────────────────────────────

function ItineraryDayCard({ day }: { day: ItineraryDay }) {
  const [open, setOpen] = useState(day.dayNumber === 1);

  return (
    <div className="border border-gray-100 rounded-3xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-sm font-black shrink-0">
            {day.dayNumber}
          </div>
          <div>
            <p className="font-bold text-gray-300 text-sm">{day.dayTitle}</p>
            <p className="text-xs text-gray-400">
              {[day.morningCity, day.afternoonCity, day.eveningCity]
                .filter(Boolean)
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(" → ")}
            </p>
          </div>
        </div>
        <span className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Transit notice */}
            {day.transitFromPreviousDay && (
              <div className="mx-5 mb-3 mt-1 px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-700 font-medium flex items-center gap-2">
                <span>🚄</span>
                <span>
                  {day.transitFromPreviousDay.transitType} from {day.transitFromPreviousDay.fromCity} → {day.transitFromPreviousDay.toCity}
                  {" · "}{day.transitFromPreviousDay.durationMinutes} min
                  {" · "}${day.transitFromPreviousDay.costPerPerson}/person
                </span>
              </div>
            )}

            <div className="px-5 pb-5 flex flex-col gap-3">
              {day.items.map(item => (
                <ItineraryItemRow key={item.itemId} item={item} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WishlistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated} = useAuth();
  const { data: wishlist, loading, error, refetch } = useWishlistDetail(id!);
  const { data: similar, loading: similarLoading } = useSimilarWishlists(id!);
  const [pageNumber, setPageNumber] = useState(1);
  const { data: destinations, loading: destLoading } = useDestinationsInWishlist(id!, pageNumber);
  const { isWishlistSaved, toggleWishlist, isDestinationSaved, toggleDestination } = useSavedContent(isAuthenticated);
  useWishlistSignalR(
  id!,
  {onWishlistUpdated: () => {
    refetch();
  }
});

  const [forking,    setForking]    = useState(false);
  const [forkError,  setForkError]  = useState("");
  const [activeTab,  setActiveTab]  = useState<"itinerary" | "inclusions" | "info">("itinerary");
  const [travelers,  setTravelers]  = useState(2);
  // const [snapshotLoading, setSnapshotLoading] = useState(false);

  if (loading) return <WishlistDetailSkeleton />;
  if (error || !wishlist) return (
    <div className="min-h-screen flex items-center justify-center">
      <EmptyState emoji="😕" title="Wishlist not found" subtitle="This wishlist may have been removed." action={<Button onClick={() => navigate(-1)}>Go back</Button>} />
    </div>
  );

  const handleFork = async () => {
    if (!isAuthenticated) { navigate("/auth/login"); return; }
    setForking(true);
    setForkError("");
    try {
      const res = await wishlistsApi.fork(wishlist.wishlistId);
      navigate(`/my-wishlists/${res.newWishlistId}/edit`);
    } catch (e: any) {
      setForkError(e.message ?? "Could not create your copy. Try again.");
    } finally {
      setForking(false);
    }
  };
  console.log(wishlist)

  // const handleCreateSnapshot = async () => {
  //   setSnapshotLoading(true);
  //   try {
  //     await wishlistsApi.createSnapshot(wishlist.wishlistId, travelers);
  //     window.location.reload();
  //   } finally {
  //     setSnapshotLoading(false);
  //   }
  // };

  const totalEstimate = (wishlist.basePricePerPerson * travelers).toLocaleString();
  const TABS = [
    { key: "itinerary",   label: "Itinerary" },
    { key: "inclusions",  label: "Inclusions" },
    { key: "info",        label: "About" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 md:h-96 overflow-hidden bg-gray-900">
        {wishlist.wishlistHeroImage && (
          <img
            src={wishlist.wishlistHeroImage}
            alt={wishlist.wishlistName}
            className="w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/50 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          ←
        </button>

        {/* Save button */}
        <div className="absolute top-5 right-5">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
            <SaveButton
              saved={isWishlistSaved(wishlist.wishlistId)}
              onToggle={() => toggleWishlist(wishlist.wishlistId)}
            />
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {wishlist.psychologicalVibeTags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
          <h1
            className="text-2xl md:text-4xl font-black text-white leading-tight mb-2"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {wishlist.wishlistName}
          </h1>
          <p className="text-white/70 text-sm">
            {wishlist.totalDays} days · {wishlist.peopleType} · ❤️ {wishlist.totalGlobalSaveCount.toLocaleString()} saves
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: main content ── */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Short story */}
            {wishlist.shortStory && (
              <p className="text-gray-500 italic text-lg leading-relaxed border-l-4 border-gray-200 pl-4">
                "{wishlist.shortStory}"
              </p>
            )}

            {/* Description */}
            {wishlist.wishlistDescription && (
              <p className="text-gray-700 leading-relaxed">{wishlist.wishlistDescription}</p>
            )}

            {/* Creator attribution — only shown when the wishlist is based on a creator's content */}
            <CreatorAttributionSection attributions={wishlist.creatorAttributions ?? []} />

            {/* Tabs */}
            <div>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6 w-fit">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab.key
                        ? "bg-white text-gray-300 shadow-sm"
                        : "text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Itinerary tab */}
              {activeTab === "itinerary" && (
                <div className="flex flex-col gap-4">
                  {wishlist.itineraryDays.length === 0 ? (
                    <EmptyState emoji="📅" title="Itinerary coming soon" subtitle="This wishlist is being built." />
                  ) : (
                    wishlist.itineraryDays.map(day => (
                      <ItineraryDayCard key={day.dayNumber} day={day} />
                    ))
                  )}
                </div>
              )}

              {/* Inclusions tab */}
              {activeTab === "inclusions" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "🏨 Accommodation", text: wishlist.accommodationInclusions ?? wishlist.globalInclusions.find(i => i.toLowerCase().includes("hotel")) },
                    { label: "🚄 Transit",        text: wishlist.transitInclusions ?? wishlist.globalInclusions.find(i => i.toLowerCase().includes("train")) },
                    { label: "🎯 Activities",     text: wishlist.activityInclusions ?? wishlist.globalInclusions.find(i => i.toLowerCase().includes("activ")) },
                  ].filter(s => s.text).map(section => (
                    <div key={section.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <p className="font-semibold text-gray-900 text-sm mb-2">{section.label}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{section.text}</p>
                    </div>
                  ))}
                  {wishlist.globalInclusions.length > 0 && (
                    <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 p-4">
                      <p className="font-semibold text-gray-900 text-sm mb-3">Everything included</p>
                      <ul className="flex flex-wrap gap-2">
                        {wishlist.globalInclusions.map(item => (
                          <li key={item} className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                            <span className="text-emerald-500 text-[10px]">✓</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Info tab */}
              {activeTab === "info" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
                  {[
                    { label: "Traveler type",    value: wishlist.peopleType },
                    { label: "Trip length",      value: `${wishlist.totalDays} days` },
                    { label: "Target persona",   value: wishlist.primaryPersonaTarget },
                    { label: "Vibe",             value: wishlist.psychologicalVibeTags.join(", ") },
                    { label: "Default travelers",value: wishlist.defaultTravelersCount },
                  ].filter(r => r.value).map(row => (
                    <div key={row.label} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-36 shrink-0">{row.label}</span>
                      <span className="text-sm text-gray-700">{String(row.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Similar destinations */}
            <div>
              <SectionTitle>Destinations in this wishlist</SectionTitle>
              {destLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => <DestinationCardSkeleton key={i} />)}
                </div>
              ) : destinations && destinations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              ) : null}

              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPageNumber((pageNumber) - 1)}
                  disabled={pageNumber <= 1}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-900 disabled:opacity-30 transition-all"
                >
                  ← Previous
                </button>
                
                <button
                  onClick={() => setPageNumber((pageNumber) + 1)}
                  disabled={destinations == null || destinations.length == 0}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-900 disabled:opacity-30 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Similar wishlists */}
            <div>
              <SectionTitle>Similar wishlists</SectionTitle>
              {similarLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, i) => <WishlistCardSkeleton key={i} />)}
                </div>
              ) : similar && similar.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similar.slice(0, 4).map((w, i) => (
                    <WishlistCardComponent
                      key={w.wishlistId}
                      wishlist={w}
                      saved={isWishlistSaved(w.wishlistId)}
                      onToggleSave={() => toggleWishlist(w.wishlistId)}
                      index={i}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 flex flex-col gap-4">

              {/* Pricing card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
                <div>
                  <p className="text-3xl font-black text-gray-900">
                    ${wishlist.basePricePerPerson.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">per person</p>
                </div>

                {/* Traveler count */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Travelers</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTravelers(t => Math.max(1, t - 1))}
                      className="w-9 h-9 rounded-full border-2 border-gray-200 text-gray-600 font-bold hover:border-gray-900 transition-colors"
                    >−</button>
                    <span className="font-bold text-gray-900 w-6 text-center">{travelers}</span>
                    <button
                      onClick={() => setTravelers(t => t + 1)}
                      className="w-9 h-9 rounded-full border-2 border-gray-200 text-gray-600 font-bold hover:border-gray-900 transition-colors"
                    >+</button>
                  </div>
                </div>

                {/* Total estimate */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Estimated total</p>
                  <p className="text-xl font-black text-gray-900">${totalEstimate}</p>
                  <p className="text-xs text-gray-400">for {travelers} traveler{travelers > 1 ? "s" : ""}</p>
                </div>

                {/* Countdown if snapshot exists */}
                {wishlist.activePricingSnapshot && (
                  <CountdownTimer validUntil={wishlist.activePricingSnapshot.validUntil} />
                )}

                {/* Deposit */}
                {wishlist.depositAmountRequired > 0 && (
                  <p className="text-xs text-gray-400 text-center">
                    Secure your spot with a ${wishlist.depositAmountRequired.toLocaleString()} deposit
                  </p>
                )}

                {/* Lock price button
                {!wishlist.activePricingSnapshot && (
                  <Button
                    variant="outline"
                    fullWidth
                    loading={snapshotLoading}
                    onClick={handleCreateSnapshot}
                  >
                    🔒 Lock this price
                  </Button>
                )} */}

                {/* Fork CTA */}
                <Button
                  variant="primary"
                  fullWidth
                  loading={forking}
                  onClick={handleFork}
                >
                  {isAuthenticated ? "Customise this trip →" : "Sign in to customise"}
                </Button>

                {forkError && (
                  <p className="text-xs text-red-500 text-center">{forkError}</p>
                )}

                {/* Collaborators shortcut */}
                {(wishlist.isUserOwner || wishlist.isCollaborator) && (
                  <button
                    onClick={() => navigate(`/my-wishlists/${wishlist.wishlistId}/collaborate`)}
                    className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    👥 Manage collaborators
                  </button>
                )}
              </div>

              {/* Quick stats */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
                {[
                  { emoji: "📅", label: "Duration",  value: `${wishlist.totalDays} days` },
                  { emoji: "👥", label: "Group type", value: wishlist.peopleType },
                  { emoji: "❤️", label: "Saved by",  value: `${wishlist.totalGlobalSaveCount.toLocaleString()} travelers` },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <span className="text-lg">{stat.emoji}</span>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{stat.label}</p>
                      <p className="text-sm font-semibold text-gray-800">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WishlistDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Skeleton className="h-72 w-full rounded-none" />
      <div className="max-w-7xl mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

