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
export function useTripThreadHub(
  tripId: string,
  onMessage: (message: ThreadMessage) => void
) {
  useEffect(() => {
    if (!tripId) return;

    let active = true;
    let connection: HubConnection | null = null;

    const messageReceivedHandler = (payload: ThreadMessageReceived) => {
      if (payload.tripId !== tripId) return;
      onMessage(payload.message);
    };

    getHubConnection("tripThreadHub")
      .then((hub) => {
        if (!active) return;

        connection = hub;
        connection.on("ThreadMessageReceived", messageReceivedHandler);
      })
      .catch((error) => {
        console.error("Failed to connect to trip thread hub", error);
      });

    return () => {
      active = false;

      if (connection) {
        connection.off("ThreadMessageReceived", messageReceivedHandler);
      }
    };
  }, [tripId, onMessage]);
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
