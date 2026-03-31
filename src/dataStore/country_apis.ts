import type { CountryClient } from "../models/country_client";
import { APIClient } from "./api_client";

export async function getAllCountries(){
    try{
        const response = await APIClient("/api/country");
        return response.data as CountryClient[];
    }
    catch(ex){
        console.log(ex);
        return [];
    }
}