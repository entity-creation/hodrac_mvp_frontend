import { useEffect, useRef } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { getHubConnection, logHubError } from "../../utils/v2Utils/signalR_connection";

// Live manifest for a host's trip: joins the "trip-host:{tripId}" group on
// /tripPostHub (author only) and calls onUpdate on each "ManifestUpdated"
// signal ({ tripId, interestId }); the caller refetches the manifest.
export function useManifestHub(tripId: string | undefined, onUpdate: (interestId: string) => void) {
  const handler = useRef(onUpdate);
  useEffect(() => { handler.current = onUpdate; }, [onUpdate]);

  useEffect(() => {
    if (!tripId) return;
    let hub: HubConnection | null = null;
    let active = true;
    const onSignal = (payload: { tripId?: string; interestId?: string }) => {
      if (payload?.tripId?.toLowerCase() === tripId.toLowerCase()) handler.current(payload.interestId ?? "");
    };
    const join = (h: HubConnection) => h.invoke("JoinTripHost", tripId).catch(e => logHubError("Couldn't follow the manifest", e));

    getHubConnection("tripPostHub")
      .then(h => {
        if (!active) return;
        hub = h;
        h.on("ManifestUpdated", onSignal);
        // Groups are per connection: rejoin after an automatic reconnect.
        h.onreconnected(() => { if (active) void join(h); });
        void join(h);
      })
      .catch(e => logHubError("Failed to connect to trip hub", e));

    return () => {
      active = false;
      if (hub) {
        hub.off("ManifestUpdated", onSignal);
        hub.invoke("LeaveTripHost", tripId).catch(() => {});
      }
    };
  }, [tripId]);
}
