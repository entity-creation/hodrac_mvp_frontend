import { IoLocationOutline } from "react-icons/io5";
import { summarizeArray, summarizeText } from "../../utils/summarize";
import {
  type TravelPeriod,
} from "../../models/travel_periods";
import type { ClientDescription } from "../../models/description_client";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/routes";

interface TripProps {
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

export default function TripCard({
  title,
  titleImage,
  location,
  priceRange,
  categories,
  tags,
  overview,
  description,
  safetyLevels,
  currency,
  bestTimeToVisit,
  timeZone,
  languages,
  cities,
}: TripProps) {
  const priceArray = priceRange.split("-");
  const navigate = useNavigate();
  const goToDetails = () => {
    navigate(ROUTES.PUBLIC.DESTINATIONDETAILS, {
      state: {
        titleImage: titleImage,
        title: title,
        location: location,
        priceRange: priceRange,
        categories: categories,
        tags: tags,
        overview: overview,
        safetyLevels: safetyLevels,
        currency: currency,
        bestTimeToVisit: bestTimeToVisit,
        timeZone: timeZone,
        languages: languages,
        description: description,
        cities: cities,
      },
    });
  };
  return (
    <>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-white text-black shadow-md flex flex-col">
        {/* Image Section (≈30%) */}
        <div className="h-48 w-full">
          <img
            src={titleImage}
            alt={title}
            className="h-full w-full object-cover rounded-t-2xl"
          />
        </div>

        {/* Name & Location */}
        <div className="p-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <IoLocationOutline className="mr-1 text-red-500" />
            <span>{location}</span>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Tags & Price */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-wrap gap-2 w-2/3">
              {summarizeArray(tags).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 w-2/3">
              {summarizeArray(categories).map((category) => (
                <span
                  key={category}
                  className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          <span className="text-sm font-semibold text-gray-700">
            {"$" + priceArray[0] + " - " + "$" + priceArray[1]}
          </span>
        </div>

        <hr className="border-gray-200" />

        {/* Description */}
        <div className="p-4 text-sm text-gray-600">
          {summarizeText(overview)}
        </div>

        {/* Button */}
        <div className="p-4 flex justify-center mt-auto">
          <button onClick={goToDetails} className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition">
            View Details
          </button>
        </div>
      </div>
    </>
  );
}
