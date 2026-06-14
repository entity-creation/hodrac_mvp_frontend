import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDestinationDetail, useSavedContent } from "../../../hooks/v2Hooks/useData";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import {
  SaveButton, ScoreBar, SectionTitle, InfoRow,
  Skeleton, EmptyState, WishlistCardSkeleton,
} from "../../../components/v2Components/ui";
import { WishlistCardComponent } from "../../../components/v2Components/cards/Cards";
import { wishlistsApi } from "../../../dataStore/v2Api/client";
import type { DestinationDetail, WishlistCard } from "../../../types";
import { useEffect } from "react";

// ─── Image gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images }: { images: Array<{ imageUrl: string; caption: string; imageType: string }> }) {
  const [active, setActive] = useState(0);
  if (!images.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Main image */}
      <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden bg-gray-100">
        <img
          src={images[active].imageUrl}
          alt={images[active].caption}
          className="w-full h-full object-cover"
        />
        {images[active].caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4">
            <p className="text-white text-xs">{images[active].caption}</p>
          </div>
        )}
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? "border-gray-900" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Description section ──────────────────────────────────────────────────────

function DescriptionSection({ label, text, emoji }: { label: string; text: string; emoji: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > 200;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="font-semibold text-gray-900 text-sm mb-3">
        {emoji} {label}
      </p>
      <p className={`text-sm text-gray-600 leading-relaxed ${!expanded && isLong ? "line-clamp-3" : ""}`}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-gray-400 hover:text-gray-700 mt-2 transition-colors"
        >
          {expanded ? "Show less ↑" : "Read more ↓"}
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DestinationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: dest, loading, error } = useDestinationDetail(id!);
  const { isDestinationSaved, toggleDestination, isWishlistSaved, toggleWishlist } = useSavedContent(isAuthenticated);

  const [similarWishlists, setSimilarWishlists] = useState<WishlistCard[]>([]);
  const [similarLoading,   setSimilarLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "insights" | "practical">("overview");

  useEffect(() => {
    if (!id) return;
    wishlistsApi.destinationInWishlist(id, 4)
      .then(setSimilarWishlists)
      .catch(() => {})
      .finally(() => setSimilarLoading(false));
  }, [id]);

  if (loading) return <DestinationDetailSkeleton />;
  if (error || !dest) return (
    <div className="min-h-screen flex items-center justify-center">
      <EmptyState emoji="😕" title="Destination not found" action={<button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full">Go back</button>} />
    </div>
  );

  const SAFETY_LABEL = ["", "Very Safe", "Safe", "Moderate", "Use Caution", "High Risk"][(dest as DestinationDetail).safetyLevel] ?? "";
  const SAFETY_COLOR = ["", "#10b981", "#10b981", "#f59e0b", "#ef4444", "#dc2626"][(dest as DestinationDetail).safetyLevel] ?? "#6b7280";

  const TABS = [
    { key: "overview",   label: "Overview" },
    { key: "insights",   label: "Traveler Insights" },
    { key: "practical",  label: "Practical Info" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-20">

        {/* Back */}
        <div className="pt-6 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: content ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Hero info row */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{(dest as DestinationDetail).countryName}</p>
                  <h1
                    className="text-3xl md:text-4xl font-black text-gray-900 leading-tight"
                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                  >
                    {(dest as DestinationDetail).destinationName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: SAFETY_COLOR }}
                    >
                      {SAFETY_LABEL}
                    </span>
                    {(dest as DestinationDetail).timeZone && (
                      <span className="text-xs text-gray-400">🕐 {(dest as DestinationDetail).timeZone}</span>
                    )}
                  </div>
                </div>
                <SaveButton
                  saved={isDestinationSaved((dest as DestinationDetail).destinationId)}
                  onToggle={() => toggleDestination((dest as DestinationDetail).destinationId)}
                />
              </div>

              {/* Tags + categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(dest as DestinationDetail).tags.map(tag => (
                  <span key={tag} className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{tag}</span>
                ))}
                {(dest as DestinationDetail).categories.map(cat => (
                  <span key={cat} className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{cat}</span>
                ))}
              </div>
            </motion.div>

            {/* Image gallery */}
            <ImageGallery images={(dest as DestinationDetail).images} />

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-4">
                <DescriptionSection emoji="📖" label="Overview" text={(dest as DestinationDetail).description.overview} />
                <DescriptionSection emoji="🏘️" label="Local Perspective" text={(dest as DestinationDetail).description.localPerspective} />
                <DescriptionSection emoji="🌿" label="Nearby Complements" text={(dest as DestinationDetail).description.nearbyComplements.join(", ")} />
              </div>
            )}

            {/* Insights tab */}
            {activeTab === "insights" && (
              <div className="flex flex-col gap-4">
                <DescriptionSection emoji="👁️" label="What to Know" text={(dest as DestinationDetail).description.whatToKnow} />
                <DescriptionSection emoji="⚠️" label="Things to Be Wary Of" text={(dest as DestinationDetail).description.thingsToBeWaryOf} />
                <DescriptionSection emoji="💰" label="Hidden Costs" text={(dest as DestinationDetail).description.hiddenCost} />
                <DescriptionSection emoji="🌊" label="Crowd Level" text={(dest as DestinationDetail).description.crowdLevel} />
              </div>
            )}

            {/* Practical tab */}
            {activeTab === "practical" && (
              <div className="flex flex-col gap-4">
                <DescriptionSection emoji="🗺️" label="Getting There" text={(dest as DestinationDetail).description.directions} />
                <DescriptionSection emoji="♿" label="Accessibility" text={(dest as DestinationDetail).description.accessibility} />
                <DescriptionSection emoji="🌸" label="Best Time to Visit" text={(dest as DestinationDetail).description.bestTimeToVisit} />
                <DescriptionSection emoji="⏱️" label="Ideal Duration" text={(dest as DestinationDetail).description.idealDuration} />
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="font-semibold text-gray-900 text-sm mb-3">🌐 Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {(dest as DestinationDetail).languages.map(l => (
                      <span key={l} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="font-semibold text-gray-900 text-sm mb-3">💱 Currencies</p>
                  <div className="flex flex-wrap gap-2">
                    {(dest as DestinationDetail).currencies.map(c => (
                      <span key={c} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold">{c}</span>
                    ))}
                  </div>
                </div>
                {(dest as DestinationDetail).cities.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="font-semibold text-gray-900 text-sm mb-3">🏙️ Cities</p>
                    <div className="flex flex-wrap gap-2">
                      {(dest as DestinationDetail).cities.map(c => (
                        <span key={c} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wishlists featuring this destination */}
            <div>
              <SectionTitle>Wishlists featuring this destination</SectionTitle>
              {similarLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, i) => <WishlistCardSkeleton key={i} />)}
                </div>
              ) : similarWishlists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similarWishlists.map((w, i) => (
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
                <p className="text-sm text-gray-400">No wishlists yet for this destination.</p>
              )}
            </div>
          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 flex flex-col gap-4">

              {/* Cost + scores */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
                <div>
                  <p className="text-3xl font-black text-gray-900">
                    ${(dest as DestinationDetail).averageCostPerDay.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">avg. per day</p>
                </div>

                <div className="flex flex-col gap-3">
                  <ScoreBar label="Luxury"         value={(dest as DestinationDetail).luxuryRating}         color="#f59e0b" />
                  <ScoreBar label="Family Friendly" value={(dest as DestinationDetail).familyFriendlyScore}  color="#10b981" />
                  <ScoreBar label="Adventure"       value={(dest as DestinationDetail).adventurePaceScore}   color="#6366f1" />
                  <ScoreBar label="Safety (1=Best)" value={(dest as DestinationDetail).safetyLevel}          color={SAFETY_COLOR} />
                </div>

                <button
                  onClick={() => navigate(`/explore/wishlists?tags=${(dest as DestinationDetail).tags[0] ?? ""}`)}
                  className="w-full py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-95 transition-all"
                >
                  Find trips here →
                </button>
              </div>

              {/* Quick info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Info</p>
                <div className="flex flex-col">
                  {[
                    { label: "Country",      value: (dest as DestinationDetail).countryName },
                    { label: "Time Zone",    value: (dest as DestinationDetail).timeZone },
                    { label: "Best Time",    value: (dest as DestinationDetail).description.bestTimeToVisit },
                    { label: "Ideal Stay",   value: (dest as DestinationDetail).description.idealDuration },
                    { label: "Access",       value: (dest as DestinationDetail).accessibilityType },
                  ].filter(r => r.value).map(r => (
                    <InfoRow key={r.label} label={r.label} value={r.value} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DestinationDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-72 w-full rounded-3xl" />
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
        <div><Skeleton className="h-64 w-full rounded-3xl" /></div>
      </div>
    </div>
  );
}
