import { useEffect } from "react";
import { connection } from "../../utils/v2Utils/signalR_connection";

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
