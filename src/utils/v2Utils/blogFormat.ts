// Date formatting for blog posts and event cards.

export const fmtPostDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "";

// "Sat 6 Dec, 8:00 pm" in the event's own time zone (times from the API are UTC).
export function fmtEventTime(iso: string, timeZone: string) {
  const opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };
  try {
    return new Date(iso).toLocaleString(undefined, { ...opts, timeZone });
  } catch {
    return new Date(iso).toLocaleString(undefined, opts); // unknown time zone
  }
}
