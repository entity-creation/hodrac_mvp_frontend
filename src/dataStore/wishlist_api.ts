import type { ClientWishlistDto } from "../models/wishlist_client";
import { APIClient } from "./api_client";

export async function getAllWishlists() {
    try{
        const response = await APIClient("/api/wishlist");
        return response.data as ClientWishlistDto[];
    }
    catch(ex){
        console.log(ex);
        return [];
    }
}

export async function getWishlistById(id: string){
    try{
        const response = await APIClient(`/api/wishlist/${id}`);
        return response.data as ClientWishlistDto;
    }
    catch(ex){
        console.log(ex);
        return null;
    }
}