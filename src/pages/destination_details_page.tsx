import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  TravelSeasonLabels,
  type TravelPeriod,
} from "../models/travel_periods";
import NavBar from "../components/landingPage/nav_bar";
import Footer from "../components/landingPage/footer";
import { Button } from "../components/wishlist/ui/button";
import { Copy } from "lucide-react";
import useDestination from "../hooks/use_destinations";
import { type DestinationClientView } from "../models/destination_client";
import type { ClientDescription } from "../models/description_client";
import { unslugify } from "../utils/summarize";

export default function DestinationDetailsPage() {
  const locationHook = useLocation();
  const {
    title,
    titleImage,
    priceRange,
    categories,
    tags,
    description,
    safetyLevels,
    currency,
    bestTimeToVisit,
    timeZone,
    languages,
    cities,
  } = locationHook.state || {};
  const { id } = useParams();

  const { destination, loading } = useDestination({ id: id});
  const destinationInfo = destination ?? {
    destinationName: title,
    destinationImage: titleImage,
    description: description as ClientDescription,
    bestPeriodToVisit: bestTimeToVisit as TravelPeriod[],
    costRange: priceRange,
    safetyLevel: safetyLevels,
    timeZone: timeZone,
    countryName: "",
    tags: tags,
    categories: categories,
    languages: languages,
    currencies: currency,
    cities: cities,
  };

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [copied, setCopied] = useState(false);

  const tabs = [
    "Overview",
    "Local Perspective",
    "Directions",
    "What To Know",
    "Things To Be Wary Of",
    "Hidden Cost",
  ];

  const priceArray = destinationInfo.costRange?.split("-") || ["0", "0"];

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const goToDestination = (name: string) => {
    navigate(`/destination/${name}`, {
      state: { destinationName: name },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (!id)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <p className="text-xl text-gray-400 font-medium">Invalid Route.</p>
      </motion.div>
    );
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white">
        <div className="py-5 px-4 md:px-10">
          <NavBar />
        </div>
        <DestinationDetailsSkeleton />
        <Footer />
      </div>
    );
  }
  if (!destination)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <p className="text-xl text-gray-400 font-medium">Not Found.</p>
      </motion.div>
    );
  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-white">
      <div className="py-5 px-4 md:px-10">
        <NavBar />
      </div>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-10 text-black"
      >
        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* IMAGE GALLERY AREA */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col gap-4"
          >
            <div className="relative group overflow-hidden rounded-3xl shadow-xl">
              <img
                src={destinationInfo.destinationImage}
                alt={destinationInfo.destinationName}
                className="w-full h-75 md:h-125 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[destinationInfo.destinationImage].map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-transparent hover:border-purple-500 cursor-pointer transition-all"
                />
              ))}
            </div>
          </motion.div>

          {/* DESTINATION INFO */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col gap-6"
          >
            <div>
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 my-2"
              >
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
                  {destinationInfo.destinationName}
                </h1>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-2 px-8 h-14 md:h-12 rounded-full bg-black/60! backdrop-blur-md border-white/20 md:border-foreground/20 text-white md:text-foreground hover:bg-white md:hover:bg-foreground md:hover:text-background transition-all w-full sm:w-auto"
                >
                  <Copy className="w-5 h-5" />
                  {copied ? "Link Copied!" : "Share This Trip"}
                </Button>
              </motion.div>

              <p className="text-purple-600 font-medium tracking-wide uppercase text-sm">
                {cities?.[0] || "Explore Destination"}
              </p>
            </div>

            {/* TAGS CLOUD */}
            <div className="flex flex-wrap gap-2">
              {[...destinationInfo.tags, ...destinationInfo.categories].map(
                (item, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>

            {/* QUICK STATS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-3xl">
              <Stat
                label="Best Period"
                value={destinationInfo.bestPeriodToVisit
                  ?.map((item: TravelPeriod) => TravelSeasonLabels[item])
                  .join(", ")}
              />
              <Stat
                label="Cost Range"
                value={`$${priceArray[0]} - $${priceArray[1]}`}
              />
              <Stat
                label="Safety Level"
                value={`${destinationInfo.safetyLevel}/10`}
              />
              <Stat label="Timezone" value={destinationInfo.timeZone} />
            </div>

            {/* EXTRA INFO BITS */}
            <div className="space-y-4 pt-4 border-t border-gray-100 text-sm">
              <p>
                <span className="text-gray-400 font-medium">Languages:</span>{" "}
                {destinationInfo.languages?.join(", ")}
              </p>
              <p>
                <span className="text-gray-400 font-medium">Currencies:</span>{" "}
                {destinationInfo.currencies?.join(", ")}
              </p>
              <p>
                <span className="text-gray-400 font-medium">Major Cities:</span>{" "}
                {destinationInfo.cities?.join(", ")}
              </p>
            </div>
          </motion.div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="mt-16 relative">
          <div className="flex gap-8 overflow-x-auto pb-4 border-b border-gray-100 scrollbar-hide no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative whitespace-nowrap text-sm font-bold transition-colors ${
                  activeTab === tab
                    ? "text-purple-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-4.25 left-0 right-0 h-1 bg-purple-600 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ANIMATED TAB CONTENT */}
        <div className="mt-10 min-h-75">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="prose prose-purple max-w-none text-gray-700 leading-relaxed"
            >
              {getContent(activeTab, destinationInfo.description)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* NEARBY SECTION */}
        <div className="mt-20 pt-10 border-t border-gray-100">
          <h2 className="text-2xl font-bold mb-6">Nearby Complements</h2>
          <div className="flex flex-wrap gap-4">
            {destinationInfo.description?.nearbyComplements?.map(
              (place: string) => (
                <motion.button
                  key={place}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => goToDestination(place)}
                  className="px-6 py-3 text-gray-400 bg-white border border-gray-200 rounded-2xl font-semibold hover:border-purple-500 hover:text-purple-600 transition-all shadow-sm"
                >
                  {place}
                </motion.button>
              ),
            )}
          </div>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
}

// Helper Components & Logic
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
        {label}
      </span>
      <span className="font-bold text-gray-900 line-clamp-1">{value}</span>
    </div>
  );
}

function getContent(activeTab: string, description: any) {
  const keyMap: Record<string, string> = {
    Overview: "overview",
    "Local Perspective": "localPerspective",
    Directions: "directions",
    "What To Know": "whatToKnow",
    "Things To Be Wary Of": "thingsToBeWaryOf",
    "Hidden Cost": "hiddenCost",
  };

  const content = description?.[keyMap[activeTab]];
  if (!content)
    return <p className="italic text-gray-400">No information available.</p>;

  return content.split(/\n|\t/).map((text: string, index: number) => (
    <p key={index} className="mb-4">
      {text}
    </p>
  ));
}

function DestinationDetailsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-10 animate-pulse">
      {/* HERO SECTION SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* IMAGE AREA */}
        <div className="flex flex-col gap-4">
          <div className="w-full h-75 md:h-125 bg-gray-200 rounded-3xl" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-20 h-20 md:w-24 md:h-24 bg-gray-200 rounded-2xl"
              />
            ))}
          </div>
        </div>

        {/* INFO AREA */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="h-12 w-2/3 bg-gray-200 rounded-lg" />
            <div className="h-12 w-32 bg-gray-200 rounded-full" />
          </div>

          <div className="h-4 w-24 bg-purple-100 rounded" />

          {/* TAGS */}
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-20 bg-gray-100 rounded-full" />
            ))}
          </div>

          {/* QUICK STATS */}
          <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-3xl">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-5 w-24 bg-gray-300 rounded" />
              </div>
            ))}
          </div>

          {/* INFO BITS */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      {/* TABS SKELETON */}
      <div className="mt-16 flex gap-8 border-b border-gray-100 pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 w-20 bg-gray-200 rounded" />
        ))}
      </div>

      {/* CONTENT SKELETON */}
      <div className="mt-10 space-y-4">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
