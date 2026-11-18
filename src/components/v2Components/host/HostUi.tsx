import { useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, Clock } from "lucide-react";
import type { HostProfile, InterestPaymentStatus } from "../../../types/host";

// Shown to a host whose account Hodrac closed. They can still see their trips
// and manifests and record payments, to settle with travellers who've paid.
export function HostClosedBanner({ profile }: { profile: HostProfile }) {
  if (!profile.closedAt) return null;
  return (
    <div role="status" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-ink space-y-1">
      <p className="font-medium text-red-700">Your host account was closed by Hodrac. Contact support.</p>
      {profile.closedReason && <p>Reason: {profile.closedReason}</p>}
      <p className="text-ink-soft">
        You can still view your trips and manifests, download them, record payments and refunds, and send WhatsApp reminders,
        so you can settle with travellers who've paid.
      </p>
    </div>
  );
}

// "Verified host" badge (Palm). Tooltip explains what was checked.
export function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span
      title="Hodrac checked this host's ID or CAC registration and a past trip"
      className={`inline-flex items-center gap-1 rounded-full bg-palm/10 text-palm font-medium whitespace-nowrap ${
        size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]"
      }`}
    >
      <BadgeCheck className={size === "md" ? "w-4 h-4" : "w-3.5 h-3.5"} /> Verified host
    </span>
  );
}

export function HostField({ label, hint, error, children, className = "" }: {
  label: string; hint?: ReactNode; error?: string; children: ReactNode; className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-ink-muted mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-red-700 mt-1.5">{error}</span>}
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{message}</p>;
}

const PAYMENT_STATUS: Record<InterestPaymentStatus, { label: string; cls: string }> = {
  NotRequired: { label: "Requested", cls: "bg-cream-deep text-ink-soft" },
  AwaitingDeposit: { label: "Awaiting deposit", cls: "bg-sun-100 text-sun-500 border border-sun-300" },
  DepositPaid: { label: "Deposit paid", cls: "bg-palm/10 text-palm" },
  PartPaid: { label: "Part paid", cls: "bg-palm/10 text-palm" },
  PaidInFull: { label: "Paid in full", cls: "bg-palm text-white" },
  Expired: { label: "Seat hold expired", cls: "bg-red-50 text-red-700" },
  Refunded: { label: "Refunded", cls: "bg-cream-deep text-ink-soft" },
};

export function PaymentStatusChip({ status, label }: { status: InterestPaymentStatus; label?: string }) {
  const s = PAYMENT_STATUS[status] ?? PAYMENT_STATUS.NotRequired;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${s.cls}`}>
      {label ?? s.label}
    </span>
  );
}

function remaining(until: string) {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`;
}

// "Seat held for 41h 12m". Re-renders every minute; shows `expiredText` after.
export function SeatHoldCountdown({ until, prefix = "Seat held for", expiredText = "Seat hold expired" }: {
  until: string; prefix?: string; expiredText?: string;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick(t => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const left = remaining(until);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${left ? "text-sun-500" : "text-red-700"}`}>
      <Clock className="w-3.5 h-3.5" /> {left ? `${prefix} ${left}` : expiredText}
    </span>
  );
}
