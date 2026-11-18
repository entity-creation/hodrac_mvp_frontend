import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Receipt } from "lucide-react";
import { paymentsApi } from "../../../dataStore/v2Api/hostApi";
import { Button, EmptyState, FullPageSpinner } from "../../../components/v2Components/ui";
import { FormError } from "../../../components/v2Components/host/HostUi";
import { ReceiptCard } from "../../../components/v2Components/host/ReceiptCard";
import { formatNaira, formErrorText } from "../../../utils/v2Utils/host";
import { receiptPath, tripPayPath } from "../../../utils/v2Utils/routes";
import type { PaymentReceipt } from "../../../types/host";

// /payments: all my receipts. /payments/:reference: one receipt (printable;
// the link in receipt emails).
export default function ReceiptsPage() {
  const { reference } = useParams<{ reference?: string }>();
  return reference ? <OneReceipt reference={reference} /> : <AllReceipts />;
}

function OneReceipt({ reference }: { reference: string }) {
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    paymentsApi.receipt(reference).then(setReceipt)
      .catch(e => setError(formErrorText(e, { 404: "We couldn't find this receipt." }, "Couldn't load this receipt.")));
  }, [reference]);

  if (error) return <div className="max-w-xl mx-auto px-5 py-16"><FormError message={error} /></div>;
  if (!receipt) return <FullPageSpinner />;

  return (
    <div className="max-w-xl mx-auto px-5 md:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link to={tripPayPath(receipt.tripId)} className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Your payments
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</Button>
      </div>
      <ReceiptCard receipt={receipt} />
    </div>
  );
}

function AllReceipts() {
  const [receipts, setReceipts] = useState<PaymentReceipt[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    paymentsApi.myPayments().then(setReceipts).catch(e => setError(formErrorText(e, {}, "Couldn't load your receipts.")));
  }, []);

  if (error) return <div className="max-w-xl mx-auto px-5 py-16"><FormError message={error} /></div>;
  if (!receipts) return <FullPageSpinner />;
  if (!receipts.length) return <EmptyState emoji="🧾" title="No payments yet" subtitle="Receipts for hosted trips you pay for appear here." />;

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-10">
      <h1 className="text-4xl font-light text-ink mb-8">Payment receipts</h1>
      <ul className="rounded-2xl border border-line bg-white divide-y divide-line">
        {receipts.map(r => (
          <li key={r.reference}>
            <Link to={receiptPath(r.reference)} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-cream">
              <span className="flex items-center gap-3 min-w-0">
                <Receipt className="w-4 h-4 text-ink-muted shrink-0" />
                <span className="min-w-0">
                  <span className="block text-ink truncate">{r.tripTitle}</span>
                  <span className="block text-xs text-ink-muted">
                    {r.kind === "Deposit" ? "Deposit" : r.kind === "Full" ? "Full balance" : `Instalment ${r.instalmentSequence}`}
                    {r.paidAt && ` · ${new Date(r.paidAt).toLocaleDateString()}`} · {r.hostDisplayName}
                  </span>
                </span>
              </span>
              <span className="text-ink shrink-0">{formatNaira(r.totalKobo)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
