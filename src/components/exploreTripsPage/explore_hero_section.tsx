import type { FilterQuery } from "../../models/filter_query";
import { FilterBox } from "./filter_box";

interface Props {
  onFilter: (filters: FilterQuery) => void;
  initialFilters: FilterQuery
}

export default function ExploreHeroSection({onFilter, initialFilters} : Props) {
  return (
    <>
      <div className="relative flex flex-col shrink-0 space-y-30  w-full h-fit py-20 rounded-3xl mt-10 bg-[url('/images/globe.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 top-0 bg-blue-900/30 h-full rounded-3xl z-0"></div>
        <h2 className="text-white font-semibold text-left z-10 text-[min(10vw,30px)] pl-10">
          <span className="text-[min(10vw,40px)]">
            Discover the best place for you.
          </span>{" "}
          <span className="block">Welcome to your portal to the world</span>
        </h2>
        <div className="w-full h-fit flex justify-center">
            <FilterBox onFilter={onFilter} initialFilters={initialFilters}/>
        </div>
      </div>
    </>
  );
}
