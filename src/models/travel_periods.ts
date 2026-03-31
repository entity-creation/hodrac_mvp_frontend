export type TravelPeriod = 
| "JanToMarch"
| "AprToJun"
| "JulToSept"
| "OctToDec"
| "YearRound"
| "EventBased";

export const TravelSeasonLabels : Record<TravelPeriod, string> = {
    JanToMarch: "Jan - Mar",
    AprToJun: "April - June",
    JulToSept: "July - Sept",
    OctToDec: "Oct - Dec",
    YearRound: "Year Round",
    EventBased: "Event Based"
}