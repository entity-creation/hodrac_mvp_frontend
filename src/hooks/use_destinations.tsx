import { useEffect, useState } from "react";
import type { DestinationClientView } from "../models/destination_client";
import type { FilterQuery } from "../models/filter_query";



import { convertJsonToDescription } from "../utils/convert_json";
import { getAllDestinations, getDestinationById, getDestinationByQuery } from "../dataStore/destination_client";

type UseDestinationParams = {
  query?: FilterQuery;
  id?: string;
};

export default function useDestination(params?: UseDestinationParams) {
  const [destinations, setDestinations] = useState<DestinationClientView[]>([]);
  const [destination, setDestination] = useState<DestinationClientView | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ SINGLE MODE
        if (params?.id) {
          const data = await getDestinationById(params.id);

          if (!isMounted) return;

          const transformed = data
            ? {
                ...data,
                description: convertJsonToDescription(data.description),
              }
            : null;

          setDestination(transformed);
          return;
        }

        // ✅ LIST MODE
        const data = params?.query
          ? await getDestinationByQuery(params.query)
          : await getAllDestinations();

        if (!isMounted) return;

        const transformedList = (data ?? []).map((d) => ({
          ...d,
          description: convertJsonToDescription(d.description),
        }));

        setDestinations(transformedList);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;

        setError("Failed to load destinations");
        setDestination(null);
        setDestinations([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [params?.id, params?.query]);

  return {
    destinations, // list
    destination,  // single
    loading,
    error,
  };
}