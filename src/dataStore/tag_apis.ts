import type { TagClient } from "../models/tag_client";
import { APIClient } from "./api_client";

export async function getTags(){
    try{
        const response = await APIClient("/api/tag");
        return response.data as TagClient[];
    }
    catch(ex){
        console.log(ex)
        return [];
    }
}