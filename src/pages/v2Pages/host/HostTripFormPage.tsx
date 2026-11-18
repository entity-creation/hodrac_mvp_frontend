import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Globe2, Lock, LockKeyhole, Map, MapPin, PenLine, Plus, Send, Trash2 } from "lucide-react";
import { tripClient } from "../../../dataStore/v2Api/client";
import { hostApi, hostedTripApi, paymentsApi } from "../../../dataStore/v2Api/hostApi";
import { Button, FullPageSpinner } from "../../../components/v2Components/ui";
import { FormError, HostClosedBanner, HostField } from "../../../components/v2Components/host/HostUi";
import { inputClass } from "../../../components/v2Components/host/hostStyles";
import { fieldErrors, formatNaira, formErrorText, splitEvenly, trackHost } from "../../../utils/v2Utils/host";
import { TERMS_TEMPLATES, parseNaira, toInstalments, validateSchedule, type ScheduleRow } from "../../../utils/v2Utils/hostSchedule";
import { flyerHref } from "../../../utils/v2Utils/hostOffer";
import { ROUTES, hostManifestPath } from "../../../utils/v2Utils/routes";
import type { DestinationSearchResult, TripPost, WishlistSearchResult } from "../../../types";
import type { FeeMode, HostProfile } from "../../../types/host";

type Mode = "destination" | "wishlist" | "freetext";
type Picked = { id: string; name: string };

const FEE_PERCENT = 2.5; // for the on-screen estimate only; the server computes real fees

interface Loaded {
  profile: HostProfile;
  trip: TripPost | null;     // null when creating
  termsText: string;
  moneyLocked: boolean;      // someone has paid through Hodrac, or the host account is closed
}

// /host/trips/new and /host/trips/:id/edit (also turns a community trip of
// yours into a hosted trip).
export default function HostTripFormPage() {
  const { id } = useParams<{ id: string }>();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState("");
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const profile = await hostApi.myProfile();
      if (!profile) { if (!cancelled) setNoProfile(true); return; }
      if (!id) { if (!cancelled) setLoaded({ profile, trip: null, termsText: "", moneyLocked: false }); return; }
      const trip = await tripClient.getTrip(id);
      const hosted = trip.tripType === "hosted";
      const [terms, summaries] = await Promise.all([
        hosted ? paymentsApi.terms(id).catch(() => null) : Promise.resolve(null),
        hosted ? hostApi.trips().catch(() => []) : Promise.resolve([]),
      ]);
      const summary = summaries.find(s => s.id === id);
      if (!cancelled) setLoaded({ profile, trip, termsText: terms?.termsText ?? "", moneyLocked: !!profile.closedAt || (summary?.collectedKobo ?? 0) > 0 });
    })().catch(e => { if (!cancelled) setLoadError(formErrorText(e, { 404: "This trip doesn't exist or isn't yours." }, "Couldn't load this trip.")); });
    return () => { cancelled = true; };
  }, [id]);

  if (noProfile) return <Navigate to={ROUTES.HOST.ONBOARDING} replace />;
  if (loadError) return <div className="max-w-xl mx-auto px-5 py-16"><FormError message={loadError} /></div>;
  if (!loaded) return <FullPageSpinner />;
  // Closed hosts can't create hosted trips (or turn a community trip into one).
  if (loaded.profile.closedAt && (!loaded.trip || loaded.trip.tripType === "community")) {
    return (
      <div className="max-w-2xl mx-auto px-5 md:px-8 pt-10 pb-24 space-y-6">
        <h1 className="text-4xl font-light text-ink">Create a hosted trip</h1>
        <HostClosedBanner profile={loaded.profile} />
        <Link to={ROUTES.HOST.TRIPS} className="inline-block text-ink underline underline-offset-4">Go to your trips</Link>
      </div>
    );
  }
  return <HostTripForm {...loaded} />;
}

function HostTripForm({ profile, trip, termsText: initialTerms, moneyLocked }: Loaded) {
  const navigate = useNavigate();
  const editing = !!trip;
  const converting = trip?.tripType === "community";

  // Where (create only; the API can't change it later)
  const [mode, setMode] = useState<Mode>("destination");
  const [picked, setPicked] = useState<Picked | null>(null);
  const [freeText, setFreeText] = useState("");

  // Dates, seats, page
  const [startDate, setStartDate] = useState(trip?.startDate ?? "");
  const [endDate, setEndDate] = useState(trip?.endDate ?? "");
  const [seats, setSeats] = useState(trip?.maxGroupSize ? String(trip.maxGroupSize - 1) : "");
  const [caption, setCaption] = useState(trip?.caption ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(trip?.coverImageUrl ?? "");

  // Money
  const [price, setPrice] = useState(trip?.pricePerSeatKobo ? String(trip.pricePerSeatKobo / 100) : "");
  const [deposit, setDeposit] = useState(trip?.depositKobo ? String(trip.depositKobo / 100) : "");
  const [rows, setRows] = useState<ScheduleRow[]>(
    (trip?.instalments ?? []).map(i => ({ amountNaira: String(i.amountKobo / 100), dueDate: i.dueDate })));
  const [feeMode, setFeeMode] = useState<FeeMode>(trip?.feeMode ?? "PassToTraveller");

  // Terms & details
  const [terms, setTerms] = useState(initialTerms);
  const [inclusions, setInclusions] = useState(trip?.inclusions ?? "");
  const [exclusions, setExclusions] = useState(trip?.exclusions ?? "");
  const [isListed, setIsListed] = useState(trip?.tripType === "hosted" ? !!trip.isListed : false);
  // Trip responses don't include the hold length, so edits only send it when changed.
  const [seatHoldHours, setSeatHoldHours] = useState<number | null>(editing ? null : 48);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const priceKobo = Math.round((parseNaira(price) || 0) * 100);
  const depositKobo = Math.round((parseNaira(deposit) || 0) * 100);
  const instalments = toInstalments(rows);
  const liveSchedule = useMemo(
    () => validateSchedule({ priceKobo, depositKobo, instalments, startDate }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [priceKobo, depositKobo, JSON.stringify(instalments), startDate],
  );

  const feeWaived =
    (profile.plan === "Operator" && !!profile.operatorPlanExpiresAt && new Date(profile.operatorPlanExpiresAt) > new Date()) ||
    (!editing && profile.isFoundingHost && !profile.foundingFreeDepartureUsed);
  const feeEstimate = feeWaived ? 0 : Math.round(priceKobo * FEE_PERCENT / 100);

  const splitRemaining = (count: number) => {
    const remaining = priceKobo - depositKobo;
    if (remaining <= 0 || count <= 0) return;
    const amounts = splitEvenly(remaining, count);
    setRows(amounts.map((k, i) => ({ amountNaira: String(k / 100), dueDate: rows[i]?.dueDate ?? "" })));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!editing) {
      if (mode === "freetext" ? !freeText.trim() : !picked) e.place = "Choose where the trip goes.";
    }
    if (!startDate || !endDate) e.dates = "Hosted trips need start and end dates.";
    else if (endDate < startDate) e.dates = "The end date must be on or after the start date.";
    const n = Number(seats);
    if (!Number.isInteger(n) || n < 1) e.maxGroupSize = "Enter how many seats you're selling.";
    if (!caption.trim()) e.caption = "Add a short description of the trip.";
    if (coverImageUrl.trim() && !/^https?:\/\/\S+$/i.test(coverImageUrl.trim())) e.coverImageUrl = "Use a full image link (https://…).";
    if (!terms.trim()) e.termsText = "Write your refund and dropout terms.";
    if (!moneyLocked) Object.assign(e, liveSchedule);
    return e;
  };

  const save = async () => {
    const local = validate();
    setErrors(local);
    setFormError("");
    if (Object.keys(local).length) {
      setFormError("Please check the highlighted fields.");
      return;
    }
    if (!profile.payoutAccountSet && !profile.closedAt) return;

    const money = moneyLocked ? {} : { pricePerSeatKobo: priceKobo, depositKobo, instalments, feeMode };
    const common = {
      startDate, endDate, isDateFlexible: false,
      caption: caption.trim(),
      coverImageUrl: coverImageUrl.trim() || (editing ? "" : null),
      maxGroupSize: Number(seats) + 1, // the group includes the host
      isListed,
      ...(seatHoldHours != null ? { seatHoldHours } : {}),
      inclusions: inclusions.trim() || (editing ? "" : null),
      exclusions: exclusions.trim() || (editing ? "" : null),
      ...money,
    };
    // Editing the terms bumps their version, so only send them when changed.
    const termsChanged = terms.trim() !== initialTerms.trim();

    setSaving(true);
    try {
      let saved: TripPost;
      if (!trip) {
        saved = await hostedTripApi.create({
          ...common,
          termsText: terms.trim(),
          destinationId: mode === "destination" ? picked?.id ?? null : null,
          wishlistId: mode === "wishlist" ? picked?.id ?? null : null,
          freeTextDestination: mode === "freetext" ? freeText.trim() : null,
        });
        trackHost("host_trip_published", { listed: isListed, feeMode });
      } else {
        saved = await hostedTripApi.update(trip.id, {
          ...common,
          ...(converting ? { isHostedTrip: true, termsText: terms.trim() } : termsChanged ? { termsText: terms.trim() } : {}),
        });
      }
      navigate(hostManifestPath(saved.id));
    } catch (e) {
      setErrors(mapServerErrors(fieldErrors(e)));
      setFormError(formErrorText(e, { 404: "This trip no longer exists." }, "Couldn't save this trip."));
    } finally {
      setSaving(false);
    }
  };

  const err = (k: string) => errors[k];

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 pt-10 pb-24 space-y-10">
      <header>
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-3">Hodrac Host</p>
        <h1 className="text-4xl font-light text-ink">
          {converting ? "Sell seats on this trip" : editing ? "Edit hosted trip" : "Create a hosted trip"}
        </h1>
        {editing && <p className="text-ink-soft mt-2">{trip.destinationLabel}</p>}
      </header>

      <HostClosedBanner profile={profile} />
      {!profile.closedAt && !profile.payoutAccountSet && (
        <FormError message="Add a payout account before you publish, so travellers' payments have somewhere to go." />
      )}
      {!profile.closedAt && profile.payoutAccountSet && profile.verificationStatus !== "Verified" && (
        <p className="rounded-2xl bg-sun-100 border border-sun-300 text-ink px-4 py-3 text-sm">
          You can publish and share this trip now. Payments open once you're verified.
        </p>
      )}

      {!editing && (
        <Section title="Where">
          <PlacePicker mode={mode} setMode={m => { setMode(m); setPicked(null); }} picked={picked} setPicked={setPicked}
            freeText={freeText} setFreeText={setFreeText} />
          {err("place") && <p className="text-xs text-red-700">{err("place")}</p>}
          <p className="text-sm text-ink-muted">
            Have a flyer instead? <a href={flyerHref()} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-ink inline-flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Send it to us</a> and we'll build the page within 24 hours.
          </p>
        </Section>
      )}

      <Section title="Dates and seats">
        <div className="grid sm:grid-cols-2 gap-4">
          <HostField label="Start date *" error={err("dates")}>
            <input type="date" className={inputClass} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </HostField>
          <HostField label="End date *">
            <input type="date" className={inputClass} value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} />
          </HostField>
        </div>
        <HostField label="Seats for sale *" hint="Travellers, not counting you." error={err("maxGroupSize")}>
          <input type="number" min={1} className={`${inputClass} max-w-40`} value={seats} onChange={e => setSeats(e.target.value)} />
        </HostField>
        <HostField label="Short description *" error={err("caption")}>
          <textarea className={`${inputClass} min-h-24`} value={caption} onChange={e => setCaption(e.target.value)} maxLength={2000}
            placeholder="What the trip is about and who it's for." />
        </HostField>
        <HostField label="Cover image link" hint="Optional. A photo for the trip page (https://…)." error={err("coverImageUrl")}>
          <input type="url" className={inputClass} value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="https://" />
        </HostField>
      </Section>

      <Section title="Price and payments" locked={moneyLocked}>
        {moneyLocked && (
          <p className="text-sm text-ink-soft flex items-start gap-2" title="Travellers have paid against this schedule">
            <LockKeyhole className="w-4 h-4 mt-0.5 shrink-0" />
            {profile.closedAt
              ? "Price, deposit, instalments and fee mode can't change while your host account is closed."
              : "Price, deposit, instalments and fee mode can't change once a traveller has paid."}
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <HostField label="Price per seat (₦) *" error={err("pricePerSeatKobo")}>
            <input inputMode="numeric" className={inputClass} value={price} disabled={moneyLocked} onChange={e => setPrice(e.target.value)} placeholder="650,000" />
          </HostField>
          <HostField label="Deposit (₦) *" hint="Paid first, to secure the seat." error={err("depositKobo")}>
            <input inputMode="numeric" className={inputClass} value={deposit} disabled={moneyLocked} onChange={e => setDeposit(e.target.value)} placeholder="150,000" />
          </HostField>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-ink">Instalments</p>
            {!moneyLocked && priceKobo > depositKobo && depositKobo > 0 && (
              <div className="flex items-center gap-2 text-sm text-ink-soft">
                Split the rest evenly into
                {[1, 2, 3].map(n => (
                  <button key={n} type="button" onClick={() => splitRemaining(n)}
                    className="rounded-full border border-line px-2.5 py-0.5 hover:border-ink text-ink">{n}</button>
                ))}
              </div>
            )}
          </div>
          {rows.length === 0 && <p className="text-sm text-ink-muted">None: travellers pay the rest with the deposit as one payment.</p>}
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-start">
                <span className="text-sm text-ink-muted pt-3 w-6">{i + 1}.</span>
                <div>
                  <input inputMode="numeric" className={inputClass} value={r.amountNaira} disabled={moneyLocked} aria-label={`Instalment ${i + 1} amount`}
                    placeholder="₦" onChange={e => setRows(rs => rs.map((x, j) => (j === i ? { ...x, amountNaira: e.target.value } : x)))} />
                  {err(`instalments[${i}].amountKobo`) && <p className="text-xs text-red-700 mt-1">{err(`instalments[${i}].amountKobo`)}</p>}
                </div>
                <div>
                  <input type="date" className={inputClass} value={r.dueDate} disabled={moneyLocked} max={startDate || undefined} aria-label={`Instalment ${i + 1} due date`}
                    onChange={e => setRows(rs => rs.map((x, j) => (j === i ? { ...x, dueDate: e.target.value } : x)))} />
                  {err(`instalments[${i}].dueDate`) && <p className="text-xs text-red-700 mt-1">{err(`instalments[${i}].dueDate`)}</p>}
                </div>
                {!moneyLocked && (
                  <button type="button" aria-label={`Remove instalment ${i + 1}`} onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}
                    className="w-11 h-11 rounded-2xl border border-line text-ink-muted hover:text-ink flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {!moneyLocked && rows.length < 12 && (
            <button type="button" onClick={() => setRows(rs => [...rs, { amountNaira: "", dueDate: "" }])}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
              <Plus className="w-4 h-4" /> Add an instalment
            </button>
          )}
          {!moneyLocked && priceKobo > 0 && depositKobo > 0 && (
            <p className={`text-sm mt-3 ${liveSchedule.instalments ? "text-red-700" : "text-palm"}`}>
              {liveSchedule.instalments ?? `Deposit plus instalments add up to ${formatNaira(priceKobo)}.`}
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-2">Hodrac's 2.5% fee</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {([
              ["PassToTraveller", "Travellers pay it", "Added to each payment as a booking fee."],
              ["HostAbsorbs", "I absorb it", "Taken from what you receive."],
            ] as const).map(([value, title, body]) => (
              <button key={value} type="button" disabled={moneyLocked} onClick={() => setFeeMode(value)} aria-pressed={feeMode === value}
                className={`text-left rounded-2xl border px-4 py-3 transition-colors disabled:opacity-60 ${feeMode === value ? "border-ink bg-white" : "border-line hover:border-ink/40"}`}>
                <span className="block text-sm text-ink font-medium">{title}</span>
                <span className="block text-xs text-ink-muted mt-0.5">{body}</span>
              </button>
            ))}
          </div>
          {priceKobo > 0 && (
            <p className="text-sm text-ink-soft mt-3">
              {feeWaived
                ? "No Hodrac fee on this trip."
                : feeMode === "PassToTraveller"
                  ? <>Travellers pay {formatNaira(priceKobo)} + about {formatNaira(feeEstimate)} booking fee; you receive {formatNaira(priceKobo)}.</>
                  : <>Travellers pay {formatNaira(priceKobo)}; you receive about {formatNaira(priceKobo - feeEstimate)}.</>}
              <span className="block text-xs text-ink-muted mt-1">The exact fee is worked out on each payment, rounded to the kobo.</span>
            </p>
          )}
        </div>
      </Section>

      <Section title="Refund and dropout terms">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">Start from:</span>
          {TERMS_TEMPLATES.map(t => (
            <button key={t.label} type="button" onClick={() => setTerms(t.text)}
              className="rounded-full border border-line px-3 py-1 text-ink hover:border-ink">{t.label}</button>
          ))}
        </div>
        <HostField label="Your terms *" error={err("termsText")}
          hint={editing && !converting
            ? "Travellers must accept these before paying. Changes only apply to travellers who haven't accepted yet."
            : "Travellers must accept these before paying. Changing them later only affects new travellers."}>
          <textarea className={`${inputClass} min-h-56 font-mono text-[13px] leading-relaxed`} value={terms} maxLength={20000}
            onChange={e => setTerms(e.target.value)} placeholder="What's refunded if someone drops out, and when." />
        </HostField>
      </Section>

      <Section title="What's included">
        <div className="grid sm:grid-cols-2 gap-4">
          <HostField label="Included" hint="One item per line.">
            <textarea className={`${inputClass} min-h-32`} value={inclusions} maxLength={4000} onChange={e => setInclusions(e.target.value)}
              placeholder={"Return flights\n4 nights' hotel\nAirport transfers"} />
          </HostField>
          <HostField label="Not included" hint="One item per line.">
            <textarea className={`${inputClass} min-h-32`} value={exclusions} maxLength={4000} onChange={e => setExclusions(e.target.value)}
              placeholder={"Visa fees\nTravel insurance"} />
          </HostField>
        </div>
      </Section>

      <Section title="Visibility and seat hold">
        <div className="grid sm:grid-cols-2 gap-2">
          {([
            [false, Lock, "Private", "Only people with your link can see it."],
            [true, Globe2, "List in Hodrac's trip feed", "Anyone browsing trips can find it."],
          ] as const).map(([value, Icon, title, body]) => (
            <button key={String(value)} type="button" onClick={() => setIsListed(value)} aria-pressed={isListed === value}
              className={`text-left rounded-2xl border px-4 py-3 transition-colors ${isListed === value ? "border-ink bg-white" : "border-line hover:border-ink/40"}`}>
              <span className="flex items-center gap-2 text-sm text-ink font-medium"><Icon className="w-4 h-4" /> {title}</span>
              <span className="block text-xs text-ink-muted mt-0.5">{body}</span>
            </button>
          ))}
        </div>
        <HostField label="Hold an approved seat for" hint="If the deposit isn't paid in time, the seat is released.">
          <select className={`${inputClass} max-w-48`} value={seatHoldHours ?? ""} onChange={e => setSeatHoldHours(e.target.value ? Number(e.target.value) : null)}>
            {seatHoldHours == null && <option value="">Keep current setting</option>}
            {[24, 48, 72].map(h => <option key={h} value={h}>{h} hours</option>)}
          </select>
        </HostField>
      </Section>

      <div className="space-y-3">
        <FormError message={formError} />
        {!profile.payoutAccountSet && !profile.closedAt ? (
          <Link to={ROUTES.HOST.ONBOARDING} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink text-white font-medium">
            Add a payout account first
          </Link>
        ) : (
          <Button size="lg" loading={saving} onClick={save}>{editing && !converting ? "Save changes" : "Publish trip"}</Button>
        )}
      </div>
    </div>
  );
}

// Server field keys → the keys this form shows errors under.
function mapServerErrors(e: Record<string, string>): Record<string, string> {
  const out = { ...e };
  if (e.startDate || e.endDate) out.dates = e.startDate ?? e.endDate;
  return out;
}

function Section({ title, locked, children }: { title: string; locked?: boolean; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-normal text-ink flex items-center gap-2">
        {title} {locked && <LockKeyhole className="w-4 h-4 text-ink-muted" aria-label="Locked" />}
      </h2>
      {children}
    </section>
  );
}

const MODES: { value: Mode; label: string; icon: typeof MapPin }[] = [
  { value: "destination", label: "A place", icon: MapPin },
  { value: "wishlist", label: "An itinerary", icon: Map },
  { value: "freetext", label: "Describe it", icon: PenLine },
];

function PlacePicker({ mode, setMode, picked, setPicked, freeText, setFreeText }: {
  mode: Mode; setMode: (m: Mode) => void; picked: Picked | null; setPicked: (p: Picked | null) => void;
  freeText: string; setFreeText: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Picked[]>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (mode === "freetext" || !query.trim()) return;
    timer.current = window.setTimeout(async () => {
      try {
        const found: (DestinationSearchResult | WishlistSearchResult)[] = mode === "destination"
          ? await tripClient.searchDestinations(query.trim())
          : await tripClient.searchWishlists(query.trim());
        setResults(found.map(f => ({ id: f.id, name: f.name })));
      } catch {
        setResults([]);
      }
    }, 250);
    return () => window.clearTimeout(timer.current);
  }, [query, mode]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODES.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" onClick={() => { setMode(value); setQuery(""); setResults([]); }} aria-pressed={mode === value}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm ${mode === value ? "border-ink bg-ink text-white" : "border-line text-ink hover:border-ink/40"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      {mode === "freetext" ? (
        <input className={inputClass} value={freeText} onChange={e => setFreeText(e.target.value)} maxLength={200} placeholder="e.g. Zanzibar, Tanzania" />
      ) : picked ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink bg-white px-4 py-3">
          <span className="text-sm text-ink truncate">{picked.name}</span>
          <button type="button" className="text-sm text-ink-soft hover:text-ink underline underline-offset-4" onClick={() => setPicked(null)}>Change</button>
        </div>
      ) : (
        <div className="relative">
          <input className={inputClass} value={query} onChange={e => setQuery(e.target.value)}
            placeholder={mode === "destination" ? "Search destinations" : "Search wishlists and itineraries"} />
          {query.trim() && results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-line rounded-2xl shadow-pop-lg max-h-64 overflow-auto py-1">
              {results.map(r => (
                <li key={r.id}>
                  <button type="button" onClick={() => { setPicked(r); setQuery(""); setResults([]); }}
                    className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-cream-deep">{r.name}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
