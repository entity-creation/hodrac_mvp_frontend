import { useEffect, useState } from "react";
import type { CountryClient } from "../models/country_client";
import { getAllCountries } from "../dataStore/country_apis";

export default function useCountry(){
    const [countries, setCountries] = useState<CountryClient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllCountries()
        .then(setCountries)
        .finally(() => setLoading(false));
    }, [])

    return {countries, countLoading: loading}
}