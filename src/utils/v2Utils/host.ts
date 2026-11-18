import type { Kobo } from "../../types/host";
import { isApiError } from "../../dataStore/v2Api/client";
import { friendlyError } from "./apiErrors";

// Field messages from an ASP.NET validation error, keyed by field name with a
// lowercase first letter ("DisplayName" → "displayName", "instalments[0].dueDate"
// stays). The backend writes these for users ("Account number must be 10 digits.").
export function fieldErrors(e: unknown): Record<string, string> {
  if (!isApiError(e, 400)) return {};
  const errors = (e.body as { errors?: Record<string, unknown> } | undefined)?.errors;
  if (!errors || typeof errors !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(errors)) {
    const msg = Array.isArray(msgs) ? msgs.find(m => typeof m === "string") : msgs;
    if (typeof msg === "string" && key !== "request") out[key.charAt(0).toLowerCase() + key.slice(1)] = msg;
  }
  return out;
}

// Message for the form-level error box. Field errors are shown under their
// fields, so the box just points at them.
export function formErrorText(e: unknown, byStatus: Partial<Record<number, string>> = {}, fallback?: string): string {
  if (Object.keys(fieldErrors(e)).length) return "Please check the highlighted fields.";
  if (isApiError(e, 502) || isApiError(e, 503)) return "Our payment provider isn't responding. Please try again shortly.";
  return friendlyError(e, byStatus, fallback);
}

// Hodrac Host is hidden until launch: set VITE_HOST_ENABLED=true (staging) to
// show host routes, links and hosted-trip UI. Free community trips never
// depend on this.
export const HOST_ENABLED = import.meta.env.VITE_HOST_ENABLED === "true";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Hosted-trip money is kobo in NGN, shown as whole naira ("₦650,000"),
// whatever currency the visitor browses in.
export const formatNaira = (kobo: Kobo | null | undefined) => naira.format(Math.round((kobo ?? 0) / 100));

export const nairaToKobo = (amount: number) => Math.round(amount * 100);
export const koboToNaira = (kobo: Kobo) => kobo / 100;

// Splits a kobo total into `parts` whole-naira amounts that add up exactly
// (any remainder goes on the last part).
export function splitEvenly(totalKobo: Kobo, parts: number): Kobo[] {
  if (parts <= 0) return [];
  const each = Math.floor(totalKobo / parts / 100) * 100;
  return Array.from({ length: parts }, (_, i) => (i === parts - 1 ? totalKobo - each * (parts - 1) : each));
}

// Funnel events for the launch metrics, sent to Microsoft Clarity (already on
// the site) as custom events with tags. The /api/events endpoint is for
// personalisation, so these don't go there.
type ClarityFn = (...args: unknown[]) => void;
export function trackHost(event: string, props: Record<string, string | number | boolean | null | undefined> = {}) {
  const clarity = (window as unknown as { clarity?: ClarityFn }).clarity;
  if (!clarity) return;
  try {
    for (const [key, value] of Object.entries(props)) {
      if (value != null) clarity("set", key, String(value));
    }
    clarity("event", event);
  } catch {
    // Analytics must never break the page.
  }
}
