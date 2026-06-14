import { useState, useEffect, useCallback } from "react";
import {
  lookupApi, destinationsApi, wishlistsApi, savedApi, userWishlistsApi, eventsApi,
} from "../../dataStore/v2Api/client";
import type {
  FilterOptions, WishlistDetail,
  WishlistCard, DestinationSummary, SavedContent, CollaboratorDto,
} from "../../types";

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
  const result = useAsync(() => destinationsApi.byId(id), [id]);

  // Fire tracking event when destination is loaded
  useEffect(() => {
    if (result.data) {
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
  return useAsync<WishlistDetail>(() => wishlistsApi.byId(id), [id]);
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

  const toggleWishlist = useCallback(async (id: string) => {
    if (savedWishlistIds.has(id)) {
      await wishlistsApi.unsave(id);
      setSavedWishlistIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    } else {
      await wishlistsApi.save(id);
      setSavedWishlistIds(prev => new Set([...prev, id]));
    }
  }, [savedWishlistIds]);

  const toggleDestination = useCallback(async (id: string) => {
    if (savedDestinationIds.has(id)) {
      await destinationsApi.unsave(id);
      setSavedDestinationIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    } else {
      await destinationsApi.save(id);
      setSavedDestinationIds(prev => new Set([...prev, id]));
    }
  }, [savedDestinationIds]);

  return {
    data, loading,
    savedWishlistIds, savedDestinationIds,
    isWishlistSaved:    (id: string) => savedWishlistIds.has(id),
    isDestinationSaved: (id: string) => savedDestinationIds.has(id),
    toggleWishlist, toggleDestination,
    reload,
  };
}
