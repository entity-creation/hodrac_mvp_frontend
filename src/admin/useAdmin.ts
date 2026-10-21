import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/v2Hooks/useAuth";
import { isApiError } from "../dataStore/v2Api/client";
import { adminApi, type AdminMe } from "./api";

// Whether the signed-in user is an admin, via GET /api/admin/me.
//
// Only a confirmed "yes" is cached (per user, for the browser session) so the
// navbar link doesn't re-check on every page. "No" and failures are never
// cached: they can be temporary (network, cold server, expired token) or stale
// (user promoted since), so /admin always re-checks.

export type AdminCheck =
  | { state: "checking" }
  | { state: "admin"; me: AdminMe }
  | { state: "not-admin"; status?: number } // server said no (200 isAdmin:false, 401, 403)
  | { state: "error"; message: string }; // couldn't find out

const KEY = "hodrac_admin_me";
const memory = new Map<string, AdminMe>();

function readCached(userId: string): AdminMe | undefined {
  const hit = memory.get(userId);
  if (hit) return hit;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { userId: string; me: AdminMe };
    return parsed.userId === userId && parsed.me?.isAdmin ? parsed.me : undefined;
  } catch {
    return undefined;
  }
}

function writeCached(userId: string, me: AdminMe) {
  memory.set(userId, me);
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ userId, me }));
  } catch {
    // storage unavailable — memory cache still works
  }
}

export function clearAdminCache() {
  memory.clear();
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

// `force`: skip the cache (used by the /admin gate and Retry).
export function useAdminStatus({ force = false }: { force?: boolean } = {}) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const userId = isAuthenticated ? user?.userId ?? "" : "";

  const [result, setResult] = useState<{ userId: string; check: AdminCheck } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authLoading || !userId) return;

    if (!force) {
      const cached = readCached(userId);
      if (cached) {
        Promise.resolve().then(() => setResult({ userId, check: { state: "admin", me: cached } }));
        return;
      }
    }

    let cancelled = false;
    adminApi.me()
      .then((me): AdminCheck => {
        if (me?.isAdmin) {
          writeCached(userId, me);
          return { state: "admin", me };
        }
        return { state: "not-admin", status: 200 };
      })
      .catch((e): AdminCheck => {
        if (isApiError(e, 401) || isApiError(e, 403)) return { state: "not-admin", status: e.status };
        return { state: "error", message: e instanceof Error ? e.message : "Couldn't reach the server." };
      })
      .then(check => { if (!cancelled) setResult({ userId, check }); });

    return () => { cancelled = true; };
  }, [authLoading, userId, force, attempt]);

  const retry = useCallback(() => {
    clearAdminCache();
    setResult(null);
    setAttempt(a => a + 1);
  }, []);

  const check: AdminCheck =
    authLoading ? { state: "checking" }
    : !userId ? { state: "not-admin" }
    : result?.userId === userId ? result.check
    : { state: "checking" };

  return {
    check,
    me: check.state === "admin" ? check.me : null,
    isAdmin: check.state === "admin",
    loading: check.state === "checking",
    retry,
  };
}
