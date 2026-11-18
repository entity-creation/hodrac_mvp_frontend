import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { paymentsApi } from "../../../dataStore/v2Api/hostApi";
import { ButtonLink } from "../../../components/v2Components/ui";
import { ReceiptCard } from "../../../components/v2Components/host/ReceiptCard";
import { formatNaira, trackHost } from "../../../utils/v2Utils/host";
import { checkoutTrip } from "../../../utils/v2Utils/hostCheckout";
import { tripPath, tripPayPath } from "../../../utils/v2Utils/routes";
import type { PaymentReceipt } from "../../../types/host";

const POLL_MS = 3000;
const POLL_FOR_MS = 30000;

type View =
  | { kind: "checking" }
  | { kind: "success"; receipt: PaymentReceipt }
  | { kind: "pending" }   // still not confirmed after polling
  | { kind: "failed" }
  | { kind: "error"; message: string };

// /trips/payment/callback?reference=…: Paystack sends the browser here. The
// payment only counts once the API confirms it with Paystack.
export default function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref") ?? "";
  const [view, setView] = useState<View>(reference ? { kind: "checking" } : { kind: "error", message: "This link is missing its payment reference." });
  const started = useRef(false);

  useEffect(() => {
    if (!reference || started.current) return;
    started.current = true;
    const deadline = Date.now() + POLL_FOR_MS;
    let timer: number | undefined;
    let stopped = false;

    const check = async () => {
      try {
        const res = await paymentsApi.verify(reference);
        if (stopped) return;
        if (res.receipt && res.status !== "Initialized") {
          trackHost("payment_confirmed", { kind: res.receipt.kind, amount: res.receipt.totalKobo / 100 });
          setView({ kind: "success", receipt: res.receipt });
        } else if (res.status === "Failed" || res.status === "Abandoned") {
          trackHost("payment_failed", { status: res.status });
          setView({ kind: "failed" });
        } else if (Date.now() < deadline) {
          timer = window.setTimeout(check, POLL_MS);
        } else {
          setView({ kind: "pending" });
        }
      } catch {
        if (stopped) return;
        // Rate limits or a slow provider: keep trying until the deadline.
        if (Date.now() < deadline) timer = window.setTimeout(check, POLL_MS);
        else setView({ kind: "error", message: "We couldn't confirm this payment right now." });
      }
    };
    void check();
    return () => { stopped = true; window.clearTimeout(timer); };
  }, [reference]);

  const tripId = view.kind === "success" ? view.receipt.tripId : checkoutTrip(reference);

  return (
    <div className="max-w-xl mx-auto px-5 md:px-8 py-16">
      {view.kind === "checking" && (
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto text-ink-muted animate-spin" />
          <h1 className="text-2xl font-normal text-ink mt-4">We're confirming with Paystack…</h1>
          <p className="text-ink-soft mt-2">This usually takes a few seconds. Please keep this page open.</p>
        </div>
      )}

      {view.kind === "success" && (
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto text-palm" />
            <h1 className="text-2xl font-normal text-ink mt-4">
              Payment confirmed: {formatNaira(view.receipt.totalKobo)} to {view.receipt.hostDisplayName}
            </h1>
          </div>
          <ReceiptCard receipt={view.receipt} />
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink to={`/trip-thread/${view.receipt.tripId}`} size="lg">Open trip chat</ButtonLink>
            <ButtonLink to={tripPayPath(view.receipt.tripId)} size="lg" variant="outline">Your payments</ButtonLink>
          </div>
        </div>
      )}

      {view.kind === "pending" && (
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto text-ink-muted" />
          <h1 className="text-2xl font-normal text-ink mt-4">Still waiting for Paystack</h1>
          <p className="text-ink-soft mt-2">We'll email you once your payment is confirmed. You don't need to pay again.</p>
          {tripId && <Link to={tripPayPath(tripId)} className="inline-block mt-6 text-ink underline underline-offset-4">Back to your payments</Link>}
        </div>
      )}

      {view.kind === "failed" && (
        <div className="text-center">
          <XCircle className="w-10 h-10 mx-auto text-red-700" />
          <h1 className="text-2xl font-normal text-ink mt-4">Payment didn't go through</h1>
          <p className="text-ink-soft mt-2">You haven't been charged for this attempt.</p>
          <div className="mt-6">
            {tripId
              ? <ButtonLink to={tripPayPath(tripId)} size="lg">Try again</ButtonLink>
              : <ButtonLink to="/trip-hub" size="lg">Go to my trips</ButtonLink>}
          </div>
        </div>
      )}

      {view.kind === "error" && (
        <div className="text-center">
          <h1 className="text-2xl font-normal text-ink">{view.message}</h1>
          <p className="text-ink-soft mt-2">If you completed the payment, we'll email your receipt once it's confirmed.</p>
          <div className="mt-6">
            {tripId ? <ButtonLink to={tripPath(tripId)} size="lg">Back to the trip</ButtonLink> : <ButtonLink to="/trip-hub" size="lg">Go to my trips</ButtonLink>}
          </div>
        </div>
      )}
    </div>
  );
}
