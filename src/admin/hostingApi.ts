// Admin endpoints for Hodrac Host: host verification, founding hosts, the
// operator plan, payments, Paystack webhook events and hosting insights.
// Money is kobo (NGN); admin pages use { items, page, pageSize, totalCount }.
import { downloadFile, http } from "../dataStore/v2Api/client";
import type { AdminPaged } from "./api";
import type {
  HostPlan, HostVerificationStatus, Kobo, SeatPaymentKind, SeatPaymentStatus,
} from "../types/host";

const A = "/api/admin";

function qs(params: Record<string, unknown>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export const HOST_STATUSES: HostVerificationStatus[] = ["Pending", "Unverified", "Verified", "Rejected"];
export const PAYMENT_STATUSES: SeatPaymentStatus[] = ["Initialized", "Success", "Failed", "Abandoned", "Refunded", "PartiallyRefunded", "Disputed"];

export interface AdminHostSummary {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  userEmail: string | null;
  verificationStatus: HostVerificationStatus;
  documentCount: number;
  lastDocumentUploadedAt: string | null;
  cacNumber: string | null;
  pastTripProofUrls: string[];
  payoutAccountSet: boolean;
  payoutAccountLast4: string | null;
  payoutBankName: string | null;
  isFoundingHost: boolean;
  plan: HostPlan;
  operatorPlanExpiresAt: string | null;
  closedAt: string | null;   // null = open
  closedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOperatorPlanPayment {
  id: string;
  reference: string;
  amountKobo: Kobo;
  periodStart: string;
  periodEnd: string;
  recordedByUserId: string;
  createdAt: string;
}

export interface AdminHostDetail {
  summary: AdminHostSummary;
  userDisplayName: string | null;
  bio: string | null;
  logoUrl: string | null;
  instagramHandle: string | null;
  whatsAppNumber: string | null;
  verifiedAt: string | null;
  verifiedByUserId: string | null;
  rejectionReason: string | null;
  paystackSubaccountCode: string | null;
  payoutAccountName: string | null;
  foundingFreeDepartureTripId: string | null;
  closedByUserId: string | null;
  operatorPlanPayments: AdminOperatorPlanPayment[];
}

// subaccount*: true = done, false = Paystack call failed (closing again retries), null = no payout account.
export interface AdminCloseHostResult { host: AdminHostDetail; subaccountDeactivated: boolean | null; hiddenTripIds: string[] }
export interface AdminReopenHostResult { host: AdminHostDetail; subaccountReactivated: boolean | null; unhiddenTripIds: string[] }
// 409 body from DELETE /hosts/{id} when the host has trips or payments.
export interface AdminDeleteHostConflict { detail?: string; hostedTrips?: number; seatPayments?: number; operatorPlanPayments?: number }

export interface AdminHostDocument {
  id: string;
  kind: "IdDocument" | "CacCertificate";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  url: string;       // relative, signed for 5 minutes; needs the admin token too
  expiresAt: string;
}

export interface AdminPayment {
  id: string;
  reference: string;
  status: SeatPaymentStatus;
  kind: SeatPaymentKind;
  instalmentSequence: number | null;
  trip: { id: string; title: string };
  host: { id: string; displayName: string } | null;
  payer: { id: string; name: string | null; email: string | null };
  seatAmountKobo: Kobo;
  hodracFeeKobo: Kobo;
  travellerFeeKobo: Kobo;
  totalChargedKobo: Kobo;
  paystackFeeKobo: Kobo | null;
  refundedKobo: Kobo;
  channel: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface AdminPaymentEvent {
  id: string;
  provider: string;
  eventType: string;
  reference: string | null;
  receivedAt: string;
  processedAt: string | null;
  error: string | null;
}

export interface AdminPaymentDetail {
  payment: AdminPayment;
  tripInterestId: string;
  currency: string;
  updatedAt: string;
  verifyResponseJson: string | null;
  webhookEvents: AdminPaymentEvent[];
}

export interface AdminPaymentEventDetail { event: AdminPaymentEvent; payloadSha256: string; payload: string }

export interface AdminReprocessResult { outcome: "Processed" | "Failed" | "AlreadyProcessed"; event: AdminPaymentEvent }

export interface AdminHostingMonth {
  month: string; // yyyy-MM
  gmvKobo: Kobo;
  viaHodracKobo: Kobo;
  manualNetKobo: Kobo;
  hodracFeeKobo: Kobo;
  refundedViaHodracKobo: Kobo;
  percentThroughHodrac: number | null;
  seatsPaid: number;
  activeHosts: number;
  paidDepartures: number;
  operatorPlanRevenueKobo: Kobo;
  operatorPlanPayments: number;
}

export interface AdminHostingInsights extends Omit<AdminHostingMonth, "month"> {
  from: string;
  to: string;
  verifiedHosts: number;
  foundingHostsUsed: number;
  foundingHostLimit: number;
  foundingFreeDeparturesClaimed: number;
  operatorPlansActive: number;
  months: AdminHostingMonth[];
}

export interface OperatorPlanInput { reference: string; amountKobo: Kobo; periodStart: string; periodEnd: string }

export type PaymentsQuery = {
  page?: number; pageSize?: number; reference?: string; tripId?: string; hostId?: string;
  payerEmail?: string; status?: string; from?: string; to?: string;
};

export const hostingApi = {
  hosts: {
    list: (p: { page?: number; pageSize?: number; status?: string; closed?: boolean; search?: string }) =>
      http.get<AdminPaged<AdminHostSummary>>(`${A}/hosts${qs(p)}`),
    get: (id: string) => http.get<AdminHostDetail>(`${A}/hosts/${id}`),
    documents: (id: string) => http.get<AdminHostDocument[]>(`${A}/hosts/${id}/documents`),
    // The signed link also needs the admin's bearer token, so fetch → save.
    downloadDocument: (doc: AdminHostDocument) => downloadFile(doc.url, doc.fileName),
    verify: (id: string) => http.post<AdminHostDetail>(`${A}/hosts/${id}/verify`, {}),
    reject: (id: string, reason: string) => http.post<AdminHostDetail>(`${A}/hosts/${id}/reject`, { reason }),
    revoke: (id: string, reason?: string) => http.post<AdminHostDetail>(`${A}/hosts/${id}/revoke`, { reason: reason || null }),
    markFounding: (id: string) => http.post<AdminHostDetail>(`${A}/hosts/${id}/founding`, {}),
    removeFounding: (id: string) => http.del<AdminHostDetail>(`${A}/hosts/${id}/founding`),
    close: (id: string, reason?: string) => http.post<AdminCloseHostResult>(`${A}/hosts/${id}/close`, reason ? { reason } : {}),
    reopen: (id: string) => http.post<AdminReopenHostResult>(`${A}/hosts/${id}/reopen`, {}),
    // 204 on success; 409 (AdminDeleteHostConflict) when it has trips or payments.
    remove: (id: string) => http.del<void>(`${A}/hosts/${id}`),
    recordOperatorPlan: (id: string, body: OperatorPlanInput) =>
      http.post<AdminHostDetail>(`${A}/hosts/${id}/operator-plan`, body),
  },
  payments: {
    list: (p: PaymentsQuery) => http.get<AdminPaged<AdminPayment>>(`${A}/payments${qs(p)}`),
    get: (reference: string) => http.get<AdminPaymentDetail>(`${A}/payments/${encodeURIComponent(reference)}`),
  },
  events: {
    list: (p: { page?: number; pageSize?: number; unprocessed?: boolean; eventType?: string; reference?: string }) =>
      http.get<AdminPaged<AdminPaymentEvent>>(`${A}/payment-events${qs({ ...p, unprocessed: p.unprocessed ? true : undefined })}`),
    get: (id: string) => http.get<AdminPaymentEventDetail>(`${A}/payment-events/${id}`),
    reprocess: (id: string) => http.post<AdminReprocessResult>(`${A}/payment-events/${id}/reprocess`, {}),
  },
  insights: (p: { from?: string; to?: string } = {}) => http.get<AdminHostingInsights>(`${A}/insights/hosting${qs(p)}`),
};
