import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight, ArrowUpRight } from "lucide-react";
import { searchApi, wishlistsApi } from "../../../../dataStore/v2Api/client";
import { usePersonalization } from "../../../../hooks/v2Hooks/usePersonalization";
import { buttonClasses } from "../../ui";
import { slugify } from "../../../../utils/v2Utils/slugify";
import { ROUTES } from "../../../../utils/v2Utils/routes";
import type { WishlistCard } from "../../../../types";
import { useCurrency } from "../../../../hooks/v2Hooks/useCurrency";

const FALLBACK_SEARCHES = ["Japan", "Amalfi Coast", "Bali", "Lisbon", "Iceland"];

// Full-bleed featured photo with the copy on a frosted-glass panel.
export default function HeroSection() {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { personalization, openQuiz } = usePersonalization();
  const [query, setQuery] = useState("");
  const [popular, setPopular] = useState<string[]>([]);
  const [feature, setFeature] = useState<WishlistCard | null>(null);
  const [featureLoaded, setFeatureLoaded] = useState(false);

  useEffect(() => {
    searchApi.popular(5)
      .then(r => {
        const list = r.map(x => x.phrase).filter(Boolean);
        setPopular(list.length ? list.slice(0, 5) : FALLBACK_SEARCHES);
      })
      .catch(() => setPopular(FALLBACK_SEARCHES));

    // Lead with a featured trip that has a photo.
    wishlistsApi.featured()
      .then(r => setFeature(r.find(w => w.wishlistHeroImage) ?? null))
      .catch(() => setFeature(null))
      .finally(() => setFeatureLoaded(true));
  }, []);

  const runSearch = (q: string) => {
    if (!q.trim()) return;
    navigate(`${ROUTES.PUBLIC.SEARCH}?q=${encodeURIComponent(q.trim())}`);
  };

  const returning = (personalization?.interests?.length ?? 0) > 0;

  return (
    <section className="px-3 md:px-5 pt-20 pb-6">
      <div className="relative min-h-[88vh] rounded-3xl overflow-hidden bg-cream-deep">
        {/* Background photo */}
        {feature?.wishlistHeroImage && (
          <motion.img
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4 }}
            src={feature.wishlistHeroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {!featureLoaded && <div className="absolute inset-0 animate-pulse bg-cream-deep" />}
        <div className="absolute inset-0 bg-linear-to-t from-ink/35 via-transparent to-white/10" />

        <div className="relative h-full min-h-[88vh] flex flex-col justify-end p-4 md:p-10 gap-4">
          {/* Glass panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass rounded-2xl p-7 md:p-10 max-w-2xl"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink-soft mb-5">
              {returning ? "Welcome back" : "Travel, considered"}
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-ink leading-[1.04] mb-5">
              Not sure where to go next? <em className="italic text-ink-soft">Begin here.</em>
            </h1>

            <p className="text-base md:text-lg text-ink-soft max-w-lg mb-8 leading-relaxed">
              Thoughtfully planned trips from real travellers, honest guides to every destination, and like-minded people to travel with.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              {returning ? (
                <a href="#travellers-like-you" className={buttonClasses("primary", "lg")}>
                  View your matches <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <button onClick={openQuiz} className={buttonClasses("primary", "lg")}>
                  Find my trip <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <Link to={ROUTES.PUBLIC.EXPLOREWISHLIST} className={buttonClasses("outline", "lg", "bg-white/40!")}>
                Browse all wishlists
              </Link>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); runSearch(query); }}
              className="flex items-center gap-3 bg-white/60 border border-white/80 rounded-full pl-4 pr-1.5 py-1.5"
            >
              <Search className="w-4 h-4 text-ink-muted shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Or search a destination"
                aria-label="Search destinations and trips"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-ink placeholder:text-ink-muted py-1.5"
              />
              <button type="submit" aria-label="Search" className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center shrink-0 hover:bg-ink-soft">
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {popular.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-xs text-ink-muted mr-1">Popular</span>
                {popular.map(tag => (
                  <button
                    key={tag}
                    onClick={() => runSearch(tag)}
                    className="text-xs text-ink bg-white/50 hover:bg-white border border-white/80 rounded-full px-3 py-1 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Featured trip caption */}
          {feature && (
            <Link
              to={`/wishlists/${feature.wishlistId}/${slugify(feature.wishlistName)}`}
              className="glass group self-start md:self-end md:absolute md:top-24 md:right-10 rounded-full pl-5 pr-2 py-2 flex items-center gap-4 max-w-full"
            >
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-[0.25em] text-ink-muted">Featured trip</span>
                <span className="block text-sm text-ink truncate">
                  {feature.wishlistName} · from {formatPrice(feature.basePricePerPerson)}
                </span>
              </span>
              <span className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
