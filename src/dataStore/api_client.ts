import axios from "axios";

const baseUrl = import.meta.env.VITE_PROD_BACKEND_ROOT_URL;

export async function APIClient(endpoint: string, options?: {}){
    const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });
    if(response.status == 200){
        return response;
    }
    throw new Error("Api Request Failed");
}