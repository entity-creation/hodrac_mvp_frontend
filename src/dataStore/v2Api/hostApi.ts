// Hodrac Host endpoints: host onboarding, hosted trips, the manifest, and the
// traveller's terms / balance / checkout / receipts. Same auth, refresh and
// error handling as the rest of the API client.
import { downloadFile, http, isApiError, normalizeTrip } from "./client";
import type { TripPost } from "../../types";
import type {
  AcceptTermsResult, Balance, CheckoutInput, CheckoutResult, HostBank, HostDashboardFilters, HostDashboardSummary,
  HostDashboardTraveller, HostDashboardTravellerFilters, HostDashboardTravellerSort, HostDashboardTrip,
  HostDashboardTripSort, HostPaged, HostProfile, HostProfileInput, HostTripSummary, HostWeeklyReport,
  HostedTripFields, InstalmentDate, Manifest, ManualPayment, ManualPaymentInput, ManualPaymentResult,
  PaymentReceipt, PayoutAccountResult, RemoveTravellerResult, TripTerms, VerificationInput, VerifyResult,
  WhatsAppNudge,
} from "../../types/host";

const enc = encodeURIComponent;

const qs = (params: object) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${enc(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
};

const D = "/api/host/dashboard";
type Paging = { page?: number; pageSize?: number }; // pageSize ≤ 100

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
  // Changing an existing account needs the host's password on the confirm call.
  payoutAccount: (bankCode: string, accountNumber: string, confirm = false, password?: string) =>
    http.post<PayoutAccountResult>("/api/host/payout-account",
      { bankCode, accountNumber, confirm, ...(confirm && password !== undefined ? { password } : {}) }),

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

  // Allowed once the deposit is paid and an instalment is past due and unpaid
  // (row.canRemove). Payments are kept; the seat and chat place are freed.
  removeTraveller: (tripId: string, interestId: string, reason?: string) =>
    http.post<RemoveTravellerResult>(`/api/host/trips/${tripId}/travellers/${interestId}/remove`, { reason: reason?.trim() || null }),

  // All trips. Closed hosts can use these too. Bad filters return 400.
  dashboard: {
    // Totals cover all time for the filtered trips; paidFrom/paidTo only set the
    // chart period (default the last 12 months, at most 36).
    summary: (f: HostDashboardFilters & { paidFrom?: string; paidTo?: string } = {}) =>
      http.get<HostDashboardSummary>(`${D}/summary${qs(f)}`),
    trips: (f: HostDashboardFilters & Paging & { sort?: HostDashboardTripSort } = {}) =>
      http.get<HostPaged<HostDashboardTrip>>(`${D}/trips${qs(f)}`),
    travellers: (f: HostDashboardTravellerFilters & Paging & { sort?: HostDashboardTravellerSort } = {}) =>
      http.get<HostPaged<HostDashboardTraveller>>(`${D}/travellers${qs(f)}`),
    // Same filters and sort, up to 10,000 rows.
    downloadTripsCsv: (f: HostDashboardFilters & { sort?: HostDashboardTripSort } = {}) =>
      downloadFile(`${D}/trips.csv${qs(f)}`, "hosted-trips.csv"),
    downloadTravellersCsv: (f: HostDashboardTravellerFilters & { sort?: HostDashboardTravellerSort } = {}) =>
      downloadFile(`${D}/travellers.csv${qs(f)}`, "travellers.csv"),
  },

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
  // instalmentDates only on TravellerChooses trips (errors keyed instalmentDates[i].dueDate).
  acceptTerms: (tripId: string, interestId: string, termsVersion: number, instalmentDates?: InstalmentDate[]) =>
    http.post<AcceptTermsResult>(`/api/trips/${tripId}/interests/${interestId}/accept-terms`,
      instalmentDates ? { termsVersion, instalmentDates } : { termsVersion }),
  // TravellerChooses, when balance.canChangeDates: move unpaid instalments. Returns the new balance.
  changeInstalmentDates: (tripId: string, interestId: string, instalmentDates: InstalmentDate[]) =>
    http.put<Balance>(`/api/trips/${tripId}/interests/${interestId}/instalment-dates`, { instalmentDates }),
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
