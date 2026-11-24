// The newsletter runs on WAT (UTC+1, no daylight saving), so its times are
// shown and entered in WAT whatever the admin's own time zone is.

// An issue date is a calendar day ("2026-11-27"), not an instant: format it
// at midday so no time zone moves it to the day before.
export const fmtIssueDate = (d: string) =>
  new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export const fmtWat = (iso: string | null | undefined) =>
  iso
    ? `${new Date(iso).toLocaleString(undefined, {
        timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      })} WAT`
    : "—";

// A datetime-local value ("2026-11-27T10:00") read as WAT → UTC ISO.
export const watInputToIso = (value: string) => (value ? new Date(`${value}:00+01:00`).toISOString() : null);
