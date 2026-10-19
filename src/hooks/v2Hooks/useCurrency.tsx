import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { useAuth } from "./useAuth";
import { authApi, currencyApi } from "../../dataStore/v2Api/client";
import {
  BASE_CURRENCY, currencyForCountry, detectCountry, isKnownCountry,
} from "../../utils/v2Utils/countries";
import type { ExchangeRates } from "../../types";

// Display currency for the whole app. All prices from the API are USD; they
// are converted on display using the user's country.
//
// Country priority: signed-in profile → this browser's choice → detected
// from the browser language → US. Rates come from the backend and are cached
// for RATES_TTL; with no usable rate we fall back to showing USD.

const COUNTRY_KEY = "hodrac_country";
const RATES_KEY = `hodrac_fx_${BASE_CURRENCY}`;
const RATES_TTL = 12 * 60 * 60 * 1000;

interface CurrencyContextValue {
  country: string;
  // The currency prices are actually shown in (USD if no rate is available).
  currency: string;
  // The currency the user's country uses, even if we couldn't convert to it.
  preferredCurrency: string;
  isConverted: boolean;
  ratesUpdatedAt: string | null;
  setCountry: (code: string) => Promise<void>;
  // Converts a USD amount and formats it, e.g. formatPrice(1240) → "€1,140".
  formatPrice: (usd: number) => string;
  // Formats a USD amount as USD, e.g. for "converted from …" notes.
  formatUsd: (usd: number) => string;
  convert: (usd: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readStored<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode) — keep in memory only.
  }
}

type CachedRates = { fetchedAt: number; data: ExchangeRates };

function makeFormatter(currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 });
  } catch {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: BASE_CURRENCY, maximumFractionDigits: 0 });
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [localCountry, setLocalCountry] = useState<string>(() => {
    const stored = readStored<string>(COUNTRY_KEY);
    return isKnownCountry(stored) ? stored : detectCountry();
  });
  const [rates, setRates] = useState<ExchangeRates | null>(() => readStored<CachedRates>(RATES_KEY)?.data ?? null);

  // Profile country wins for signed-in users.
  const country = isAuthenticated && isKnownCountry(user?.countryCode) ? user!.countryCode!.toUpperCase() : localCountry;
  const preferredCurrency = currencyForCountry(country);

  // Load rates (cached). Only needed when the user isn't on USD.
  useEffect(() => {
    if (preferredCurrency === BASE_CURRENCY) return;
    const cached = readStored<CachedRates>(RATES_KEY);
    if (cached && Date.now() - cached.fetchedAt < RATES_TTL) return;

    let cancelled = false;
    currencyApi.rates(BASE_CURRENCY)
      .then(data => {
        if (cancelled || !data?.rates) return;
        setRates(data);
        writeStored(RATES_KEY, { fetchedAt: Date.now(), data } satisfies CachedRates);
      })
      // Keep any stale cached rates rather than dropping to USD.
      .catch(() => {});
    return () => { cancelled = true; };
  }, [preferredCurrency]);

  const rate = preferredCurrency === BASE_CURRENCY ? 1 : rates?.rates?.[preferredCurrency];
  const currency = rate ? preferredCurrency : BASE_CURRENCY;
  const factor = rate ?? 1;

  const setCountry = useCallback(async (code: string) => {
    const next = code.toUpperCase();
    if (!isKnownCountry(next)) return;
    setLocalCountry(next);
    writeStored(COUNTRY_KEY, next);
    if (isAuthenticated) {
      const previous = user?.countryCode ?? null;
      updateUser({ countryCode: next }); // optimistic
      try {
        await authApi.updateCountry(next);
      } catch (e) {
        updateUser({ countryCode: previous });
        throw e;
      }
    }
  }, [isAuthenticated, user?.countryCode, updateUser]);

  const value = useMemo<CurrencyContextValue>(() => {
    const fmt = makeFormatter(currency);
    const usdFmt = makeFormatter(BASE_CURRENCY);
    const convert = (usd: number) => (Number.isFinite(usd) ? usd * factor : 0);
    return {
      country,
      currency,
      preferredCurrency,
      isConverted: currency !== BASE_CURRENCY,
      ratesUpdatedAt: currency !== BASE_CURRENCY ? rates?.updatedAt ?? null : null,
      setCountry,
      convert,
      formatPrice: (usd: number) => fmt.format(convert(usd)),
      formatUsd: (usd: number) => usdFmt.format(Number.isFinite(usd) ? usd : 0),
    };
  }, [country, currency, preferredCurrency, factor, rates?.updatedAt, setCountry]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
