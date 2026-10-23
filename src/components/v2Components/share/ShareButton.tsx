import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { shareApi } from "../../../dataStore/v2Api/client";
import type { ShareInfo, ShareType } from "../../../types";

// Share info is fetched on first click and reused for the session.
const cache = new Map<string, ShareInfo>();

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / non-secure contexts.
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      el.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// Shares a destination, wishlist, trip or shared wishlist (id = token).
// Uses the backend's previewUrl so WhatsApp/iMessage/X/Facebook show a proper
// card (the SPA's own URLs preview as blank). Native share sheet when
// available, otherwise copies the link.
export default function ShareButton({ type, id, label = "Share", variant = "icon", className = "" }: {
  type: ShareType;
  id: string;
  label?: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state !== "copied" && state !== "failed") return;
    const t = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(t);
  }, [state]);

  const share = async () => {
    if (state === "busy") return;
    setState("busy");
    const key = `${type}:${id}`;
    let info = cache.get(key) ?? null;
    if (!info) {
      try {
        info = await shareApi.info(type, id);
        cache.set(key, info);
      } catch {
        info = null; // fall back to the current page below
      }
    }

    const url = info?.previewUrl || window.location.href;
    const title = info?.title || document.title;
    const text = info?.text || undefined;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        setState("idle");
        return;
      } catch (e) {
        // User closed the sheet: nothing to do.
        if (e instanceof DOMException && e.name === "AbortError") {
          setState("idle");
          return;
        }
        // Otherwise fall through to copying.
      }
    }
    setState((await copy(url)) ? "copied" : "failed");
  };

  const done = state === "copied";
  const text = done ? "Link copied" : state === "failed" ? "Couldn't copy" : label;

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={share}
        disabled={state === "busy"}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-ink/25 px-5 py-2.5 text-sm font-medium text-ink hover:border-ink transition-colors disabled:opacity-60 ${className}`}
      >
        {done ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        {text}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={state === "busy"}
      aria-label={done ? "Link copied" : label}
      title={text}
      className={`relative w-11 h-11 rounded-full flex items-center justify-center border border-line bg-white/90 backdrop-blur text-ink hover:bg-white transition-colors disabled:opacity-60 ${className}`}
    >
      {done ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" strokeWidth={1.75} />}
      {(done || state === "failed") && (
        <span role="status" className="absolute top-full mt-2 right-0 whitespace-nowrap rounded-full bg-ink text-white text-xs px-3 py-1">
          {text}
        </span>
      )}
    </button>
  );
}
