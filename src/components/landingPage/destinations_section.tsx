import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import type { FilterQuery } from "../../models/filter_query";

export default function DestinationSection() {
  const navigate = useNavigate();
  return (
    <>
      <div className="w-full  my-20 flex flex-col gap-y-30">
        <div className="flex flex-col items-end text-black">
          <p>-You think you have seen it all? Who decided that?</p>
          <p>
            -Explore curated tourist spots, hidden gems, and real traveler
            wishlists
          </p>
        </div>
        <div className="flex flex-col items-center gap-y-10 md:grid md:grid-cols-3 md:gap-10">
          <div className="max-md:w-2/3 relative group flex justify-center items-center h-65 bg-[url('/images/destinations.jpg')] bg-cover bg-center bg-no-repeat text-center cursor-pointer rounded-2xl">
            <div
              className="z-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 absolute inset-0 rounded-2xl bg-black/30"
              onClick={() =>
                navigate(ROUTES.PUBLIC.EXPLORETRIPS, {
                  state: { filters: { tags: "Local Favorite" } as FilterQuery },
                })
              }
            ></div>
            <p className="z-10 transition-colors duration-300 text-white/50 text-2xl text-center group-hover:text-white">
              Local Favorite
            </p>
          </div>
          <div className="max-md:w-2/3 relative group flex justify-center items-center h-65 bg-[url('/images/tourist.jpg')] bg-cover bg-center bg-no-repeat text-center cursor-pointer rounded-2xl" onClick={() =>
                navigate(ROUTES.PUBLIC.EXPLORETRIPS, {
                  state: { filters: { tags: "Tourist Hotspot" } as FilterQuery },
                })
              }>
            <div className="z-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 absolute inset-0 rounded-2xl bg-black/30"></div>
            <p className="z-10 transition-colors duration-300 text-white/50 text-2xl text-center group-hover:text-white">
              Tourist Hotspots
            </p>
          </div>
          <div className="max-md:w-2/3 relative group flex justify-center items-center h-65 bg-[url('/images/hidden.jpg')] bg-cover bg-center bg-no-repeat text-center cursor-pointer rounded-2xl" onClick={() =>
                navigate(ROUTES.PUBLIC.EXPLORETRIPS, {
                  state: { filters: { tags: "Hidden Gem" } as FilterQuery },
                })
              }>
            <div className="z-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 absolute inset-0 rounded-2xl bg-black/30"></div>
            <p className="z-10 transition-colors duration-300 text-white/50 text-2xl text-center group-hover:text-white">
              Hidden Gem
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
