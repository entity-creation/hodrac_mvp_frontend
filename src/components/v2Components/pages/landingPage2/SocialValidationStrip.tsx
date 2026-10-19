import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { wishlistsApi } from "../../../../dataStore/v2Api/client";
import { useAuth } from "../../../../hooks/v2Hooks/useAuth";
import { useSavedContent } from "../../../../hooks/v2Hooks/useData";
import { usePersonalization, type PersonalizationData } from "../../../../hooks/v2Hooks/usePersonalization";
import { WishlistCardComponent } from "../../cards/Cards";
import { Section, WishlistCardSkeleton } from "../../ui";
import { ROUTES } from "../../../../utils/v2Utils/routes";
import type { WishlistCard } from "../../../../types";

// Headline tailored to what we know about the visitor (from the quiz).
function headline(p: PersonalizationData | null): string {
  const interest = p?.interests?.[0];
  if (p?.travelGroup === "Partner") return "Couples like you are exploring";
  if (p?.travelGroup === "Family") return "Families like you are exploring";
  if (p?.travelGroup === "Friends") return "Groups of friends like you are exploring";
  if (p?.budget === "Luxury") return "Travellers with your taste are exploring";
  if (interest) return `${interest} lovers like you are exploring`;
  return "Travellers like you are exploring";
}

// What similar travellers are saving. Tries the most personal source first
// and falls back so the section still shows when an endpoint is empty/fails:
// popular (persona-ranked when signed in) → matching-user → most saved → featured.
async function loadTravellersLikeYou(userId?: string): Promise<WishlistCard[]> {
  const sources: Array<() => Promise<WishlistCard[]>> = [
    () => wishlistsApi.popular(userId, 12),
    ...(userId ? [() => wishlistsApi.matchingUser(userId, 12)] : []),
    () => wishlistsApi.list({ sort: "saves", page: 1, pageSize: 12 }).then(r => r.items ?? []),
    () => wishlistsApi.featured(),
  ];
  for (const load of sources) {
    const result = await load().catch(() => [] as WishlistCard[]);
    if (Array.isArray(result) && result.length) return result.slice(0, 12);
  }
  return [];
}

// "Travellers like you" — what similar travellers are saving right now.
export default function SocialValidationStrip() {
  const { user, isAuthenticated } = useAuth();
  const { personalization } = usePersonalization();
  const { isWishlistSaved, toggleWishlist } = useSavedContent(isAuthenticated);
  const [wishlists, setWishlists] = useState<WishlistCard[] | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadTravellersLikeYou(user?.userId)
      .then(r => { if (!cancelled) setWishlists(r); });
    return () => { cancelled = true; };
  }, [user?.userId]);

  if (wishlists && wishlists.length === 0) return null;

  const scrollBy = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <Section
      id="travellers-like-you"
      eyebrow="Travellers like you"
      title={headline(personalization)}
      subtitle="The trips people with similar tastes are saving right now."
      action={{ label: "View all", to: ROUTES.PUBLIC.EXPLOREWISHLIST }}
      className="scroll-mt-16"
    >
      <div className="relative">
        <div
          ref={scroller}
          className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-5 px-5 md:mx-0 md:px-0 pb-2"
        >
          {(wishlists ?? Array.from({ length: 4 }, () => null)).map((w, i) => (
            <div key={w?.wishlistId ?? i} className="shrink-0 w-[78%] sm:w-[45%] lg:w-[calc(25%-18px)] snap-start">
              {w ? (
                <WishlistCardComponent
                  wishlist={w}
                  saved={isWishlistSaved(w.wishlistId)}
                  onToggleSave={() => toggleWishlist(w.wishlistId)}
                  index={i}
                  source="landing_travellers_like_you"
                />
              ) : (
                <WishlistCardSkeleton />
              )}
            </div>
          ))}
        </div>

        {wishlists && wishlists.length > 4 && (
          <div className="hidden md:flex justify-end gap-2 mt-6">
            <button onClick={() => scrollBy(-1)} aria-label="Previous" className="w-11 h-11 rounded-full border border-line hover:border-ink flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scrollBy(1)} aria-label="Next" className="w-11 h-11 rounded-full border border-line hover:border-ink flex items-center justify-center transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}
