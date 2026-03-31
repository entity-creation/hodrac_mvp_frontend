import { useState } from "react";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import useScreenSize from "../../hooks/use_screen_size";
import useCategories from "../../hooks/use_Categories";
import { useTags } from "../../hooks/use_tags";
import useCountry from "../../hooks/use_country";
import { TravelSeasonLabels, type TravelPeriod } from "../../models/travel_periods";
import type { FilterQuery } from "../../models/filter_query";

interface Props {
  onFilter: (filters: FilterQuery) => void;
  initialFilters: FilterQuery
}
export function FilterBox({initialFilters, onFilter: onFilter} : Props) {
  const [openDropdownId, setOpenDropdownId] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const screenSize = useScreenSize();
  const { categories } = useCategories();
  const { tags } = useTags();
  const { countries } = useCountry();
  const categoriesList = categories.map((c) => c.categoryName);
  const tagList = tags.map((t) => t.tagName);
  const countryList = countries.map((c) => c.countryName);
  const [filters, setFilters] = useState<FilterQuery>(initialFilters);

  const updateOpendropdownId = (id: number) => {
    if (id == openDropdownId) {
      setOpenDropdownId(-1);
    } else {
      setOpenDropdownId(id);
    }
  };

  return (
    <>
      <div className="bg-white/90 flex flex-col z-20 w-3/4 rounded-2xl items-center py-5">
        <div className="flex-col lg:grid lg:grid-cols-3 gap-x-30 relative">
          <div>
            <p className="text-black/40">Country:</p>
            <FilterDropdown
              dropdownList={countryList}
              defaultLabel="Add a Country"
              id={1}
              selectedValue={filters.country || ""}
              onSelect={(value) => setFilters(prev => ({...prev, country: value}))}
              openDropdownId={openDropdownId}
              requestOpen={() => {
                updateOpendropdownId(1);
              }}
            />
          </div>
          <div>
            <p className="text-black/40">Best Period to Visit:</p>
            <FilterDropdown
              dropdownList={Object.keys(TravelSeasonLabels) as TravelPeriod[]}
              defaultLabel="Select Period"
              id={2}
              selectedValue={ TravelSeasonLabels[filters.bestPeriodToVisit as TravelPeriod]}
              onSelect={(value) => setFilters(prev => ({...prev, bestPeriodToVisit: value as TravelPeriod}))}
              openDropdownId={openDropdownId}
              requestOpen={() => {
                updateOpendropdownId(2);
              }}
            />
          </div>
          <div
            className={`${showFilters || screenSize.width >= 1024 ? "flex-col visible" : "hidden invisible "}`}
          >
            <p className="text-black/40">Price Range:</p>
            <p className="text-black/40">
              {filters.priceRange?.[0] || 0} - {filters.priceRange?.[1] || 1000}
            </p>
            <FilterSlider
              maxRange={10000}
              onRangeChange={(values) => setFilters(prev => ({...prev, priceRange: values}))}
              step={5}
            />
          </div>
          <div
            className={`${showFilters || screenSize.width >= 1024 ? "flex-col visible" : "hidden invisible "}`}
          >
            <p className="text-black/40">Category:</p>
            <FilterDropdown
              dropdownList={categoriesList}
              defaultLabel="Add a Category"
              id={3}
              selectedValue={filters.categories || ""}
              onSelect={(value) => setFilters(prev => ({...prev, categories: value}))}
              openDropdownId={openDropdownId}
              requestOpen={() => {
                updateOpendropdownId(3);
              }}
            />
          </div>
          <div
            className={`${showFilters || screenSize.width >= 1024 ? "flex-col visible" : "hidden invisible "}`}
          >
            <p className="text-black/40">Tag:</p>
            <FilterDropdown
              dropdownList={tagList}
              defaultLabel="Add a Tag"
              id={4}
              selectedValue={filters.tags || ""}
              onSelect={(value) => setFilters(prev => ({...prev, tags: value}))}
              openDropdownId={openDropdownId}
              requestOpen={() => {
                updateOpendropdownId(4);
              }}
            />
          </div>

          <div
            className={`${showFilters || screenSize.width >= 1024 ? "flex-col visible" : "hidden invisible "}`}
          >
            <p className="text-black/40">Safety Level:</p>
            <p className="text-black/40">
              {filters.safetyLevel?.[0] || 0} - {filters.safetyLevel?.[1] || 10}
            </p>
            <FilterSlider
              maxRange={10}
              onRangeChange={(values) => setFilters(prev => ({...prev, safetyLevel: values}))}
              step={1}
            />
          </div>
        </div>
        <p
          className="text-black/40 cursor-pointer hover:text-black lg:hidden lg:invisible mb-5"
          onClick={() => {
            setShowFilters(!showFilters);
          }}
        >
          {showFilters ? "Hide Filters" : "Show More Filters"}
        </p>
        <button onClick={() => onFilter(filters)} className="w-fit p-1">Filter</button>
      </div>
    </>
  );
}

interface DropdownProps {
  dropdownList: string[];
  defaultLabel: string;
  selectedValue: string;
  id: number;
  openDropdownId: number;
  requestOpen: (id: number) => void;
  onSelect: (value: string) => void;
}
export function FilterDropdown({
  dropdownList,
  defaultLabel,
  id,
  openDropdownId,
  selectedValue,
  requestOpen,
  onSelect,
}: DropdownProps) {
  //   const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <>
      <div className="flex flex-col space-y-10 relative">
        <div
          className="w-50 h-fit px-5 py-2 flex justify-center text-black rounded-md shadow-gray-400 shadow-md hover:bg-black/20 hover:text-white cursor-pointer"
          onClick={() => requestOpen(id)}
        >
          {selectedValue || defaultLabel}
        </div>
        <div
          className={`bg-white absolute left-0 top-20 h-50 overflow-auto text-black transition-all ease-out duration-200 rounded-md shadow-gray-400 shadow-md cursor-pointer py-2${
            id == openDropdownId
              ? "flex flex-col bg-white pointer-events-auto opacity-100 translate-y-0 z-40"
              : "invisible hidden pointer-events-none opacity-0 -translate-y-3"
          }`}
        >
          {dropdownList.map((item) => (
            <div
              className="hover:bg-black/20 hover:text-white px-5 "
              key={dropdownList.indexOf(item)}
              onClick={() => onSelect(item)}
            >
              {defaultLabel == "Select Period" ? TravelSeasonLabels[item as TravelPeriod] : item}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

interface SliderProps {
  maxRange: number;
  step: number;
  onRangeChange: (values: [number, number]) => void;
}
export function FilterSlider({
  maxRange,
  onRangeChange: onRangeChange,
  step,
}: SliderProps) {
  return (
    <>
      <div className="pb-10">
        <RangeSlider
          className=""
          min={0}
          max={maxRange}
          step={step}
          onInput={(event) => onRangeChange([event[0], event[1]])}
        />
      </div>
    </>
  );
}
