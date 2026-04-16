import {useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExploreHeroSection from "../components/exploreTripsPage/explore_hero_section";
import TripCard from "../components/exploreTripsPage/trip_card";
import Footer from "../components/landingPage/footer";
import NavBar from "../components/landingPage/nav_bar";
import useDestination from "../hooks/use_destinations";
import type { FilterQuery } from "../models/filter_query";
import { useLocation } from "react-router-dom";
import type { ClientDescription } from "../models/description_client";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function ExploreTripsPage() {
  const location = useLocation();
  const initialFilters = location?.state?.filters;
  
  const [filters, setFilters] = useState<FilterQuery>(
    initialFilters || {
      country: "",
      safetyLevel: [0, 10],
      categories: "",
      tags: "",
      priceRange: [0, 1000],
    }
  );

  const { destinations, desLoading } = useDestination(filters);

  return (
    <div className="w-full min-h-screen flex flex-col bg-white overflow-x-hidden">
      <div className="py-5 px-4 md:px-10 w-full flex flex-col items-center">
        <NavBar />
        <ExploreHeroSection initialFilters={filters} onFilter={setFilters} />
      </div>

      <main className="grow w-full max-w-7xl mx-auto px-4 md:px-10 mb-20">
        <div className="flex flex-col items-center md:items-start my-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Available Destinations
          </h2>
          {desLoading ? (
            <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
          ) : (
            <p className="text-gray-500">
              Showing {destinations.length} places based on your filters
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {desLoading ? (
            /* SKELETON GRID */
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 justify-items-center"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <TripSkeleton key={i} />
              ))}
            </motion.div>
          ) : (
            /* ACTUAL CONTENT */
            <motion.div
              key={JSON.stringify(filters) + destinations.length} 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 justify-items-center"
            >
              {destinations.map((trip) => (
                <motion.div
                  key={trip.destinationName}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                >
                  <TripCard
                    title={trip.destinationName}
                    titleImage={trip.destinationImage}
                    location={trip.countryName}
                    priceRange={trip.costRange}
                    categories={trip.categories}
                    tags={trip.tags}
                    overview={trip.description?.overview as string}
                    safetyLevels={trip.safetyLevel}
                    currency={trip.currencies}
                    bestTimeToVisit={trip.bestPeriodToVisit}
                    timeZone={trip.timeZone}
                    languages={trip.languages}
                    cities={trip.cities}
                    description={trip.description as ClientDescription}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!desLoading && destinations.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-20"
          >
            <p className="text-xl text-gray-400 font-medium">
              No destinations found matching your current filters.
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}

/**
 * Skeleton Card Component
 * Mimics the shape of your TripCard to prevent layout shift
 */
function TripSkeleton() {
  return (
    <div className="w-full max-w-87.5 flex flex-col gap-4 animate-pulse">
      {/* Image Placeholder */}
      <div className="w-full aspect-4/5 bg-gray-200 rounded-2xl" />
      
      {/* Text Placeholders */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-6 w-1/2 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
        <div className="flex gap-2 pt-2">
           <div className="h-6 w-16 bg-purple-50 rounded-full" />
           <div className="h-6 w-16 bg-purple-50 rounded-full" />
        </div>
      </div>
    </div>
  );
}