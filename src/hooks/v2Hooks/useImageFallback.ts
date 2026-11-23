import { useCallback, useState, type SyntheticEvent } from "react";
import { fallbackFor, loadImageConfig } from "../../utils/v2Utils/imageHosts";

type ErrorHandler = (e: SyntheticEvent<HTMLImageElement, Event>) => void;

// For an <img> (or motion.img): returns { src, onError } to spread onto it.
// When the image fails, the same file is retried once on the fallback host;
// if that fails too (or there's none), onFinalError runs.
export function useImageFallback(src: string | null | undefined, onFinalError?: ErrorHandler) {
  // Tied to the src it was made for, so a new src starts fresh without an effect.
  const [state, setState] = useState<{ for: string | null | undefined; current: string | null | undefined; retried: boolean }>(
    { for: src, current: src, retried: false },
  );
  const active = state.for === src ? state : { for: src, current: src, retried: false };

  const onError = useCallback<ErrorHandler>(e => {
    if (active.retried || !src) { onFinalError?.(e); return; }
    e.persist?.();
    void loadImageConfig().then(cfg => {
      const next = fallbackFor(src, cfg);
      if (next) setState({ for: src, current: next, retried: true });
      else onFinalError?.(e);
    });
  }, [active.retried, src, onFinalError]);

  return { src: active.current ?? undefined, onError };
}
