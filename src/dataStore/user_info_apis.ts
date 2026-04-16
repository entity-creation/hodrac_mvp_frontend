import { APIClientCreate } from "./api_client";

export async function createNewUserInfo(email: string) {
    try {
        const response = await APIClientCreate("/api/user_info", { userEmail: email})
        return response.data;
    }
    catch(ex){
        console.log(ex);
        return null;
    }
}