import { useEffect, useState } from "react";
import type {
  ClientWishlistDto,
  ClientWishlistView,
} from "../models/wishlist_client";

import { getWishlistById, getAllWishlists } from "../dataStore/wishlist_api";

type UseWishlistParams = {
  id?: string;
};

export default function useWishlist(params?: UseWishlistParams) {
  const [wishlists, setWishlists] = useState<ClientWishlistView[]>([]);
  const [wishlist, setWishlist] = useState<ClientWishlistView | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params?.id
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(params?.id)
        // SINGLE MODE
        if (params?.id) {
          const data = await getWishlistById(params.id);

          if (!isMounted) return;

          setWishlist(data ? mapWishlistToView(data) : null);
          return;
        }

        // LIST MODE
        const data = await getAllWishlists();

        if (!isMounted) return;

        const mapped = (data ?? []).map(mapWishlistToView);

        setWishlists(mapped);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;

        setError("Failed to load wishlist data");
        setWishlist(null);
        setWishlists([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return {
    wishlists,
    wishlist,
    loading,
    error,
  };
}


import type { DestinationClientView } from "../models/destination_client";
import { convertJsonToDescription } from "../utils/convert_json";

export function mapWishlistToView(
  dto: ClientWishlistDto
): ClientWishlistView {
  return {
    ...dto,

    destinations: dto.destinations.map<DestinationClientView>((d) => ({
      ...d,
      description: convertJsonToDescription(d.description),
    })),
  };
}