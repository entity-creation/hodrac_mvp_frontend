import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, FileText, MessageCircle, Minus, Phone } from "lucide-react";
import { isApiError, tripClient } from "../../../dataStore/v2Api/client";
import { paymentsApi } from "../../../dataStore/v2Api/hostApi";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { useRequireAuth } from "../../../hooks/v2Hooks/useRequireAuth";
import { Button, Modal } from "../ui";
import { FormError, PaymentStatusChip, SeatHoldCountdown, VerifiedBadge } from "./HostUi";
import { inputClass } from "./hostStyles";
import { formatNaira, formErrorText, trackHost } from "../../../utils/v2Utils/host";
import { tripCapacity } from "../../../utils/v2Utils/trips";
import { friendlyError, TRIP_CONFLICTS } from "../../../utils/v2Utils/apiErrors";
import { hostEditTripPath, hostManifestPath, tripPayPath } from "../../../utils/v2Utils/routes";
import type { TripPost } from "../../../types";
import type { TripTerms } from "../../../types/host";

import Img from "../ui/Img";
const fmtDay = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const lines = (text?: string | null) => (text ?? "").split(/\r?\n/).map(l => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);

// Host name, logo and Verified host badge.
export function HostBlock({ trip }: { trip: TripPost }) {
  const host = trip.host;
  if (!host) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-cream-deep overflow-hidden flex items-center justify-center text-ink font-medium shrink-0">
        {host.logoUrl ? <Img src={host.logoUrl} alt="" className="w-full h-full object-cover" /> : host.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-muted">Hosted by</p>
        <p className="text-ink font-medium truncate">{host.displayName}</p>
      </div>
      {host.verified && <VerifiedBadge size="md" />}
    </div>
  );
}

// Price per seat, booking fee, deposit and the instalment timeline.
export function HostedPriceBox({ trip }: { trip: TripPost }) {
  const fee = trip.feeMode === "PassToTraveller" ? trip.travellerFeePreviewKobo ?? 0 : 0;
  const capacity = tripCapacity(trip);
  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <p className="text-3xl font-light text-ink">{formatNaira(trip.pricePerSeatKobo)}<span className="text-base text-ink-muted"> / seat</span></p>
      {fee > 0 && <p className="text-sm text-ink-soft mt-1">plus about {formatNaira(fee)} booking fee, added to each payment</p>}
      {capacity.label && <p className={`text-sm mt-2 font-medium ${capacity.isFull ? "text-red-700" : "text-palm"}`}>{capacity.label}</p>}

      <ol className="mt-5 relative border-l border-line ml-1.5 space-y-4">
        <li className="pl-5 relative">
          <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-ink" />
          <p className="text-sm text-ink"><span className="font-medium">{formatNaira(trip.depositKobo)}</span> deposit</p>
          <p className="text-xs text-ink-muted">When you're approved, to secure your seat</p>
        </li>
        {(trip.instalments ?? []).map(i => (
          <li key={i.sequence} className="pl-5 relative">
            <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-ink bg-white" />
            <p className="text-sm text-ink"><span className="font-medium">{formatNaira(i.amountKobo)}</span> instalment {i.sequence}</p>
            <p className="text-xs text-ink-muted">Due {fmtDay(i.dueDate)}</p>
          </li>
        ))}
      </ol>
      <p className="text-xs text-ink-muted mt-5">
        Paid by card or transfer through Paystack, straight to {trip.host?.displayName ?? "the host"}. Hodrac never holds your money.
      </p>
    </div>
  );
}

// What's included / not included, and the start of the host's terms.
export function HostedDetails({ trip }: { trip: TripPost }) {
  const { isAuthenticated } = useAuth();
  const [termsOpen, setTermsOpen] = useState(false);
  const [terms, setTerms] = useState<TripTerms | null>(null);
  const included = lines(trip.inclusions);
  const excluded = lines(trip.exclusions);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    paymentsApi.terms(trip.id).then(t => { if (!cancelled) setTerms(t); }).catch(() => {});
    return () => { cancelled = true; };
  }, [trip.id, isAuthenticated]);

  const preview = lines(terms?.termsText).slice(0, 3);

  return (
    <div className="mt-10 space-y-10">
      {(included.length > 0 || excluded.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-6">
          {included.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-3">Included</p>
              <ul className="space-y-2">{included.map(l => <li key={l} className="flex gap-2 text-ink-soft"><Check className="w-4 h-4 text-palm mt-1 shrink-0" />{l}</li>)}</ul>
            </div>
          )}
          {excluded.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-3">Not included</p>
              <ul className="space-y-2">{excluded.map(l => <li key={l} className="flex gap-2 text-ink-soft"><Minus className="w-4 h-4 text-ink-muted mt-1 shrink-0" />{l}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-3">Refund and dropout terms</p>
        {terms ? (
          <>
            <ul className="space-y-1.5 text-ink-soft">{preview.map(l => <li key={l}>{l}</li>)}</ul>
            <button type="button" onClick={() => setTermsOpen(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink underline underline-offset-4">
              <FileText className="w-4 h-4" /> Read full terms
            </button>
            <Modal isOpen={termsOpen} onClose={() => setTermsOpen(false)} label="Refund and dropout terms">
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-normal text-ink mb-4 pr-10">Refund and dropout terms</h3>
                <p className="whitespace-pre-line text-ink-soft leading-relaxed">{terms.termsText}</p>
                <p className="text-xs text-ink-muted mt-4">Version {terms.termsVersion}</p>
              </div>
            </Modal>
          </>
        ) : (
          <p className="text-ink-soft">
            {isAuthenticated ? "Loading…" : "Sign in to read the host's terms. You'll accept them before paying."}
          </p>
        )}
      </div>
    </div>
  );
}

// The sticky panel on a hosted trip page: request (with phone), wait for
// approval, accept terms and pay, then "you're in".
export function HostedJoinPanel({ trip, isAuthor, onTripChange }: {
  trip: TripPost; isAuthor: boolean; onTripChange: (t: TripPost) => void;
}) {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const status = trip.myInterestStatus ?? null;
  const open = trip.status === "Open";
  const capacity = tripCapacity(trip);
  const hostName = trip.host?.displayName ?? "the host";

  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const paymentStatus = trip.myPaymentStatus ?? null;
  const paid = trip.myAmountPaidKobo ?? 0;
  const next = trip.myNextPayment ?? null;

  const request = () => requireAuth(async () => {
    setBusy(true);
    setError("");
    try {
      await tripClient.requestToJoin(trip.id, phone);
      trackHost("join_requested", { tripType: "hosted" });
      onTripChange({ ...trip, myInterestStatus: "Requested" });
    } catch (e) {
      setError(friendlyError(e, { 409: TRIP_CONFLICTS.join }, "Couldn't send your request."));
    } finally {
      setBusy(false);
    }
  });

  // After the seat hold expires: back to the host as a new request.
  const requestAgain = async () => {
    if (!trip.myInterestId) return;
    setBusy(true);
    setError("");
    try {
      await paymentsApi.requestAgain(trip.id, trip.myInterestId);
      onTripChange(await tripClient.getTrip(trip.id));
    } catch (e) {
      setError(formErrorText(e, {}, "Couldn't send a new request."));
    } finally {
      setBusy(false);
    }
  };

  if (isAuthor) {
    return (
      <Panel>
        <p className="text-sm text-ink-soft">This is your hosted trip.</p>
        <Button fullWidth size="lg" onClick={() => navigate(hostManifestPath(trip.id))}>Manage seats</Button>
        <Button fullWidth variant="outline" onClick={() => navigate(hostEditTripPath(trip.id))}>Edit trip</Button>
        <Button fullWidth variant="ghost" onClick={() => navigate(`/trip-thread/${trip.id}`)}>
          <MessageCircle className="w-4 h-4" /> Trip chat
        </Button>
      </Panel>
    );
  }

  const price = trip.pricePerSeatKobo ?? 0;
  const termsCurrent = trip.myTermsVersionAccepted != null && trip.myTermsVersionAccepted === trip.termsVersion;

  return (
    <Panel>
      {status === "Approved" && paymentStatus && (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-ink font-medium">
              {paymentStatus === "AwaitingDeposit" ? "You're approved" : paymentStatus === "Expired" ? "Seat hold expired" : "You're in"}
            </p>
            <PaymentStatusChip status={paymentStatus} />
          </div>
          {paymentStatus === "AwaitingDeposit" && trip.mySeatHoldExpiresAt && (
            <SeatHoldCountdown until={trip.mySeatHoldExpiresAt} />
          )}
          {paid > 0 && (
            <div className="text-sm text-ink-soft">
              Paid {formatNaira(paid)} of {formatNaira(price)}
              <div className="mt-2 h-2 rounded-full bg-cream-deep overflow-hidden">
                <div className="h-full bg-palm" style={{ width: `${Math.min(100, (paid / Math.max(1, price)) * 100)}%` }} />
              </div>
            </div>
          )}
          {paymentStatus === "Expired" ? (
            <>
              <p className="text-sm text-ink-soft">
                Your seat hold expired before the deposit was paid. {hostName} can approve you again, or you can ask again now.
              </p>
              <Button fullWidth size="lg" loading={busy} onClick={requestAgain}>Request again</Button>
            </>
          ) : next ? (
            <Button fullWidth size="lg" onClick={() => navigate(tripPayPath(trip.id))}>
              {!termsCurrent
                ? next.kind === "Deposit" ? "Accept terms and pay deposit" : "Accept updated terms and pay"
                : `Pay ${formatNaira(next.totalKobo)} now`}
            </Button>
          ) : paymentStatus === "PaidInFull" ? (
            <Link to={tripPayPath(trip.id)} className="text-sm text-ink underline underline-offset-4">See your payments and receipts</Link>
          ) : null}
          {next?.dueDate && next.kind === "Instalment" && (
            <p className="text-xs text-ink-muted">Next payment due {new Date(`${next.dueDate}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}.</p>
          )}
          {paid > 0 && (
            <Button fullWidth variant="outline" onClick={() => navigate(`/trip-thread/${trip.id}`)}>
              <MessageCircle className="w-4 h-4" /> Open trip chat
            </Button>
          )}
          {paid <= 0 && paymentStatus === "AwaitingDeposit" && (
            <p className="text-xs text-ink-muted">You'll join the trip chat once your deposit is paid.</p>
          )}
        </>
      )}

      {status === "Requested" && (
        <>
          <p className="text-ink font-medium">Request sent</p>
          <p className="text-sm text-ink-soft">Waiting for {hostName} to approve. We'll notify you.</p>
        </>
      )}

      {status === "Declined" && <p className="text-sm text-ink-soft">{hostName} declined your request for this trip.</p>}

      {!status && (
        !open ? <p className="text-sm text-ink-soft">This trip is {trip.status.toLowerCase()} and isn't taking new travellers.</p>
        : capacity.isFull ? <p className="text-ink font-medium">Sold out</p>
        : (
          <>
            <p className="text-sm text-ink-soft">Request a seat. Once {hostName} approves, you'll accept their terms and pay the deposit.</p>
            {isAuthenticated && (
              <label className="block">
                <span className="flex items-center gap-1.5 text-sm text-ink mb-1.5"><Phone className="w-3.5 h-3.5" /> Phone number (optional)</span>
                <input className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" maxLength={20} placeholder="+234 801 234 5678" />
                <span className="block text-xs text-ink-muted mt-1.5">So the host can reach you on WhatsApp.</span>
              </label>
            )}
            <Button fullWidth size="lg" loading={busy} onClick={request}>
              {isAuthenticated ? "Request to join" : "Sign in to request a seat"}
            </Button>
          </>
        )
      )}

      <FormError message={error} />
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line bg-white p-6 flex flex-col gap-3 shadow-pop">{children}</div>;
}

// The host's terms with an explicit acceptance; reloads if they changed.
export function TermsAcceptance({ tripId, interestId, hostName, onAccepted }: {
  tripId: string; interestId: string; hostName: string; onAccepted: () => void;
}) {
  const [terms, setTerms] = useState<TripTerms | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => paymentsApi.terms(tripId).then(setTerms), [tripId]);

  useEffect(() => {
    load().catch(e => setError(formErrorText(e, {}, "Couldn't load the terms.")));
  }, [load]);

  const accept = async () => {
    if (!terms) return;
    setBusy(true);
    setError("");
    try {
      await paymentsApi.acceptTerms(tripId, interestId, terms.termsVersion);
      trackHost("terms_accepted", { version: terms.termsVersion });
      onAccepted();
    } catch (e) {
      if (isApiError(e, 409) && /terms have changed/i.test(e.message)) {
        await load().catch(() => {});
        setChecked(false);
        setNotice("The host updated the terms since you opened them. Please read the latest version.");
      } else {
        setError(formErrorText(e, {}, "Couldn't record your acceptance."));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!terms) return error ? <FormError message={error} /> : <p className="text-sm text-ink-soft">Loading terms…</p>;

  return (
    <div className="space-y-4">
      {notice && <p className="rounded-2xl bg-sun-100 border border-sun-300 px-4 py-3 text-sm text-ink">{notice}</p>}
      <div className="max-h-80 overflow-y-auto rounded-2xl border border-line bg-cream p-5 whitespace-pre-line text-sm text-ink-soft leading-relaxed" tabIndex={0}>
        {terms.termsText}
      </div>
      <label className="flex items-start gap-3 text-sm text-ink cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="mt-0.5 w-4 h-4 accent-ink" />
        <span>I have read and accept {hostName}'s refund and dropout terms (version {terms.termsVersion}).</span>
      </label>
      <FormError message={error} />
      <Button size="lg" disabled={!checked} loading={busy} onClick={accept}>Accept terms</Button>
    </div>
  );
}
