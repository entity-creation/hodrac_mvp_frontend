import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreateTripPost, { type InitialTripSelection } from "../../../components/v2Components/tripPost/CreateTripPost";
import { destinationsApi, tripClient, wishlistsApi } from "../../../dataStore/v2Api/client";
import { ROUTES } from "../../../utils/v2Utils/routes";
import { HOST_ENABLED } from "../../../utils/v2Utils/host";
import { Link } from "react-router-dom";

// /create-trip?destinationId=… or ?wishlistId=… preselects the place, so
// "Plan a trip here" on a destination/wishlist page lands ready to post.
export default function CreateTripPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destinationId = params.get("destinationId");
  const wishlistId = params.get("wishlistId");
  const [initial, setInitial] = useState<InitialTripSelection | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (wishlistId) {
      wishlistsApi
        .byId(wishlistId)
        .then((w) => {
          if (!cancelled) setInitial({ mode: "wishlist", item: { id: w.wishlistId, name: w.wishlistName, stopNames: [] } });
        })
        .catch(() => {});
    } else if (destinationId) {
      destinationsApi
        .byId(destinationId)
        .then((d) => {
          if (!cancelled) {
            setInitial({
              mode: "destination",
              item: { id: d.destinationId, name: d.destinationName, country: d.countryName || null },
            });
          }
        })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [destinationId, wishlistId]);

  return (
    <>
      <CreateTripPost
        api={tripClient}
        onSubmit={tripClient.createTrip}
        initialSelection={initial}
        onCreated={() => navigate(ROUTES.AUTH.TRIPHUB)}
      />
      {HOST_ENABLED && (
        <p className="max-w-3xl mx-auto px-5 md:px-8 -mt-12 pb-20 text-sm text-ink-soft">
          Selling seats on this trip?{" "}
          <Link to={ROUTES.HOST.NEW_TRIP} className="text-ink underline underline-offset-4">Use Hodrac Host</Link>{" "}
          to take deposits and instalments, with your terms signed before anyone pays.
        </p>
      )}
    </>
  );
}
