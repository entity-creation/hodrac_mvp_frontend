import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Receipt } from "lucide-react";
import { tripClient } from "../../../dataStore/v2Api/client";
import { paymentsApi } from "../../../dataStore/v2Api/hostApi";
import { Button, FullPageSpinner } from "../../../components/v2Components/ui";
import { FormError, PaymentStatusChip, SeatHoldCountdown } from "../../../components/v2Components/host/HostUi";
import { TermsAcceptance } from "../../../components/v2Components/host/HostedTrip";
import { formatNaira, formErrorText, trackHost } from "../../../utils/v2Utils/host";
import { rememberCheckout } from "../../../utils/v2Utils/hostCheckout";
import { receiptPath, tripPath } from "../../../utils/v2Utils/routes";
import type { TripPost } from "../../../types";
import type { Balance, CheckoutInput, PaymentReceipt, ScheduleLine } from "../../../types/host";

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const LINE_STATUS: Record<ScheduleLine["status"], string> = {
  Paid: "text-palm",
  Due: "text-ink",
  Overdue: "text-red-700",
  Upcoming: "text-ink-muted",
};

async function fetchPayState(tripId: string) {
  const trip = await tripClient.getTrip(tripId);
  const interestId = trip.myInterestId ?? null;
  if (!interestId || trip.myInterestStatus !== "Approved") return { trip, interestId: null, balance: null, receipts: [] as PaymentReceipt[] };
  const [balance, all] = await Promise.all([
    paymentsApi.balance(tripId, interestId),
    paymentsApi.myPayments().catch(() => [] as PaymentReceipt[]),
  ]);
  return { trip, interestId, balance, receipts: all.filter(r => r.tripId === tripId) };
}

// /trips/:id/pay: the traveller's schedule, terms acceptance and checkout.
export default function TripPayPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripPost | null>(null);
  const [interestId, setInterestId] = useState<string | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "notApproved" | "error">("loading");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<CheckoutInput["kind"] | null>(null);

  const load = useCallback(() =>
    fetchPayState(id).then(r => {
      setTrip(r.trip);
      if (!r.interestId || !r.balance) { setState("notApproved"); return; }
      setInterestId(r.interestId);
      setBalance(r.balance);
      setReceipts(r.receipts);
      setState("ready");
    }), [id]);

  useEffect(() => {
    load().catch(e => { setError(formErrorText(e, { 404: "This trip isn't available." }, "Couldn't load your payments.")); setState("error"); });
  }, [load]);

  const pay = async (kind: CheckoutInput["kind"]) => {
    if (!interestId || !balance) return;
    const next = balance.nextPayment;
    setPaying(kind);
    setError("");
    try {
      const body: CheckoutInput = kind === "Instalment" ? { kind, instalmentSequence: next?.sequence ?? null } : { kind };
      trackHost("checkout_started", { kind });
      const res = await paymentsApi.checkout(id, interestId, body);
      rememberCheckout(res.reference, id);
      window.location.assign(res.authorizationUrl); // Paystack's hosted page
    } catch (e) {
      setError(formErrorText(e, { 429: "Too many attempts. Please wait a minute and try again." }, "Couldn't start the payment."));
      setPaying(null);
    }
  };

  if (state === "loading") return <FullPageSpinner />;

  const back = (
    <Link to={tripPath(id)} className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
      <ArrowLeft className="w-4 h-4" /> Back to the trip
    </Link>
  );

  if (state !== "ready" || !trip || !balance || !interestId) {
    return (
      <div className="max-w-xl mx-auto px-5 py-12 space-y-6">
        {back}
        {state === "notApproved"
          ? <p className="text-ink-soft">You can pay once the host has approved your request to join this trip.</p>
          : <FormError message={error || "Couldn't load your payments."} />}
      </div>
    );
  }

  const hostName = trip.host?.displayName ?? "the host";
  const needsTerms = balance.termsVersionAccepted !== balance.termsVersion;
  const next = balance.nextPayment;
  const expired = balance.paymentStatus === "Expired";

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 pt-6 pb-24 space-y-8">
      {back}
      <header>
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-2">Your seat</p>
        <h1 className="text-3xl md:text-4xl font-light text-ink">{trip.destinationLabel}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <PaymentStatusChip status={balance.paymentStatus} />
          {balance.paymentStatus === "AwaitingDeposit" && balance.seatHoldExpiresAt && <SeatHoldCountdown until={balance.seatHoldExpiresAt} />}
        </div>
      </header>

      {expired ? (
        <div className="rounded-2xl border border-line bg-white p-6 space-y-3">
          <p className="text-ink">Your seat hold expired before the deposit was paid.</p>
          <Link to={tripPath(id)} className="text-ink underline underline-offset-4">Request again from the trip page</Link>
        </div>
      ) : needsTerms && balance.owesKobo > 0 ? (
        <section className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <h2 className="text-xl font-normal text-ink">
            {balance.termsVersionAccepted ? "The host updated their terms" : `Accept ${hostName}'s terms`}
          </h2>
          <p className="text-sm text-ink-soft">Read these before you pay. They set out what's refunded if you or the host can't go.</p>
          <TermsAcceptance tripId={id} interestId={interestId} hostName={hostName}
            onAccepted={() => load().catch(() => setError("Couldn't refresh your payments."))} />
        </section>
      ) : next ? (
        <section className="rounded-2xl border border-ink bg-white p-6 space-y-4">
          <h2 className="text-xl font-normal text-ink">
            {next.kind === "Deposit" ? "Pay your deposit" : `Pay instalment ${next.sequence}`}
          </h2>
          <dl className="text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="text-ink-soft">Seat payment</dt><dd className="text-ink">{formatNaira(next.seatAmountKobo)}</dd></div>
            {next.feeKobo > 0 && <div className="flex justify-between"><dt className="text-ink-soft">Booking fee</dt><dd className="text-ink">{formatNaira(next.feeKobo)}</dd></div>}
            <div className="flex justify-between border-t border-line pt-2 text-base"><dt className="text-ink font-medium">Total</dt><dd className="text-ink font-medium">{formatNaira(next.totalKobo)}</dd></div>
          </dl>
          <Button fullWidth size="lg" loading={paying === next.kind} disabled={!!paying}
            onClick={() => pay(next.kind)}>
            Pay {formatNaira(next.totalKobo)} with Paystack
          </Button>
          {balance.owesKobo > next.seatAmountKobo && (
            <Button fullWidth variant="outline" loading={paying === "Full"} disabled={!!paying} onClick={() => pay("Full")}>
              Pay the full balance ({formatNaira(balance.owesKobo)} + booking fee)
            </Button>
          )}
          <p className="text-xs text-ink-muted">
            You'll pay on Paystack's secure page, by card or bank transfer. Your payment goes to {hostName} through Paystack. Hodrac never holds your money.
          </p>
        </section>
      ) : (
        <div className="rounded-2xl bg-palm/10 text-palm p-6 flex items-center gap-3">
          <Check className="w-5 h-5" /> You've paid in full. Have a great trip!
        </div>
      )}

      <FormError message={error} />

      <section>
        <h2 className="text-xl font-normal text-ink mb-4">Payment schedule</h2>
        <div className="rounded-2xl border border-line bg-white divide-y divide-line">
          {balance.schedule.map(l => (
            <div key={`${l.kind}-${l.sequence ?? 0}`} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-ink">{l.kind === "Deposit" ? "Deposit" : `Instalment ${l.sequence}`}</p>
                <p className="text-xs text-ink-muted">
                  {l.kind === "Deposit" ? "To secure your seat" : l.dueDate ? `Due ${fmtDay(l.dueDate)}` : ""}
                  {l.paidKobo > 0 && l.paidKobo < l.amountKobo && ` · ${formatNaira(l.paidKobo)} paid`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-ink">{formatNaira(l.amountKobo)}</p>
                <p className={`text-xs font-medium ${LINE_STATUS[l.status]}`}>{l.status}</p>
              </div>
            </div>
          ))}
          <div className="flex justify-between px-5 py-4 text-sm">
            <span className="text-ink-soft">Paid {formatNaira(balance.amountPaidKobo)} of {formatNaira(balance.priceKobo)}</span>
            <span className="text-ink font-medium">{balance.owesKobo > 0 ? `${formatNaira(balance.owesKobo)} to go` : "All paid"}</span>
          </div>
        </div>
      </section>

      {receipts.length > 0 && (
        <section>
          <h2 className="text-xl font-normal text-ink mb-4">Receipts</h2>
          <ul className="rounded-2xl border border-line bg-white divide-y divide-line">
            {receipts.map(r => (
              <li key={r.reference}>
                <Link to={receiptPath(r.reference)} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-cream">
                  <span className="flex items-center gap-3 text-ink">
                    <Receipt className="w-4 h-4 text-ink-muted" />
                    {r.kind === "Deposit" ? "Deposit" : r.kind === "Full" ? "Full balance" : `Instalment ${r.instalmentSequence}`}
                    {r.paidAt && <span className="text-xs text-ink-muted">{new Date(r.paidAt).toLocaleDateString()}</span>}
                  </span>
                  <span className="text-ink">{formatNaira(r.totalKobo)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
