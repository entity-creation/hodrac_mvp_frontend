import type { DestinationClient } from "../models/destination_client";
import type { FilterQuery } from "../models/filter_query";
import { APIClient } from "./api_client";

export async function getAllDestinations() {
    try{
        const response = await APIClient("/api/destination");
        return response.data as DestinationClient[];
    }
    catch(ex){
        console.log(ex);
        return [];
    }
}

export async function getDestinationByQuery(query: FilterQuery){
    try{
        const response = await APIClient("/api/destination/get-by-query", {params: query});
        return response.data as DestinationClient[];
    }
    catch(ex){
        console.log(ex);
        return [];
    }
}

export async function getDestinationById(id: string){
    try{
        const response = await APIClient(`/api/destination/get-by-id/${id}`);
        return response.data as DestinationClient;
    }
    catch(ex){
        console.log(ex);
        return null;
    }
}