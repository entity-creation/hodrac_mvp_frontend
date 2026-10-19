import MyTripsPage from "../../../components/v2Components/tripPost/MyTripsPage";
import { tripClient } from "../../../dataStore/v2Api/client";

export default function TripHubPage(){
    return (
        <>
            <MyTripsPage api={tripClient}/>
        </>
    );
}