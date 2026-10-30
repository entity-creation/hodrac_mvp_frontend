import { useState, useEffect, useCallback, useRef } from "react";
import {
  lookupApi, destinationsApi, wishlistsApi, savedApi, userWishlistsApi, eventsApi,
} from "../../dataStore/v2Api/client";
import type {
  FilterOptions, WishlistDetail,
  WishlistCard, DestinationSummary, SavedContent, CollaboratorDto,
} from "../../types";
import { useRequireAuth } from "./useRequireAuth";
import { useAuth } from "./useAuth";

// ─── Generic async hook helper ────────────────────────────────────────────────

function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fn()
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message ?? "Unknown error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);
  return { data, loading, error, refetch };
}

// Detail data with a partner carries a trackingUrl that holds a personal token
// (valid 7 days). Refetch when the signed-in user changes, and when a tab comes
// back after sitting open long enough for the token to be close to expiring.
const PARTNER_TOKEN_REFRESH_MS = 6 * 24 * 60 * 60 * 1000;

function usePersonalizedAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const { user } = useAuth();
  const result = useAsync(fn, [...deps, user?.userId ?? null]);
  const { data, refetch } = result;

  const loadedAt = useRef(0);
  useEffect(() => { if (data) loadedAt.current = Date.now(); }, [data]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && loadedAt.current
          && Date.now() - loadedAt.current > PARTNER_TOKEN_REFRESH_MS) {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetch]);

  return result;
}

// ─── Filter options (cached in module scope) ──────────────────────────────────

let _filterOptionsCache: FilterOptions | null = null;

export function useFilterOptions() {
  const [data,    setData]    = useState<FilterOptions | null>(_filterOptionsCache);
  const [loading, setLoading] = useState(!_filterOptionsCache);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (_filterOptionsCache) return;
    lookupApi.filterOptions()
      .then(opts => { _filterOptionsCache = opts; setData(opts); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// ─── Destination detail ───────────────────────────────────────────────────────

export function useDestinationDetail(id: string) {
  const result = usePersonalizedAsync(() => destinationsApi.byId(id), [id]);

  // Fire tracking event once per destination (not again on auth refetches)
  const trackedId = useRef<string | null>(null);
  useEffect(() => {
    if (result.data && trackedId.current !== result.data.destinationId) {
      trackedId.current = result.data.destinationId;
      eventsApi.track(
        "destination_view",
        result.data.destinationId,
        result.data.tags,
        "destination_detail"
      );
    }
  }, [result.data]);

  return result;
}

// ─── Wishlist detail ──────────────────────────────────────────────────────────

export function useWishlistDetail(id: string) {
  return usePersonalizedAsync<WishlistDetail>(() => wishlistsApi.byId(id), [id]);
}

export function useUserWishlistDetail(id: string) {
  return useAsync<WishlistDetail>(() => userWishlistsApi.byId(id), [id]);
}

// ─── Similar content ──────────────────────────────────────────────────────────

export function useSimilarWishlists(id: string) {
  return useAsync<WishlistCard[]>(() => wishlistsApi.similar(id), [id]);
}

export function useSimilarDestinations(wishlistId: string) {
  return useAsync<DestinationSummary[]>(
    () => destinationsApi.similarToWishlist(wishlistId), [wishlistId]
  );
}

export function useDestinationsInWishlist(wishlistId: string, page: number) {
  return useAsync<DestinationSummary[]>(
    () => destinationsApi.destinationsInWishlist(wishlistId, page), [wishlistId, page]
  );
}

// ─── Collaborators ────────────────────────────────────────────────────────────

export function useCollaborators(wishlistId: string) {
  const result = useAsync<CollaboratorDto[]>(
    () => wishlistsApi.collaborators(wishlistId), [wishlistId]
  );

  const addCollaborator = useCallback(async (email: string, role: "Editor" | "Viewer") => {
    await userWishlistsApi.addCollaborator(wishlistId, email, role);
    result.refetch();
  }, [wishlistId, result]);

  const removeCollaborator = useCallback(async (userId: string) => {
    await userWishlistsApi.removeCollaborator(wishlistId, userId);
    result.refetch();
  }, [wishlistId, result]);

  const changeRole = useCallback(async (userId: string, newRole: string) => {
    await userWishlistsApi.changeRole(wishlistId, userId, newRole);
    result.refetch();
  }, [wishlistId, result]);

  return { ...result, addCollaborator, removeCollaborator, changeRole };
}

// ─── Saved content ────────────────────────────────────────────────────────────

export function useSavedContent(isAuthenticated: boolean) {
  const [data,    setData]    = useState<SavedContent | null>(null);
  const [loading, setLoading] = useState(isAuthenticated);
  const [savedWishlistIds, setSavedWishlistIds] = useState<Set<string>>(new Set());
  const [savedDestinationIds, setSavedDestinationIds] = useState<Set<string>>(new Set());

  const reload = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    savedApi.all()
      .then(d => {
        setData(d);
        setSavedWishlistIds(new Set(d.savedWishlists.map(w => w.wishlistId)));
        setSavedDestinationIds(new Set(d.savedDestinations.map(d => d.destinationId)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => { reload(); }, [reload]);

  // Saving needs an account: signed-out users are sent to login and back.
  const requireAuth = useRequireAuth();

  const toggleWishlist = useCallback(async (id: string) => {
    await requireAuth(async () => {
      try {
        if (savedWishlistIds.has(id)) {
          await wishlistsApi.unsave(id);
          setSavedWishlistIds(prev => { const s = new Set(prev); s.delete(id); return s; });
        } else {
          await wishlistsApi.save(id);
          setSavedWishlistIds(prev => new Set([...prev, id]));
        }
      } catch (error) {
        console.error("Failed to update saved wishlist", error);
      }
    });
  }, [savedWishlistIds, requireAuth]);

  const toggleDestination = useCallback(async (id: string) => {
    await requireAuth(async () => {
      try {
        if (savedDestinationIds.has(id)) {
          await destinationsApi.unsave(id);
          setSavedDestinationIds(prev => { const s = new Set(prev); s.delete(id); return s; });
        } else {
          await destinationsApi.save(id);
          setSavedDestinationIds(prev => new Set([...prev, id]));
        }
      } catch (error) {
        console.error("Failed to update saved destination", error);
      }
    });
  }, [savedDestinationIds, requireAuth]);

  return {
    data, loading,
    savedWishlistIds, savedDestinationIds,
    isWishlistSaved:    (id: string) => savedWishlistIds.has(id),
    isDestinationSaved: (id: string) => savedDestinationIds.has(id),
    toggleWishlist, toggleDestination,
    reload,
  };
}
