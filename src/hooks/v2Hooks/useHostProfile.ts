import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { hostApi } from "../../dataStore/v2Api/hostApi";
import { HOST_ENABLED } from "../../utils/v2Utils/host";
import type { HostProfile } from "../../types/host";

// One request per signed-in user, shared by every component that asks.
let cache: { userId: string; promise: Promise<HostProfile | null> } | null = null;

function load(userId: string) {
  if (cache?.userId !== userId) {
    const promise = hostApi.myProfile().catch(() => null);
    cache = { userId, promise };
  }
  return cache.promise;
}

// Call after onboarding changes the profile so other screens see it.
export function clearHostProfileCache() {
  cache = null;
}

// The signed-in user's host profile: undefined while loading, null when they
// aren't a host (or Hodrac Host is switched off).
export function useHostProfile(): HostProfile | null | undefined {
  const { user, isAuthenticated } = useAuth();
  const userId = isAuthenticated && HOST_ENABLED ? user?.userId ?? null : null;
  const [result, setResult] = useState<{ userId: string; profile: HostProfile | null } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    load(userId).then(profile => { if (!cancelled) setResult({ userId, profile }); });
    return () => { cancelled = true; };
  }, [userId]);

  if (!userId) return null;
  return result?.userId === userId ? result.profile : undefined;
}
