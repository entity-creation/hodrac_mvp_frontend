import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExploreHeroSection from "../components/exploreTripsPage/explore_hero_section";
import TripCard from "../components/exploreTripsPage/trip_card";
import Footer from "../components/landingPage/footer";
import NavBar from "../components/landingPage/nav_bar";
import useDestination from "../hooks/use_destinations";
import type { FilterQuery } from "../models/filter_query";
import { useLocation } from "react-router-dom";
import type { ClientDescription } from "../models/description_client";

// Animation variant for the grid container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Each card follows the other by 0.1s
    },
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
      {/* Header & Hero */}
      <div className="py-5 px-4 md:px-10 w-full flex flex-col items-center">
        <NavBar />
        <ExploreHeroSection initialFilters={filters} onFilter={setFilters} />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-10 mb-20">
        <div className="flex flex-col items-center md:items-start my-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Available Destinations
          </h2>
          <p className="text-gray-500">
            Showing {destinations.length} places based on your filters
          </p>
        </div>

        {/* Responsive Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(filters)} // Reset animation when filters change
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
        </AnimatePresence>

        {/* Empty State */}
        {destinations.length === 0 && (
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