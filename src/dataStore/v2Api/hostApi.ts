// Hodrac Host endpoints: host onboarding, hosted trips, the manifest, and the
// traveller's terms / balance / checkout / receipts. Same auth, refresh and
// error handling as the rest of the API client.
import { downloadFile, http, isApiError, normalizeTrip } from "./client";
import type { TripPost } from "../../types";
import type {
  AcceptTermsResult, Balance, CheckoutInput, CheckoutResult, HostBank, HostProfile, HostProfileInput,
  HostTripSummary, HostWeeklyReport, HostedTripFields, Manifest, ManualPayment, ManualPaymentInput,
  ManualPaymentResult, PaymentReceipt, PayoutAccountResult, TripTerms, VerificationInput, VerifyResult,
  WhatsAppNudge,
} from "../../types/host";

const enc = encodeURIComponent;

export const hostApi = {
  // null when the user isn't a host yet (404).
  myProfile: () =>
    http.get<HostProfile>("/api/host/profile/me").catch(e => {
      if (isApiError(e, 404)) return null;
      throw e;
    }),
  createProfile: (body: HostProfileInput) => http.post<HostProfile>("/api/host/profile", body),
  // null = unchanged; "" clears bio/logo/instagram/whatsapp.
  updateProfile: (body: HostProfileInput) => http.patch<HostProfile>("/api/host/profile/me", body),

  banks: () => http.get<HostBank[]>("/api/host/banks"),
  // Without confirm: resolves and returns the account name only. With confirm:
  // creates/updates the Paystack subaccount and returns the updated profile.
  payoutAccount: (bankCode: string, accountNumber: string, confirm = false) =>
    http.post<PayoutAccountResult>("/api/host/payout-account", { bankCode, accountNumber, confirm }),

  // multipart: cacNumber, idDocument (PDF/JPG/PNG ≤ 5 MB), pastTripProofUrls (repeated).
  submitVerification: (input: VerificationInput) => {
    const form = new FormData();
    if (input.cacNumber?.trim()) form.append("cacNumber", input.cacNumber.trim());
    if (input.idDocument) form.append("idDocument", input.idDocument);
    for (const url of input.pastTripProofUrls) if (url.trim()) form.append("pastTripProofUrls", url.trim());
    return http.postForm<HostProfile>("/api/host/verification", form);
  },

  trips: () => http.get<HostTripSummary[]>("/api/host/trips"),
  manifest: (tripId: string) => http.get<Manifest>(`/api/host/trips/${tripId}/manifest`),
  downloadManifestCsv: (tripId: string) => downloadFile(`/api/host/trips/${tripId}/manifest.csv`, "manifest.csv"),

  manualPayments: (tripId: string, interestId?: string) =>
    http.get<ManualPayment[]>(`/api/host/trips/${tripId}/manual-payments${interestId ? `?interestId=${enc(interestId)}` : ""}`),
  // Refunds: method "Refund" with a negative amount.
  recordManualPayment: (tripId: string, body: ManualPaymentInput) =>
    http.post<ManualPaymentResult>(`/api/host/trips/${tripId}/manual-payments`, body),
  deleteManualPayment: (tripId: string, paymentId: string) =>
    http.del<ManualPaymentResult>(`/api/host/trips/${tripId}/manual-payments/${paymentId}`),

  whatsAppNudge: (tripId: string, interestId: string) =>
    http.get<WhatsAppNudge>(`/api/host/trips/${tripId}/whatsapp-nudge/${interestId}`),

  // weekStart (yyyy-MM-dd) is moved back to its Monday; default = last full week (WAT).
  weeklyReport: (weekStart?: string) =>
    http.get<HostWeeklyReport>(`/api/host/reports/weekly${weekStart ? `?weekStart=${enc(weekStart)}` : ""}`),
};

// Hosted trip create/edit go through the normal trips endpoints with the
// hosted fields. PATCH returns 204, so edits refetch the trip.
export const hostedTripApi = {
  create: (body: Record<string, unknown> & HostedTripFields) =>
    http.post<TripPost>("/api/trips", { ...body, isHostedTrip: true }).then(normalizeTrip),
  update: async (tripId: string, body: Record<string, unknown> & HostedTripFields) => {
    await http.patch<void>(`/api/trips/${tripId}`, body);
    return http.get<TripPost>(`/api/trips/${tripId}`).then(normalizeTrip);
  },
};

export const paymentsApi = {
  // After a seat hold expires: sends the request back to the host (no body).
  requestAgain: (tripId: string, interestId: string) =>
    http.post<void>(`/api/trips/${tripId}/interests/${interestId}/request-again`, {}),
  terms: (tripId: string) => http.get<TripTerms>(`/api/trips/${tripId}/terms`),
  acceptTerms: (tripId: string, interestId: string, termsVersion: number) =>
    http.post<AcceptTermsResult>(`/api/trips/${tripId}/interests/${interestId}/accept-terms`, { termsVersion }),
  balance: (tripId: string, interestId: string) =>
    http.get<Balance>(`/api/trips/${tripId}/interests/${interestId}/balance`),
  // Returns Paystack's hosted page; redirect the browser to authorizationUrl.
  checkout: (tripId: string, interestId: string, body: CheckoutInput) =>
    http.post<CheckoutResult>(`/api/trips/${tripId}/interests/${interestId}/checkout`, body),
  // "Initialized" = still pending; poll again.
  verify: (reference: string) => http.get<VerifyResult>(`/api/payments/verify/${enc(reference)}`),
  myPayments: () => http.get<PaymentReceipt[]>("/api/me/payments"),
  receipt: (reference: string) => http.get<PaymentReceipt>(`/api/payments/${enc(reference)}/receipt`),
};
