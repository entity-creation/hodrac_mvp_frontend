// Hodrac Host (paid hosted trips). Mirrors the backend DTOs as serialized:
// camelCase, enums as strings, money as integer kobo (₦1 = 100 kobo),
// DateOnly as "yyyy-MM-dd", DateTime as UTC ISO.
import type { TripInterestStatus, TripPost } from "./index";

export type Kobo = number;

export type FeeMode = "PassToTraveller" | "HostAbsorbs";

export type InterestPaymentStatus =
  | "NotRequired"     // community trips
  | "AwaitingDeposit" // approved, seat held until seatHoldExpiresAt
  | "DepositPaid"
  | "PartPaid"
  | "PaidInFull"
  | "Expired"         // seat hold ran out (the interest stays Approved)
  | "Refunded";

export type HostVerificationStatus = "Unverified" | "Pending" | "Verified" | "Rejected";
export type HostPlan = "Host" | "Operator";
export type SeatPaymentKind = "Deposit" | "Instalment" | "Full";
export type SeatPaymentStatus =
  | "Initialized" | "Success" | "Failed" | "Abandoned" | "Refunded" | "PartiallyRefunded" | "Disputed";
export type ManualPaymentMethod = "Transfer" | "Cash" | "Other" | "Refund"; // Refund amounts are negative

// The viewer's next payment on a trip; totalKobo includes the booking fee.
export interface MyNextPayment {
  kind: "Deposit" | "Instalment";
  sequence: number | null;
  totalKobo: Kobo;
  dueDate: string | null;
}

export interface TripInstalment {
  sequence: number; // 1, 2, 3…
  amountKobo: Kobo;
  dueDate: string;  // yyyy-MM-dd
}

// The host block on a hosted trip (never payout or verification documents).
export interface TripHost {
  displayName: string;
  slug: string;
  logoUrl: string | null;
  verified: boolean;
}

// ─── Host profile & onboarding ────────────────────────────────────────────────

export interface HostPayout {
  bankCode: string;
  bankName: string | null;
  accountName: string | null;
  accountLast4: string | null;
}

export interface HostProfile {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  logoUrl: string | null;
  instagramHandle: string | null;
  whatsAppNumber: string | null;
  verificationStatus: HostVerificationStatus;
  verifiedAt: string | null; // also the time of a rejection/revocation
  rejectionReason: string | null;
  cacNumber: string | null;
  hasIdDocument: boolean;
  pastTripProofUrls: string[];
  payoutAccountSet: boolean;
  payoutAccount: HostPayout | null;
  plan: HostPlan;
  operatorPlanExpiresAt: string | null;
  isFoundingHost: boolean;
  foundingFreeDepartureUsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HostProfileInput {
  displayName?: string;
  slug?: string | null;
  bio?: string | null;
  logoUrl?: string | null;
  instagramHandle?: string | null;
  whatsAppNumber?: string | null;
}

export interface HostBank { name: string; code: string }

export interface PayoutAccountResult {
  confirmed: boolean;
  bankCode: string;
  bankName: string;
  accountName: string;
  accountLast4: string;
  profile: HostProfile | null; // set when confirmed
}

export interface VerificationInput {
  cacNumber?: string;
  idDocument?: File | null;
  pastTripProofUrls: string[];
}

// ─── Host trips, manifest, reports ────────────────────────────────────────────

export interface HostTripSummary {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  status: "Open" | "Closed" | "Cancelled";
  isListed: boolean;
  isHidden: boolean;
  seatsTotal: number | null; // = maxGroupSize, which INCLUDES the host
  pricePerSeatKobo: Kobo;
  approved: number;          // approved and not expired
  seatsWithDeposit: number;
  seatsPaidInFull: number;
  collectedKobo: Kobo;       // through Hodrac
  collectedManualKobo: Kobo;
  collectedTotalKobo: Kobo;
  owedKobo: Kobo;
  isUpcoming: boolean;
  isNextDeparture: boolean;
}

export interface ManifestRow {
  interestId: string;
  travellerUserId: string;
  travellerName: string;
  email: string | null;
  phone: string | null;
  interestStatus: "Requested" | "Approved" | "Withdrawn";
  paymentStatus: InterestPaymentStatus;
  termsVersionAccepted: number | null;
  termsAcceptedAt: string | null;
  paidKobo: Kobo;
  viaHodracKobo: Kobo;
  manualKobo: Kobo; // can be negative (refunds)
  owesKobo: Kobo;
  nextDueDate: string | null;
  nextDueAmountKobo: Kobo | null;
  seatHoldExpiresAt: string | null;
  lastReminderAt: string | null;
  requestedAt: string;
}

export interface ManifestTotals {
  travellers: number;
  approved: number;
  seatsWithDeposit: number;
  seatsPaidInFull: number;
  paidKobo: Kobo;
  viaHodracKobo: Kobo;
  manualKobo: Kobo;
  owesKobo: Kobo;
}

export interface Manifest {
  tripId: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  seatsTotal: number | null;
  pricePerSeatKobo: Kobo;
  currency: string;
  termsVersion: number;
  rows: ManifestRow[];
  totals: ManifestTotals;
}

export interface ManualPayment {
  id: string;
  interestId: string;
  amountKobo: Kobo;
  method: ManualPaymentMethod;
  note: string | null;
  recordedByUserId: string;
  recordedAt: string;
}

export interface ManualPaymentInput {
  interestId: string;
  amountKobo: Kobo;
  method: ManualPaymentMethod;
  note?: string | null;
}

export interface ManualPaymentResult {
  payment: ManualPayment;
  amountPaidKobo: Kobo;
  amountPaidViaHodracKobo: Kobo;
  paymentStatus: InterestPaymentStatus;
  seatHoldExpiresAt: string | null;
}

export interface WhatsAppNudge { url: string; phone: string; message: string }

export interface WeeklyReportStats {
  pageViews: number;
  pageViewsBySource: Record<string, number>;
  linkClicks: number;
  joinRequests: number;
  approvals: number;
  seatsPaid: number;
  collectedViaHodracKobo: Kobo;
  collectedManualKobo: Kobo;
  refundedManualKobo: Kobo;
  hodracSharePercentWeek: number | null;     // 0–100
  hodracSharePercentAllTime: number | null;
}

export interface WeeklyReportTrip {
  tripId: string;
  title: string;
  startDate: string | null;
  status: "Open" | "Closed" | "Cancelled";
  stats: WeeklyReportStats;
}

export interface HostWeeklyReport {
  hostProfileId: string;
  hostDisplayName: string;
  weekStart: string;
  weekEnd: string;
  timeZone: string;
  trips: WeeklyReportTrip[];
  totals: WeeklyReportStats;
}

// ─── Hosted trip create / edit ────────────────────────────────────────────────

export interface HostedTripFields {
  isHostedTrip?: boolean;
  isListed?: boolean;
  pricePerSeatKobo?: Kobo | null;
  depositKobo?: Kobo | null;
  instalments?: TripInstalment[] | null;
  feeMode?: FeeMode | null;
  seatHoldHours?: number | null;
  termsText?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
}

// ─── Traveller payments ───────────────────────────────────────────────────────

export interface TripTerms { termsText: string; termsVersion: number; termsUpdatedAt: string | null }

export interface AcceptTermsResult { termsVersionAccepted: number; termsAcceptedAt: string; termsTextSha256: string }

export interface ScheduleLine {
  kind: "Deposit" | "Instalment";
  sequence: number | null;
  amountKobo: Kobo;
  paidKobo: Kobo;
  dueDate: string | null; // null for the deposit
  status: "Paid" | "Overdue" | "Due" | "Upcoming";
  paidAt: string | null;
}

export interface NextPayment {
  kind: "Deposit" | "Instalment";
  sequence: number | null;
  seatAmountKobo: Kobo;
  feeKobo: Kobo; // booking fee the traveller pays (0 if the host absorbs it)
  totalKobo: Kobo;
}

export interface Balance {
  priceKobo: Kobo;
  amountPaidKobo: Kobo;
  owesKobo: Kobo;
  schedule: ScheduleLine[];
  nextPayment: NextPayment | null;
  paymentStatus: InterestPaymentStatus;
  seatHoldExpiresAt: string | null;
  termsVersion: number;
  termsVersionAccepted: number | null;
}

export interface CheckoutInput { kind: SeatPaymentKind; instalmentSequence?: number | null }
export interface CheckoutResult { authorizationUrl: string; reference: string; totalKobo: Kobo }

export interface PaymentReceipt {
  reference: string;
  status: SeatPaymentStatus;
  tripId: string;
  tripTitle: string;
  startDate: string | null;
  endDate: string | null;
  hostDisplayName: string;
  kind: SeatPaymentKind;
  instalmentSequence: number | null;
  seatAmountKobo: Kobo;
  feeKobo: Kobo; // booking fee the traveller paid
  totalKobo: Kobo;
  refundedKobo: Kobo;
  currency: string;
  termsVersionAccepted: number | null;
  paidAt: string | null;
  channel: string | null;
}

export interface VerifyResult { status: SeatPaymentStatus; receipt: PaymentReceipt | null }

// A traveller's request on a hosted trip, with its trip (from /mine/requests).
export interface HostedRequestRef { interestId: string; status: TripInterestStatus; trip: TripPost }
