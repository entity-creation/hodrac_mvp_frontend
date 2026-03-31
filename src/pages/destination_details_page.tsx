import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ClientDescription } from "../models/description_client";
import {
  TravelSeasonLabels,
  type TravelPeriod,
} from "../models/travel_periods";
import NavBar from "../components/landingPage/nav_bar";

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
  } = locationHook.state;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const goToDestination = (name: string) => {
    navigate(`/destination/${name}`, {
      state: { destinationName: name },
    });
  };

  const tabs = [
    "Overview",
    "Local Perspective",
    "Directions",
    "What To Know",
    "Things To Be Wary Of",
    "hidden Cost",
  ];

  const priceArray = (priceRange as string).split("-");

  return (
   <div className="w-screen h-screen overflow-x-hidden bg-white py-5 px-10">
    <NavBar/>
     <div className="mx-auto px-6 py-10 text-black">
      {/* HERO SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* IMAGE */}
        <div>
          <img
            src={titleImage}
            className="w-full h-105 object-cover rounded-xl"
          />

          {/* Thumbnails (optional future images) */}
          <div className="flex gap-3 mt-4">
            <img
              src={titleImage}
              className="w-20 h-20 rounded-lg object-cover border"
            />
          </div>
        </div>

        {/* DESTINATION INFO */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">{title}</h1>

          <p className="text-gray-500">{title}</p>

          {/* TAGS */}
          <div className="flex flex-wrap gap-2">
            {(tags as string[]).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(categories as string[]).map((category) => (
              <span
                key={category}
                className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
              >
                {category}
              </span>
            ))}
          </div>

          {/* META INFO */}
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-gray-500">Best Period</p>
              <p className="font-medium">
                {bestTimeToVisit
                  .map((item: TravelPeriod) => TravelSeasonLabels[item])
                  .join(", ")}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Cost Range</p>
              <p className="font-medium">{`$${priceArray[0]} - $${priceArray[1]}`}</p>
            </div>

            <div>
              <p className="text-gray-500">Safety Level</p>
              <p className="font-medium">{safetyLevels}/10</p>
            </div>

            <div>
              <p className="text-gray-500">Timezone</p>
              <p className="font-medium">{timeZone}</p>
            </div>
          </div>

          {/* EXTRA INFO */}
          <div className="mt-6 space-y-3 text-sm">
            <div>
              <span className="font-semibold">Languages: </span>
              {languages.join(", ")}
            </div>

            <div>
              <span className="font-semibold">Currencies: </span>
              {currency.join(", ")}
            </div>

            <div>
              <span className="font-semibold">Cities: </span>
              {cities.join(", ")}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="mt-12 border-b flex gap-6 text-sm font-medium pb-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize ${
              activeTab === tab
                ? "border-b-2 text-white"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="mt-6 text-gray-700 leading-relaxed max-w-3xl">
        {activeTab === "Overview" && <p>{description?.overview}</p>}

        {activeTab === "Local Perspective" && (
          <p>{description?.localPerspective}</p>
        )}

        {activeTab === "Directions" && <p>{description?.directions}</p>}

        {activeTab === "What To Know" && <p>{description?.whatToKnow}</p>}

        {activeTab === "Things To Be Wary Of" && (
          <p>{description?.thingsToBeWaryOf}</p>
        )}

        {activeTab === "hiddenCost" && <p>{description?.hiddenCost}</p>}
      </div>

      {/* NEARBY COMPLEMENTS */}
      <div className="mt-14">
        <h2 className="text-xl font-semibold mb-4">Nearby Complements</h2>

        <div className="flex flex-wrap gap-3">
          {(description as ClientDescription)?.nearbyComplements.map(
            (place) => (
              <button
                key={place}
                onClick={() => goToDestination(place)}
                className="px-4 py-2 border rounded-lg hover:bg-purple-50 transition"
              >
                {place}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
   </div>
  );
}
