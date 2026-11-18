// Paystack only sends back the payment reference, so remember which trip a
// checkout belongs to (for "Try again" after a failed payment).
const key = (reference: string) => `hodrac:checkout:${reference}`;

export function rememberCheckout(reference: string, tripId: string) {
  try { sessionStorage.setItem(key(reference), tripId); } catch { /* storage unavailable */ }
}

export function checkoutTrip(reference: string): string | null {
  try { return sessionStorage.getItem(key(reference)); } catch { return null; }
}
