import BrowseTrips from "../../../components/v2Components/tripPost/BrowseTrips";
import { tripClient } from "../../../dataStore/v2Api/client";

export default function BrowseTripPage() {
  return <BrowseTrips api={tripClient} />;
}
