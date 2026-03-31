import { useEffect, useState } from "react";
import ExploreHeroSection from "../components/exploreTripsPage/explore_hero_section";
import TripCard from "../components/exploreTripsPage/trip_card";
import Footer from "../components/landingPage/footer";
import NavBar from "../components/landingPage/nav_bar";
import useDestination from "../hooks/use_destinations";
import type { FilterQuery } from "../models/filter_query";
import { useLocation } from "react-router-dom";
import type { ClientDescription } from "../models/description_client";
const baseUrl = import.meta.env.VITE_PROD_BACKEND_ROOT_URL;

export default function ExploreTripsPage() {
  var location = useLocation();
  const initialFilters = location?.state?.filters;
  const [filters, setFilters] = useState<FilterQuery>(
    initialFilters || {
      country: "",
      safetyLevel: [0, 10],
      categories: "",
      tags: "",
      priceRange: [0, 1000],
    },
  );

  const { destinations } = useDestination(filters);
  useEffect(() => {
    console.log(filters);
  }, [filters]);

  // const demoTripDetails = [
  //   {
  //     title: "Taj Mahal",
  //     titleImage: "images/destinations.jpg",
  //     location: "India",
  //     priceRange: [200, 1000],
  //     categories: ["Temple", "Religious", "Palace"],
  //     tags: ["Tourist destination", "Popular", "User Favourite"],
  //     description:
  //       "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam repellendus, saepe est impedit autem ex!",
  //     safetyLevels: 4,
  //     currency: ["RUPEES", "USD"],
  //     bestTimeToVisit: "Winter",
  //     timeZone: "IST",
  //     languages: ["Hindi", "English", "Tamil"],
  //   },
  //   {
  //     title: "Taj Mahal",
  //     titleImage: "images/destinations.jpg",
  //     location: "India",
  //     priceRange: [200, 1000],
  //     categories: ["Temple", "Religious", "Palace"],
  //     tags: ["Tourist destination", "Popular", "User Favourite"],
  //     description:
  //       "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam repellendus, saepe est impedit autem ex!",
  //     safetyLevels: 4,
  //     currency: ["RUPEES", "USD"],
  //     bestTimeToVisit: "Winter",
  //     timeZone: "IST",
  //     languages: ["Hindi", "English", "Tamil"],
  //   },
  //   {
  //     title: "Taj Mahal",
  //     titleImage: "images/destinations.jpg",
  //     location: "India",
  //     priceRange: [200, 1000],
  //     categories: ["Temple", "Religious", "Palace"],
  //     tags: ["Tourist destination", "Popular", "User Favourite"],
  //     description:
  //       "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam repellendus, saepe est impedit autem ex!",
  //     safetyLevels: 4,
  //     currency: ["RUPEES", "USD"],
  //     bestTimeToVisit: "Winter",
  //     timeZone: "IST",
  //     languages: ["Hindi", "English", "Tamil"],
  //   },
  //   {
  //     title: "Taj Mahal",
  //     titleImage: "images/destinations.jpg",
  //     location: "India",
  //     priceRange: [200, 1000],
  //     categories: ["Temple", "Religious", "Palace"],
  //     tags: ["Tourist destination", "Popular", "User Favourite"],
  //     description:
  //       "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam repellendus, saepe est impedit autem ex!",
  //     safetyLevels: 4,
  //     currency: ["RUPEES", "USD"],
  //     bestTimeToVisit: "Winter",
  //     timeZone: "IST",
  //     languages: ["Hindi", "English", "Tamil"],
  //   },
  // ];
  return (
    <>
      <div className="w-screen h-screen overflow-x-hidden">
        <div className="py-5 px-10 w-full flex flex-col items-start bg-white ">
          <NavBar />
          <ExploreHeroSection initialFilters={filters} onFilter={setFilters} />
          <div className="flex w-full justify-center my-20">
            <div className="grid grid-cols-3 gap-10 ">
              {destinations.map((trip) => {
                return (
                  <TripCard
                    title={trip.destinationName}
                    titleImage={baseUrl + trip.destinationImage}
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
                );
              })}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
