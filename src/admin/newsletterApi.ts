// Admin weekly-newsletter endpoints (/api/admin/newsletter). Subscriber list
// endpoints stay in api.ts (adminApi.newsletter).
//
// Lifecycle: Draft → Approved → Sending → Sent; Draft/Approved/Sending →
// Cancelled. Editing an Approved issue puts it back to Draft. Only Approved
// issues are sent. Errors: 400 { errors: { Field: [msg] } }, 409 { error }.
import { http } from "../dataStore/v2Api/client";
import type { AdminPaged } from "./api";

const A = "/api/admin/newsletter";

function qs(params: Record<string, unknown>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export const ISSUE_STATUSES = ["Draft", "Approved", "Sending", "Sent", "Cancelled"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export const issueStatusTone = (s: IssueStatus) =>
  s === "Sent" ? "good" : s === "Approved" ? "info" : s === "Sending" ? "warn" : s === "Cancelled" ? "bad" : "neutral";

export const DELIVERY_STATUSES = ["Pending", "Sent", "Failed", "Skipped"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export const deliveryStatusTone = (s: DeliveryStatus) =>
  s === "Sent" ? "good" : s === "Failed" ? "bad" : s === "Pending" ? "info" : "neutral";

export const MAX_SUBJECT = 150;
export const MAX_PREVIEW_TEXT = 200;

export interface NewsletterAudience {
  activeSubscribers: number;
  unsubscribedSubscribers: number;
  optedInUsers: number;
  optedOutUsers: number;
  totalUniqueRecipients: number;
}

export interface NewsletterIssueSummary {
  id: string;
  issueDate: string; // yyyy-MM-dd (the send day, WAT)
  subject: string;
  previewText: string;
  status: IssueStatus;
  scheduledFor: string; // UTC
  generatedAt: string;
  approvedAt: string | null;
  sendStartedAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterIssue extends NewsletterIssueSummary {
  bodyMarkdown: string;
  approvedByUserId: string | null;
  deliveries: { pending: number; sent: number; failed: number; skipped: number };
  previewHtml: string; // full email; the unsubscribe link is a placeholder
}

export interface NewsletterDelivery {
  id: string;
  email: string;
  userId: string | null;
  status: DeliveryStatus;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
}

export interface IssueEdit {
  subject?: string;
  previewText?: string;
  bodyMarkdown?: string;
}

export const newsletterAdminApi = {
  audience: () => http.get<NewsletterAudience>(`${A}/audience`),
  list: (q: { status?: string; page?: number; pageSize?: number }) =>
    http.get<AdminPaged<NewsletterIssueSummary>>(`${A}/issues${qs(q)}`),
  get: (id: string) => http.get<NewsletterIssue>(`${A}/issues/${id}`),
  // Creates, or regenerates, the Draft for the next send day (or issueDate, a future Friday).
  generate: (issueDate?: string) =>
    http.post<NewsletterIssue>(`${A}/issues/generate`, issueDate ? { issueDate } : {}),
  update: (id: string, body: IssueEdit) => http.patch<NewsletterIssue>(`${A}/issues/${id}`, body),
  // Sends to the signed-in admin only.
  sendTest: (id: string) => http.post<{ sentTo: string }>(`${A}/issues/${id}/test`, {}),
  // Without a time: the issue's default send time (10:00 WAT on its issue date).
  approve: (id: string, scheduledFor?: string | null) =>
    http.post<NewsletterIssue>(`${A}/issues/${id}/approve`, scheduledFor ? { scheduledFor } : {}),
  unapprove: (id: string) => http.post<NewsletterIssue>(`${A}/issues/${id}/unapprove`, {}),
  cancel: (id: string) => http.post<NewsletterIssue>(`${A}/issues/${id}/cancel`, {}),
  sendNow: (id: string) => http.post<NewsletterIssue>(`${A}/issues/${id}/send-now`, {}),
  deliveries: (id: string, q: { status?: string; page?: number; pageSize?: number }) =>
    http.get<AdminPaged<NewsletterDelivery>>(`${A}/issues/${id}/deliveries${qs(q)}`),
};
