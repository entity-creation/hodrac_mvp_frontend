import { ExternalLink, BadgeCheck } from "lucide-react";
import { eventsApi } from "../../../dataStore/v2Api/client";
import { buttonClasses } from "../ui";
import type { Partner } from "../../../types";

type PartnerContext = {
  // What the partner is attached to — sent with the click event and as the
  // UTM campaign so partners can see which listing sent the traffic.
  entityType: "wishlist" | "destination";
  entityId: string;
  entityTags?: string[];
};

// Where the Book button sends people. The server-side tracking redirect is
// preferred; otherwise tag the partner's own URL with UTM parameters.
function partnerHref(partner: Partner, ctx: PartnerContext): string {
  if (partner.trackingUrl) return partner.trackingUrl;
  try {
    const url = new URL(partner.bookingUrl);
    url.searchParams.set("utm_source", "hodrac");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", `${ctx.entityType}_${ctx.entityId}`);
    return url.toString();
  } catch {
    return partner.bookingUrl;
  }
}

// ─── Book button ──────────────────────────────────────────────────────────────

// Sends traffic to the partner that paid for this listing. No login needed.
export function PartnerBookingButton({
  partner, size = "lg", fullWidth = true, className = "", ...ctx
}: PartnerContext & {
  partner: Partner;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}) {
  const label = partner.ctaLabel?.trim() || `Book with ${partner.name}`;

  return (
    <a
      href={partnerHref(partner, ctx)}
      target="_blank"
      rel="noopener sponsored"
      onClick={() =>
        eventsApi.track("partner_click", ctx.entityId, ctx.entityTags ?? [], `${ctx.entityType}_detail:${partner.partnerId}`)
      }
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
