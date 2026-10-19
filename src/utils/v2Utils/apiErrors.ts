import { isApiError } from "../../dataStore/v2Api/client";

// Turns an API error into a message for the user. `byStatus` overrides the
// server's text for statuses where we know what happened (e.g. 409s).
export function friendlyError(
  e: unknown,
  byStatus: Partial<Record<number, string>>,
  fallback = "Something went wrong. Please try again."
): string {
  if (isApiError(e)) {
    if (byStatus[e.status]) return byStatus[e.status]!;
    if (e.status === 429) return "Too many requests. Please wait a minute and try again.";
    return e.message || fallback;
  }
  return e instanceof Error && e.message ? e.message : fallback;
}

// Messages for the trip-interest conflicts the API reports with 409.
export const TRIP_CONFLICTS = {
  join: "Your request for this trip was declined, so you can't request it again.",
  approve: "This trip isn't open any more, or the group is already full.",
  withdraw: "This request can't be withdrawn because it's no longer pending or approved.",
};
