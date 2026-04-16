"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../utils/utils";
import type { ClientWishlistView } from "../../../models/wishlist_client";
import type { ItineraryDay, ItineraryItem } from "../../../models/itinerary_client";
import { summarizeText } from "../../../utils/summarize";

interface DayItem {
  day: ItineraryDay;
  activities: ItineraryItem[];
  isLast: boolean;
}

interface ItineraryProps {
  wishlist: ClientWishlistView;
}

function TimelineDay({ day, activities, isLast }: DayItem) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="relative flex gap-4 md:gap-12">
      {/* Timeline Visuals */}
      <div className="flex flex-col items-center">
        <motion.div 
          initial={false}
          animate={{ 
            backgroundColor: isOpen ? "var(--primary)" : "var(--muted)",
            scale: isOpen ? 1 : 0.9 
          }}
          className="flex h-10 w-10 md:h-16 md:w-16 items-center justify-center rounded-full text-white font-serif text-base md:text-xl font-medium shrink-0 z-10 shadow-sm"
        >
          {day.dayNumber}
        </motion.div>
        {!isLast && (
          <div className="w-px flex-1 bg-linear-to-b from-border to-transparent mt-2" />
        )}
      </div>

      {/* Content Area */}
      <div className={cn("flex-1 pb-10 md:pb-16")}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left group"
        >
          <h3 className="font-serif text-lg md:text-2xl lg:text-3xl text-white/60 group-hover:text-white/80 transition-colors pr-4">
            Day {day.dayNumber} — {day.dayTitle}
          </h3>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              <ul className="mt-6 space-y-4 md:space-y-6">
                {activities.map((activity, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3 md:gap-4 text-muted-foreground group/item"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0 mt-2.5 group-hover/item:bg-primary transition-colors" />
                    <span className="text-sm md:text-lg leading-relaxed">
                      {summarizeText(activity.itemDescription)}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ItinerarySection({ wishlist }: ItineraryProps) {
  const groupedActivities = useMemo(() => {
    const sortedDays = [...wishlist.itineraryDays].sort(
      (a, b) => a.dayNumber - b.dayNumber
    );

    return sortedDays.map((day) => ({
      ...day,
      activities: wishlist.itineraryItems
        .filter((item) => item.dayNumber === day.dayNumber)
        .sort((a, b) => a.itemOrderIndex - b.itemOrderIndex),
    }));
  }, [wishlist]);

  return (
    <section className="py-12 md:py-24 px-4 md:px-12 bg-white">
      <div className="mx-auto max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 md:mb-20"
        >
          <span className="text-[10px] md:text-sm uppercase tracking-[0.2em] text-primary font-bold mb-4 block">
            The Master Plan
          </span>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-foreground">
            Your Journey <br className="md:hidden" /> Day by Day
          </h2>
        </motion.div>

        <div className="relative">
          {groupedActivities.map((day, index) => (
            <TimelineDay
              key={day.dayNumber}
              day={day}
              activities={day.activities}
              isLast={index === groupedActivities.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}