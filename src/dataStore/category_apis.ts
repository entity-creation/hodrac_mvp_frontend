import type { CategoryClient } from "../models/category_client";
import { APIClient } from "./api_client";

export async function getAllCategories(){
    try{
        const response = await APIClient("/api/category");
        return response.data as CategoryClient[];
    }
    catch(ex){

        //Do Proper Logging
        console.log(ex);
        return [];
    }
}