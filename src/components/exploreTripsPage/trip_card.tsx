import { motion } from "framer-motion";
import { IoLocationOutline } from "react-icons/io5";
import { slugify, summarizeArray, summarizeText } from "../../utils/summarize";
import { type TravelPeriod } from "../../models/travel_periods";
import type { ClientDescription } from "../../models/description_client";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/routes";

interface TripProps {
  id: string;
  titleImage: string;
  title: string;
  location: string;
  priceRange: string;
  categories: string[];
  tags: string[];
  overview: string;
  safetyLevels: number;
  currency: string[];
  bestTimeToVisit: TravelPeriod[];
  timeZone: string;
  languages: string[];
  description: ClientDescription;
  cities: string[];
}

export default function TripCard(props: TripProps) {
  const { title, titleImage, location, priceRange, categories, tags, overview } = props;
  const priceArray = priceRange.split("-");
  const navigate = useNavigate();

  const goToDetails = () => {
    navigate(`${ROUTES.PUBLIC.DESTINATIONDETAILS}/${props.id}/${slugify(title)}`, {
      state: { ...props },
    });
  };

  return (
    <motion.div
      // Entry Animation
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      // Interaction Animation
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-white text-black shadow-md flex flex-col h-full border border-gray-100"
    >
      {/* Image Section (Animated scale on hover) */}
      <div className="h-48 w-full overflow-hidden relative">
        <motion.img
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.5 }}
          src={titleImage}
          alt={title}
          className="h-full w-full object-cover rounded-t-2xl"
        />
        {/* Subtle price badge for better mobile scannability */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg md:hidden">
          ${priceArray[0]} - ${priceArray[1]}
        </div>
      </div>

      {/* Name & Location */}
      <div className="p-4 md:p-5">
        <h3 className="text-lg md:text-xl font-semibold truncate">{title}</h3>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <IoLocationOutline className="mr-1 text-red-500 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Tags & Price */}
      <div className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-col gap-y-2 w-full md:w-2/3">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {summarizeArray(tags, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] md:text-xs px-2 py-1 bg-gray-100 rounded-full whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
          </div>
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {summarizeArray(categories, 3).map((category) => (
              <span
                key={category}
                className="text-[10px] md:text-xs px-2 py-1 bg-gray-50 rounded-full whitespace-nowrap"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        <span className="hidden md:block text-sm font-semibold text-gray-700">
          {"$" + priceArray[0] + " - " + "$" + priceArray[1]}
        </span>
      </div>

      <hr className="border-gray-100" />

      {/* Description (improved line-clamping) */}
      <div className="p-4 md:p-5 text-sm text-gray-600 line-clamp-3 md:line-clamp-none">
        {summarizeText(overview)}
      </div>

      {/* Button */}
      <div className="p-4 md:p-5 flex justify-center mt-auto">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={goToDetails}
          className="w-full md:w-auto px-8 py-2.5 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-sm"
        >
          View Details
        </motion.button>
      </div>
    </motion.div>
  );
}