import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  initialFilters: FilterQuery;
}

export function FilterBox({ initialFilters, onFilter }: Props) {
  const [openDropdownId, setOpenDropdownId] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const screenSize = useScreenSize();
  
  const { countries } = useCountry();
  const { categories } = useCategories();
  const { tags } = useTags();

  const [filters, setFilters] = useState<FilterQuery>(initialFilters);

  const countryList = countries.map((c) => c.countryName);
  const categoriesList = categories.map((c) => c.categoryName);
  const tagList = tags.map((t) => t.tagName);

  const toggleDropdown = (id: number) => {
    setOpenDropdownId(openDropdownId === id ? -1 : id);
  };

  const isMobile = screenSize.width < 1024;

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/95 backdrop-blur-md shadow-2xl flex flex-col z-20 w-[95%] md:w-3/4 rounded-3xl items-center p-6 md:p-8 border border-gray-100"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {/* Core Filters (Always Visible) */}
        <FilterWrapper label="Country">
          <FilterDropdown
            dropdownList={countryList}
            defaultLabel="Add a Country"
            id={1}
            selectedValue={filters.country || ""}
            onSelect={(val: any) => setFilters(prev => ({ ...prev, country: val }))}
            openDropdownId={openDropdownId}
            requestOpen={toggleDropdown}
          />
        </FilterWrapper>

        <FilterWrapper label="Best Period to Visit">
          <FilterDropdown
            dropdownList={Object.keys(TravelSeasonLabels) as TravelPeriod[]}
            defaultLabel="Select Period"
            id={2}
            selectedValue={TravelSeasonLabels[filters.bestPeriodToVisit as TravelPeriod]}
            onSelect={(val: string) => setFilters(prev => ({ ...prev, bestPeriodToVisit: val as TravelPeriod }))}
            openDropdownId={openDropdownId}
            requestOpen={toggleDropdown}
          />
        </FilterWrapper>

        {/* Collapsible Filters */}
        <AnimatePresence>
          {(showFilters || !isMobile) && (
            <motion.div
              initial={isMobile ? { height: 0, opacity: 0 } : { opacity: 1 }}
              animate={isMobile ? { height: "auto", opacity: 1 } : { opacity: 1 }}
              exit={isMobile ? { height: 0, opacity: 0 } : {}}
              className="contents" // Allows the children to participate in the parent grid
            >
              <FilterWrapper label={`Price Range: $${filters.priceRange?.[0] || 0} - $${filters.priceRange?.[1] || 1000}`}>
                <FilterSlider
                  maxRange={10000}
                  onRangeChange={(val: any) => setFilters(prev => ({ ...prev, priceRange: val }))}
                  step={50}
                />
              </FilterWrapper>

              <FilterWrapper label="Category">
                <FilterDropdown
                  dropdownList={categoriesList}
                  defaultLabel="Add a Category"
                  id={3}
                  selectedValue={filters.categories || ""}
                  onSelect={(val: any) => setFilters(prev => ({ ...prev, categories: val }))}
                  openDropdownId={openDropdownId}
                  requestOpen={toggleDropdown}
                />
              </FilterWrapper>

              <FilterWrapper label="Tag">
                <FilterDropdown
                  dropdownList={tagList}
                  defaultLabel="Add a Tag"
                  id={4}
                  selectedValue={filters.tags || ""}
                  onSelect={(val: any) => setFilters(prev => ({ ...prev, tags: val }))}
                  openDropdownId={openDropdownId}
                  requestOpen={toggleDropdown}
                />
              </FilterWrapper>

              <FilterWrapper label={`Safety Level: ${filters.safetyLevel?.[0] || 0} - ${filters.safetyLevel?.[1] || 10}`}>
                <FilterSlider
                  maxRange={10}
                  onRangeChange={(val: any) => setFilters(prev => ({ ...prev, safetyLevel: val }))}
                  step={1}
                />
              </FilterWrapper>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Toggle */}
      <button
        className="mt-6 text-blue-600 font-medium lg:hidden"
        onClick={() => setShowFilters(!showFilters)}
      >
        {showFilters ? "↑ Hide extra filters" : "↓ Show more filters"}
      </button>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onFilter(filters)}
        className="mt-8 bg-black text-white px-12 py-3 rounded-full font-bold shadow-lg hover:bg-gray-800 transition-all w-full md:w-auto"
      >
        Search Results
      </motion.button>
    </motion.div>
  );
}

/* Helper Components to Clean Up Code */

function FilterWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      {children}
    </div>
  );
}

export function FilterDropdown({
  dropdownList,
  defaultLabel,
  id,
  openDropdownId,
  selectedValue,
  requestOpen,
  onSelect,
}: any) {
  const isOpen = id === openDropdownId;

  return (
    <div className="relative w-full">
      <div
        className={`w-full h-12 px-4 flex items-center justify-between border rounded-xl cursor-pointer transition-all ${
          isOpen ? "border-black ring-1 ring-black" : "border-gray-200 hover:border-gray-400"
        }`}
        onClick={() => requestOpen(id)}
      >
        <span className="truncate">{selectedValue || defaultLabel}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>▼</motion.span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white border border-gray-100 shadow-xl rounded-xl z-50 py-2"
          >
            {dropdownList.map((item: string, idx: number) => (
              <div
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors text-sm"
                key={idx}
                onClick={() => {
                  onSelect(item);
                  requestOpen(-1);
                }}
              >
                {defaultLabel === "Select Period" ? TravelSeasonLabels[item as TravelPeriod] : item}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterSlider({ maxRange, onRangeChange, step }: any) {
  return (
    <div className="py-4 px-1">
      <RangeSlider
        min={0}
        max={maxRange}
        step={step}
        onInput={(e: any) => onRangeChange([e[0], e[1]])}
      />
    </div>
  );
}