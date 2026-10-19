import type { Partner } from "../../types";

// DEV-ONLY: preview the partner "Book" button and Sponsored badges before any
// real partner data exists. Never active in production builds.
//
//   Turn on:  add ?previewPartner=1 to any URL (stays on for this tab)
//   Turn off: ?previewPartner=0, or close the tab
//
// Only fills in items that have no real `partner` from the API.

const KEY = "hodrac_preview_partner";

const SAMPLE_PARTNER: Partner = {
  partnerId: "preview-partner",
  name: "Acme Travel",
  logoUrl: null,
  bookingUrl: "https://example.com/book",
  trackingUrl: null,
  ctaLabel: "Book with Acme Travel",
  isSponsored: true,
};

function previewEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    const param = new URLSearchParams(window.location.search).get("previewPartner");
    if (param === "1") sessionStorage.setItem(KEY, "1");
    if (param === "0") sessionStorage.removeItem(KEY);
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

type WithPartner = { partner?: Partner | null };

// Adds the sample partner to a single item (detail pages).
export function withPreviewPartner<T extends WithPartner>(item: T): T {
  // Checked first so production builds drop the rest of this module.
  if (!import.meta.env.DEV) return item;
  if (!item || item.partner || !previewEnabled()) return item;
  return { ...item, partner: SAMPLE_PARTNER };
}

// Adds the sample partner to the first item of a list, so cards show what a
// single sponsored listing looks like among normal ones.
export function withPreviewPartnerList<T extends WithPartner>(items: T[]): T[] {
  if (!import.meta.env.DEV) return items;
  if (!Array.isArray(items) || !items.length || !previewEnabled()) return items;
  return [withPreviewPartner(items[0]), ...items.slice(1)];
}
