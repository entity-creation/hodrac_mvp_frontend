import { FaFontAwesomeFlag } from "react-icons/fa";
import { BsArrowRightShort } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import type { FilterQuery } from "../../models/filter_query";
import { ROUTES } from "../../utils/routes";

interface Props {
  countryName: string;
  destinationCount: number;
  bgImage: string;
}

export function TopCountries() {
  const demoCountries = [
    {
      Country: "Canada",

      Destination: ["Banff", "Church of NotreDame", "Some other place"],
    },
    {
      Country: "United States",
      Destination: ["Banff", "Church of NotreDame", "Some other place"],
    },
    {
      Country: "Spain",
      Destination: ["Banff", "Church of NotreDame", "Some other place"],
    },
    {
      Country: "Ghana",
      Destination: ["Banff", "Church of NotreDame", "Some other place"],
    },
    {
      Country: "Dubai",
      Destination: ["Banff", "Church of NotreDame", "Some other place"],
    },
    {
      Country: "Qatar",
      Destination: ["Banff", "Church of NotreDame", "Some other place"],
    },
    {
      Country: "Mexico",
      Destination: ["Banff", "Church of NotreDame", "Some other place"],
    },
    {
      Country: "New Zealand",
      Destination: ["Banff", "Church of NotreDame", "Some other place"],
    },
  ];
  return (
    <>
      <div className="flex flex-col items-center h-full w-full text-black my-20">
        <div
          className="flex flex-col gap-y-1 justify-center w-4/5 mb-20"
          id="text"
        >
          <h2 className="text-center font-bold text-[min(10vw,40px)]">
            Explore Top Searched Countries
          </h2>
          <p className="text-center text-black/40">
            Discover the world’s top trending countries to visit right now, with
            experiences for every kind of traveler from thrilling adventures to
            peaceful escapes.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-y-10 h-fit md:grid md:grid-cols-3 lg:grid-cols-4 gap-10 w-full">
        {demoCountries.map((country) => (
          <TopCountry
            countryName={country.Country}
            destinationCount={country.Destination.length}
            bgImage="/images/globe.jpg"
            key={country.Country}
          />
        ))}
      </div>
      <div className="flex justify-center text-black/40 w-full my-20 hover:text-black hover:cursor-pointer">Explore more...</div>
    </>
  );
}

export function TopCountry({ countryName, destinationCount, bgImage }: Props) {
  const navigate = useNavigate();
  return (
    <>
      <div className="border-gray-200 border rounded-md p-2 bg-black/1 cursor-pointer" id="top-countries" onClick={() =>
                      navigate(ROUTES.PUBLIC.EXPLORETRIPS, {
                        state: { filters: { country: countryName } as FilterQuery },
                      })
                    }>
        <div className="flex gap-x-5">
          <div
            className={`w-15 h-15 rounded-full bg-[url('${bgImage}')] bg-no-repeat bg-center bg-cover`}
          ></div>
          <div className="flex flex-col gap-y-0.1">
            <p className="font-bold text-black">{countryName}</p>
            <span className="flex gap-x-1 items-center text-black/50">
              <FaFontAwesomeFlag />{" "}
              <p className="text-center">
                {destinationCount.toString()} Destinations
              </p>
            </span>
          </div>
        </div>
        <div className="flex justify-end">
          {" "}
          <button className="h-6! w-6! rounded-full! bg-black/10! flex items-center justify-center p-0! m-01 hover-sm">
            <BsArrowRightShort />
          </button>
        </div>
      </div>
    </>
  );
}
