import type { ClientDescription } from "./description_client";
import type { TravelPeriod } from "./travel_periods";

export type DestinationClient = {
    destinationId: string;
    destinationName: string,
    destinationImage: string,
    description: string,
    bestPeriodToVisit: TravelPeriod[],
    costRange: string,
    safetyLevel: number,
    timeZone: string,
    countryName: string,
    tags: string[],
    categories: string[],
    languages: string[],
    currencies: string[],
    cities: string[]
};


export type DestinationClientView = {
    destinationId: string;
    destinationName: string,
    destinationImage: string,
    description: ClientDescription | null,
    bestPeriodToVisit: TravelPeriod[],
    costRange: string,
    safetyLevel: number,
    timeZone: string,
    countryName: string,
    tags: string[],
    categories: string[],
    languages: string[],
    currencies: string[],
    cities: string[]
};

