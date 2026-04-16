import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import useWishlist from "../hooks/use_wishlist";

// Layout Components
import NavBar from "../components/landingPage/nav_bar";
import Footer from "../components/landingPage/footer";
import { WishlistHeroSection } from "../components/wishlist/travel/wishlist-hero-section";
import { StorySection } from "../components/wishlist/travel/story-section";
import { ItinerarySection } from "../components/wishlist/travel/itinerary-section";
import { DestinationsSection } from "../components/wishlist/travel/destinations-section";

export default function WishlistPage() {
  const { id } = useParams();
  const { wishlist, loading } = useWishlist({ id });

  if (!id) return null;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
      {/* Persistent Navigation */}
      <nav className="py-4 md:py-6 px-4 md:px-10 w-full max-w-7xl mx-auto">
        <NavBar />
      </nav>

      <AnimatePresence mode="wait">
        {loading ? (
          <WishlistSkeleton key="loading-state" />
        ) : (
          <motion.main
            key="content-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grow flex flex-col"
          >
            {/* Each section should internally handle its own responsive padding */}
            <WishlistHeroSection wishlist={wishlist!} />
            
            <div className="max-w-7xl mx-auto w-full px-4 md:px-10 space-y-12 md:space-y-24 mb-20">
              <StorySection wishlist={wishlist!} />
              <ItinerarySection wishlist={wishlist!} />
              <DestinationsSection wishlist={wishlist!} />
            </div>

            <Footer />
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Skeleton Loader that mimics the actual layout:
 * Hero Block -> Content Block -> Grid Block
 */
function WishlistSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full flex-grow animate-pulse"
    >
      {/* Hero Skeleton */}
      <div className="w-full h-[50vh] md:h-[60vh] bg-gray-200" />
      
      {/* Content Skeleton Area */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-10 mt-10 space-y-12">
        {/* Story Section Placeholder */}
        <div className="space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 rounded-lg" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-2/3 bg-gray-100 rounded" />
        </div>

        {/* Itinerary Section Placeholder */}
        <div className="h-64 w-full bg-gray-100 rounded-3xl" />

        {/* Destination Grid Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}