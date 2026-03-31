import type { TravelPeriod } from "./travel_periods";

export type FilterQuery = {
    country?: string,
    bestPeriodToVisit?: TravelPeriod,
    safetyLevel?: number[],
    categories?: string,
    tags?: string,
    priceRange?: number[],
}