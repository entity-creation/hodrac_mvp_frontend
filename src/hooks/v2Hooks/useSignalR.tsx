import { useEffect } from "react";
import { connection, getHubConnection } from "../../utils/v2Utils/signalR_connection";
import type { ThreadMessage, TripInterest, TripNotification, TripPost } from "../../types";
import type { HubConnection } from "@microsoft/signalr";

export function useWishlistSignalR(
  wishlistId: string,
  handlers: {
    onWishlistUpdated?: (data: any) => void;
  }
) {
  useEffect(() => {
    if (!wishlistId) return;

    // let mounted = true;

    const start = async () => {
      if (connection.state === "Disconnected") {
        await connection.start();
      }

      await connection.invoke("JoinWishlist", wishlistId);

      if (handlers.onWishlistUpdated) {
        connection.off("WishlistUpdated"); // prevent duplicates
        connection.on("WishlistUpdated", handlers.onWishlistUpdated);
      }
    };

    start();

    return () => {
    //   mounted = false;

      connection.invoke("LeaveWishlist", wishlistId).catch(() => {});
      if(handlers.onWishlistUpdated){
        connection.off("WishlistUpdated", handlers.onWishlistUpdated);
      }
      
    };
  }, [wishlistId, handlers.onWishlistUpdated]);
}

export function useExploreWishlistSignalR(
  onUpdated?: () => void
) {
  useEffect(() => {
    // let mounted = true;

    const start = async () => {
      if (connection.state === "Disconnected") {
        await connection.start();
      }

      await connection.invoke("JoinExploreWishlist");

      connection.off("ExploreUpdated");

      connection.on("ExploreUpdated", () => {
        onUpdated?.();
      });
    };

    start();

    return () => {
    //   mounted = false;

      connection.invoke("LeaveExploreWishlist").catch(() => {});
      connection.off("ExploreUpdated");
    };
  }, [onUpdated]);
}

export type TripInterestHubEvent =
  | "statusChanged"
  | "interestUpdated"
  | "tripPostCreated";

export type TripInterestUpdate = {
  event: TripInterestHubEvent;
  interest?: TripInterest;
  interestList?: TripInterest[];
  tripPost?: TripPost;
};

interface UseTripInterestHubProps {
  onUpdate: (update: TripInterestUpdate) => void;
}

export function useTripInterestHub({
  onUpdate,
}: UseTripInterestHubProps) {
  useEffect(() => {
    let active = true;
    let connection: HubConnection | null = null;
    if(!active)
      return;

    const statusChangedHandler = (interest: TripInterest) => {
          onUpdate({
            event: "statusChanged",
            interest,
          });
        };


    getHubConnection("tripPostHub")
      .then((hub) => {

        connection = hub;
        
        connection.on("TripInterestStatusChanged", statusChangedHandler);
      })
      .catch((error) => {
        console.error("Failed to connect to trip hub", error);
      });

    return () => {
      active = false;

      if (connection) {
        connection.off("TripInterestStatusChanged", statusChangedHandler);
      }
    };
  }, [onUpdate]);
}
export function useTripInterestUpdatedHub({
  onUpdate,
}: UseTripInterestHubProps) {
  useEffect(() => {
    let active = true;
    let connection: HubConnection | null = null;
    if(!active)
      return;

        const interestReceivedHandler = (interestList: TripInterest[]) => {
          onUpdate({
            event: "interestUpdated",
            interestList,
          });
        };


    getHubConnection("tripPostHub")
      .then((hub) => {

        connection = hub;

        connection.on("TripInterestUpdated", interestReceivedHandler);
      })
      .catch((error) => {
        console.error("Failed to connect to trip hub", error);
      });

    return () => {
      active = false;

      if (connection) {
        connection.off("TripInterestUpdated", interestReceivedHandler);
      }
    };
  }, [onUpdate]);
}

export function useTripPostCreatedHub({
  onUpdate,
}: UseTripInterestHubProps) {
  useEffect(() => {
    let active = true;
    let connection: HubConnection | null = null;
    if(!active)
      return;

        const tripPostCreatedHandler = (tripPost: TripPost) => {
          console.log("Trip Post Created" + tripPost);
          onUpdate({
            event: "tripPostCreated",
            tripPost,
          });
        };


    getHubConnection("tripPostHub")
      .then((hub) => {

        connection = hub;
        console.log("Connection state ", connection.state);

        connection.on("TripPostCreated", tripPostCreatedHandler);
      })
      .catch((error) => {
        console.error("Failed to connect to trip hub", error);
      });

    return () => {
      active = false;

      if (connection) {
        connection.off("TripPostCreated", tripPostCreatedHandler);
      }
    };
  }, [onUpdate]);
}

export type ThreadMessageReceived = {
  tripId: string;
  threadId: string;
  message: ThreadMessage;
};

// Live messages for one trip thread. The sender also receives the event,
// so consumers should de-dupe on message.id.
// Reads an id from a hub payload sent either as a bare id or as an object.
function payloadId(payload: unknown, key: string): string | undefined {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object") {
    const v = (payload as Record<string, unknown>)[key] ?? (payload as Record<string, unknown>).id;
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

export function useTripThreadHub(
  tripId: string,
  onMessage: (message: ThreadMessage) => void,
  // A moderator removed a message (ThreadMessageDeleted).
  onMessageDeleted?: (messageId: string) => void
) {
  useEffect(() => {
    if (!tripId) return;

    let active = true;
    let connection: HubConnection | null = null;

    const messageReceivedHandler = (payload: ThreadMessageReceived) => {
      if (payload.tripId !== tripId) return;
      onMessage(payload.message);
    };

    const messageDeletedHandler = (payload: unknown) => {
      const forTrip = payloadId(payload, "tripId");
      // Bare-id payloads carry no trip, so accept them; otherwise match the trip.
      if (typeof payload === "object" && forTrip && forTrip !== tripId) return;
      const messageId = typeof payload === "string" ? payload : payloadId(payload, "messageId");
      if (messageId) onMessageDeleted?.(messageId);
    };

    getHubConnection("tripThreadHub")
      .then((hub) => {
        if (!active) return;

        connection = hub;
        connection.on("ThreadMessageReceived", messageReceivedHandler);
        connection.on("ThreadMessageDeleted", messageDeletedHandler);
      })
      .catch((error) => {
        console.error("Failed to connect to trip thread hub", error);
      });

    return () => {
      active = false;

      if (connection) {
        connection.off("ThreadMessageReceived", messageReceivedHandler);
        connection.off("ThreadMessageDeleted", messageDeletedHandler);
      }
    };
  }, [tripId, onMessage, onMessageDeleted]);
}

// Trip posts changing under the viewer: removed/hidden (TripPostRemoved) or a
// new status (TripPostStatusChanged, status may be a name or a number).
export function useTripPostLifecycleHub({
  onRemoved,
  onStatusChanged,
}: {
  onRemoved?: (tripId: string) => void;
  onStatusChanged?: (tripId: string, status: unknown) => void;
}) {
  useEffect(() => {
    let active = true;
    let connection: HubConnection | null = null;

    const removedHandler = (payload: unknown) => {
      const id = payloadId(payload, "tripId");
      if (id) onRemoved?.(id);
    };
    const statusHandler = (payload: unknown, maybeStatus?: unknown) => {
      const id = payloadId(payload, "tripId");
      const status = maybeStatus ?? (payload && typeof payload === "object" ? (payload as Record<string, unknown>).status : undefined);
      if (id) onStatusChanged?.(id, status);
    };

    getHubConnection("tripPostHub")
      .then((hub) => {
        if (!active) return;
        connection = hub;
        connection.on("TripPostRemoved", removedHandler);
        connection.on("TripPostStatusChanged", statusHandler);
      })
      .catch((error) => console.error("Failed to connect to trip hub", error));

    return () => {
      active = false;
      if (connection) {
        connection.off("TripPostRemoved", removedHandler);
        connection.off("TripPostStatusChanged", statusHandler);
      }
    };
  }, [onRemoved, onStatusChanged]);
}

// Live notifications for the signed-in user. The server targets the user
// directly (Clients.User), so there is no group to join. onReconnected fires
// after an automatic reconnect so callers can refetch anything they missed.
export function useNotificationHub(
  enabled: boolean,
  onNotification: (notification: TripNotification) => void,
  onReconnected?: () => void
) {
  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let connection: HubConnection | null = null;

    const notificationHandler = (notification: TripNotification) => {
      if (active) onNotification(notification);
    };

    const reconnectedHandler = () => {
      if (active) onReconnected?.();
    };

    getHubConnection("notificationHub")
      .then((hub) => {
        if (!active) return;

        connection = hub;
        connection.on("NotificationReceived", notificationHandler);
        connection.onreconnected(reconnectedHandler);
      })
      .catch((error) => {
        console.error("Failed to connect to notification hub", error);
      });

    return () => {
      active = false;

      if (connection) {
        connection.off("NotificationReceived", notificationHandler);
      }
    };
  }, [enabled, onNotification, onReconnected]);
}
