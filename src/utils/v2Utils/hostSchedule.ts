// Client-side checks for a hosted trip's payment schedule, mirroring the
// backend rules so hosts see problems before saving. The server re-checks.
import type { Kobo, TripInstalment } from "../../types/host";
import { formatNaira } from "./host";

export interface ScheduleRow { amountNaira: string; dueDate: string }

// "650,000" / "₦650000" → 650000 (whole naira); NaN when empty/invalid.
export function parseNaira(text: string): number {
  const digits = text.replace(/[^\d.]/g, "");
  return digits ? Number(digits) : NaN;
}

export function toInstalments(rows: ScheduleRow[]): TripInstalment[] {
  return rows.map((r, i) => ({ sequence: i + 1, amountKobo: Math.round(parseNaira(r.amountNaira) * 100), dueDate: r.dueDate }));
}

export function validateSchedule(input: {
  priceKobo: Kobo; depositKobo: Kobo; instalments: TripInstalment[]; startDate: string;
}): Record<string, string> {
  const { priceKobo, depositKobo, instalments, startDate } = input;
  const e: Record<string, string> = {};
  if (!(priceKobo > 0)) e.pricePerSeatKobo = "Enter the price per seat.";
  if (!(depositKobo > 0)) e.depositKobo = "Enter the deposit.";
  else if (priceKobo > 0 && depositKobo > priceKobo) e.depositKobo = "The deposit can't be more than the price per seat.";

  instalments.forEach((ins, i) => {
    if (!(ins.amountKobo > 0)) e[`instalments[${i}].amountKobo`] = "Enter an amount.";
    if (!ins.dueDate) e[`instalments[${i}].dueDate`] = "Choose a due date.";
    else if (i > 0 && instalments[i - 1].dueDate && ins.dueDate <= instalments[i - 1].dueDate)
      e[`instalments[${i}].dueDate`] = "Must be due after the one before it.";
    else if (startDate && ins.dueDate >= startDate) e[`instalments[${i}].dueDate`] = "Must be due before the trip starts.";
  });

  const total = depositKobo + instalments.reduce((s, x) => s + (x.amountKobo > 0 ? x.amountKobo : 0), 0);
  if (priceKobo > 0 && depositKobo > 0 && total !== priceKobo) {
    e.instalments = `The deposit plus all instalments must add up to the price per seat (${total < priceKobo ? "short" : "over"} by ${formatNaira(Math.abs(priceKobo - total))}).`;
  }
  return e;
}

export const TERMS_TEMPLATES: { label: string; text: string }[] = [
  {
    label: "Standard",
    text: `Deposit: non-refundable once paid. It secures your seat.
Instalments: due on the dates shown. If a payment is more than 7 days late, the host may release your seat; money already paid is refunded minus the deposit.
Dropping out: more than 30 days before departure, 50% of what you've paid (minus the deposit) is refunded. Within 30 days of departure, no refund.
Transfers: you may give your seat to someone else with the host's agreement, at no charge.
If the host cancels the trip, you get a full refund of everything you've paid.`,
  },
  {
    label: "Flexible",
    text: `Deposit: refundable up to 60 days before departure, then non-refundable.
Dropping out: more than 45 days before departure, everything except the deposit is refunded. 15–45 days before, 50% is refunded. Within 15 days, no refund.
Transfers: you may give your seat to someone else at no charge.
If the host cancels the trip, you get a full refund of everything you've paid.`,
  },
  {
    label: "Strict",
    text: `All payments are non-refundable once made.
Transfers: you may give your seat to someone else with the host's agreement, up to 14 days before departure.
If the host cancels the trip, you get a full refund of everything you've paid.`,
  },
];
