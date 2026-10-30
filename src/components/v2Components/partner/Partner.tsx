import { ExternalLink, BadgeCheck } from "lucide-react";
import { buttonClasses } from "../ui";
import type { Partner } from "../../../types";

// Where on the site the click came from. The backend records it with the click
// (anything else is stored as "other").
export type PartnerClickSource =
  | "destination_detail" | "destination_card"
  | "wishlist_detail" | "wishlist_card"
  | "featured" | "search" | "share" | "trip" | "other";

type PartnerContext = {
  // What the partner is attached to. Only used to pick the default source.
  entityType: "wishlist" | "destination";
  entityId: string;
  entityTags?: string[];
};

// Where the Book button sends people: the server's tracking redirect, which
// records the click and forwards to the partner. Set `src` with the URL API
// because trackingUrl already has its own query string.
function partnerHref(partner: Partner, src: PartnerClickSource): string {
  // Only the dev preview partner lacks a trackingUrl.
  if (!partner.trackingUrl) return partner.bookingUrl;
  try {
    const url = new URL(partner.trackingUrl);
    url.searchParams.set("src", src);
    return url.toString();
  } catch {
    return partner.trackingUrl;
  }
}

// ─── Book button ──────────────────────────────────────────────────────────────

// Sends traffic to the partner that paid for this listing. No login needed.
// Keep it a plain link (never fetch) and never add rel="noreferrer"; the
// backend's click tracking relies on both.
export function PartnerBookingButton({
  partner, size = "lg", fullWidth = true, className = "", source, entityType,
}: PartnerContext & {
  partner: Partner;
  source?: PartnerClickSource;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}) {
  const label = partner.ctaLabel?.trim() || `Book with ${partner.name}`;

  return (
    <a
      href={partnerHref(partner, source ?? `${entityType}_detail`)}
      target="_blank"
      rel="noopener sponsored"
      className={buttonClasses("primary", size, `${fullWidth ? "w-full" : ""} ${className}`)}
    >
      {label}
      <ExternalLink className="w-4 h-4" />
    </a>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

// "Sponsored by X" (paid placement) or "Curated with X" (partner-built).
export function PartnerBadge({
  partner, variant = "light", className = "",
}: { partner: Partner; variant?: "light" | "onImage"; className?: string }) {
  const text = partner.isSponsored ? "Sponsored by" : "Curated with";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 text-xs ${
        variant === "onImage" ? "bg-white/70 backdrop-blur-md border-white text-ink" : "bg-sun-100 border-sun-300 text-ink"
      } ${className}`}
    >
      {partner.logoUrl ? (
        <img src={partner.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover bg-white" />
      ) : (
        <BadgeCheck className="w-5 h-5 text-sun-500" strokeWidth={1.5} />
      )}
      <span>
        <span className="text-ink-muted">{text}</span> <span className="font-medium">{partner.name}</span>
      </span>
    </span>
  );
}

// Small inline label for cards.
export function SponsoredTag({ partner }: { partner: Partner }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.15em] bg-white/70 backdrop-blur-md text-sun-500 rounded-full px-2.5 py-1">
      {partner.isSponsored ? "Sponsored" : `With ${partner.name}`}
    </span>
  );
}
