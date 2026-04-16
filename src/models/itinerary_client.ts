export type ItineraryDay = {
    dayNumber: number;
    dayTitle: string;
}

export type ItineraryItem = {
    itemDescription: string;
    itemOrderIndex: number;
    dayNumber: number;
    timeOfDay: string;
    itemType: string;
}