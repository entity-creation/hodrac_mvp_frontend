import { useEffect, useState } from "react";
import type { DestinationClientView } from "../models/destination_client";
import {
  getAllDestinations,
  getDestinationByQuery,
} from "../dataStore/destination_client";
import { convertJsonToDescription } from "../utils/convert_json";
import type { FilterQuery } from "../models/filter_query";

export default function useDestination(params?: FilterQuery) {
  const [destinations, setDestinations] = useState<DestinationClientView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDestinations = async () => {
      const data = params
        ? await getDestinationByQuery(params)
        : await getAllDestinations();
      const transformedData = data.map((d) => ({
        ...d,
        description: convertJsonToDescription(d.description),
      }));
      setDestinations(transformedData);
      setLoading(false);
    };

    getDestinations();
  }, [params]);

  return { destinations, desLoading: loading };
}
