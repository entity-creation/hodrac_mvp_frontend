"use client"

import { ArrowUpRight } from "lucide-react"

import { useState } from "react"
import { cn } from "../../../utils/utils"
import type { ClientWishlistView } from "../../../models/wishlist_client"
import type { DestinationClientView } from "../../../models/destination_client"
import { ROUTES } from "../../../utils/routes"
import { useNavigate } from "react-router-dom"
import { slugify, summarizeText } from "../../../utils/summarize"


interface DestinationProps {
  wishlist: ClientWishlistView;
}


function DestinationCard({ destination }: { destination: DestinationClientView }) {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate();

  const goToDetails = () => {
      navigate(`${ROUTES.PUBLIC.DESTINATIONDETAILS}/${destination.destinationId}/${slugify(destination.destinationName)}`, {
        state: {
          id: destination.destinationId,
          titleImage: destination.destinationImage,
          title: destination.destinationName,
          location: destination.countryName,
          priceRange: destination.costRange,
          categories: destination.categories,
          tags: destination.tags,
          overview: destination.description?.overview,
          safetyLevels: destination.safetyLevel,
          currency: destination.currencies,
          bestTimeToVisit: destination.bestPeriodToVisit,
          timeZone: destination.timeZone,
          languages: destination.languages,
          description: destination.description,
          cities: destination.cities,
        },
      });
    };
  return (
    <article 
      className="group relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-4/5 overflow-hidden rounded-lg">
        <img
          src={destination.destinationImage}
          alt={destination.destinationName}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out",
            isHovered && "scale-105"
          )}
        />
        <div className={cn(
          "absolute inset-0 bg-linear-to-t from-foreground/80 via-foreground/20 to-transparent transition-opacity duration-500",
          isHovered ? "opacity-100" : "opacity-70"
        )} />
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl md:text-2xl text-card mb-2">
                {destination.destinationName}
              </h3>
              <p className={cn(
                "text-sm text-card/80 leading-relaxed transition-all duration-500",
                isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}>
                {summarizeText(destination.description?.overview!)}
              </p>
            </div>
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-card/20 backdrop-blur-sm transition-all duration-300",
              isHovered && "bg-card text-foreground"
            )}>
              <ArrowUpRight className={cn(
                "w-5 h-5 text-card transition-colors duration-300",
                isHovered && "text-foreground"
              )}  onClick={() => goToDetails()}/>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function DestinationsSection({wishlist}: DestinationProps) {
  return (
    <section className="py-16 md:py-24 px-6 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 md:mb-16">
          <span className="text-sm uppercase tracking-widest text-muted-foreground mb-3 block">
            Places to Discover
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground">
            Destinations
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {wishlist.destinations.map((destination) => (
            <DestinationCard key={destination.destinationName} destination={destination} />
          ))}
        </div>
      </div>
    </section>
  )
}
