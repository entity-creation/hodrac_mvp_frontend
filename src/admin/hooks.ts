import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { friendlyError } from "../utils/v2Utils/apiErrors";

// Data-loading and action hooks shared by every admin section.

// Runs `fn` whenever `deps` change; exposes reload() for after mutations.
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fnRef.current()
      .then(r => { if (!cancelled) setData(r); })
      .catch(e => { if (!cancelled) setError(friendlyError(e, {}, "Couldn't load this.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick(t => t + 1), []);
  return { data, setData, loading, error, reload };
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ─── Toasts ───────────────────────────────────────────────────────────────────

export type ToastKind = "ok" | "error";
export const ToastContext = createContext<{ notify: (message: string, kind?: ToastKind) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.notify;
}

// Runs a mutation with busy state, a success toast and a friendly error toast.
// `errors` maps HTTP statuses (e.g. 409) to messages.
export function useAction() {
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, opts: { success?: string; errors?: Partial<Record<number, string>>; fallback?: string } = {}) => {
      setBusy(true);
      try {
        const result = await fn();
        if (opts.success) notify(opts.success);
        return { ok: true as const, result };
      } catch (e) {
        notify(friendlyError(e, opts.errors ?? {}, opts.fallback ?? "Something went wrong."), "error");
        return { ok: false as const, result: undefined };
      } finally {
        setBusy(false);
      }
    },
    [notify]
  );
  return { run, busy };
}


// Like useQuery, but keeps the raw error (e.g. to tell a 503 apart) instead
// of only a message.
export function useRawErrorQuery<T>(fn: () => Promise<T>, deps: unknown[]) {
  const q = useQuery(async () => {
    try {
      return { ok: true as const, data: await fn() };
    } catch (e) {
      return { ok: false as const, error: e as unknown };
    }
  }, deps);
  return {
    data: q.data?.ok ? q.data.data : null,
    error: q.data && !q.data.ok ? q.data.error : q.error ? new Error(q.error) : null,
    loading: q.loading,
    reload: q.reload,
  };
}
