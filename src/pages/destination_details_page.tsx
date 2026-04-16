import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  TravelSeasonLabels,
  type TravelPeriod,
} from "../models/travel_periods";
import NavBar from "../components/landingPage/nav_bar";
import Footer from "../components/landingPage/footer";

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

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");

  const tabs = [
    "Overview",
    "Local Perspective",
    "Directions",
    "What To Know",
    "Things To Be Wary Of",
    "Hidden Cost",
  ];

  const priceArray = (priceRange as string)?.split("-") || ["0", "0"];

  const goToDestination = (name: string) => {
    navigate(`/destination/${name}`, {
      state: { destinationName: name },
    });
  };

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
                src={titleImage}
                alt={title}
                className="w-full h-75 md:h-125 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[titleImage].map((img, i) => (
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
              <h1 className="text-4xl md:text-5xl font-extrabold mb-2">{title}</h1>
              <p className="text-purple-600 font-medium tracking-wide uppercase text-sm">{cities?.[0] || 'Explore Destination'}</p>
            </div>

            {/* TAGS CLOUD */}
            <div className="flex flex-wrap gap-2">
              {[...tags, ...categories].map((item, idx) => (
                <span
                  key={idx}
                  className="px-4 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100"
                >
                  {item}
                </span>
              ))}
            </div>

            {/* QUICK STATS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-3xl">
              <Stat label="Best Period" value={bestTimeToVisit?.map((item: TravelPeriod) => TravelSeasonLabels[item]).join(", ")} />
              <Stat label="Cost Range" value={`$${priceArray[0]} - $${priceArray[1]}`} />
              <Stat label="Safety Level" value={`${safetyLevels}/10`} />
              <Stat label="Timezone" value={timeZone} />
            </div>

            {/* EXTRA INFO BITS */}
            <div className="space-y-4 pt-4 border-t border-gray-100 text-sm">
              <p><span className="text-gray-400 font-medium">Languages:</span> {languages?.join(", ")}</p>
              <p><span className="text-gray-400 font-medium">Currencies:</span> {currency?.join(", ")}</p>
              <p><span className="text-gray-400 font-medium">Major Cities:</span> {cities?.join(", ")}</p>
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
                  activeTab === tab ? "text-purple-600" : "text-gray-400 hover:text-gray-600"
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
              {getContent(activeTab, description)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* NEARBY SECTION */}
        <div className="mt-20 pt-10 border-t border-gray-100">
          <h2 className="text-2xl font-bold mb-6">Nearby Complements</h2>
          <div className="flex flex-wrap gap-4">
            {description?.nearbyComplements?.map((place: string) => (
              <motion.button
                key={place}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => goToDestination(place)}
                className="px-6 py-3 text-gray-400 bg-white border border-gray-200 rounded-2xl font-semibold hover:border-purple-500 hover:text-purple-600 transition-all shadow-sm"
              >
                {place}
              </motion.button>
            ))}
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
      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">{label}</span>
      <span className="font-bold text-gray-900 line-clamp-1">{value}</span>
    </div>
  );
}

function getContent(activeTab: string, description: any) {
  const keyMap: Record<string, string> = {
    "Overview": "overview",
    "Local Perspective": "localPerspective",
    "Directions": "directions",
    "What To Know": "whatToKnow",
    "Things To Be Wary Of": "thingsToBeWaryOf",
    "Hidden Cost": "hiddenCost"
  };

  const content = description?.[keyMap[activeTab]];
  if (!content) return <p className="italic text-gray-400">No information available.</p>;

  return content.split(/\n|\t/).map((text: string, index: number) => (
    <p key={index} className="mb-4">{text}</p>
  ));
}