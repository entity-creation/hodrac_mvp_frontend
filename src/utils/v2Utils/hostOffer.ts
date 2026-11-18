// Offer details shown on Host pages.

// Founding hosts: first departure free until the end of 28 Feb 2027 (WAT).
const FOUNDING_DEADLINE = new Date("2027-02-28T23:59:59+01:00");
export const foundingOfferOpen = () => Date.now() <= FOUNDING_DEADLINE.getTime();

// "Send us your flyer": WhatsApp when VITE_HODRAC_WHATSAPP (digits, e.g.
// 2348012345678) is set, otherwise email.
const FLYER_TEXT = "Hi Hodrac, I'd like you to build my trip page. Here's my flyer:";
export function flyerHref(): string {
  const wa = (import.meta.env.VITE_HODRAC_WHATSAPP as string | undefined)?.replace(/\D/g, "");
  if (wa) return `https://wa.me/${wa}?text=${encodeURIComponent(FLYER_TEXT)}`;
  return `mailto:support@hodrac.com?subject=${encodeURIComponent("Build my trip page")}&body=${encodeURIComponent(FLYER_TEXT)}`;
}
