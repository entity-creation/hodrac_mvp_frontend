import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BarChart3, ExternalLink, Globe2, Lock, Pencil, Plus, Users } from "lucide-react";
import { hostApi } from "../../../dataStore/v2Api/hostApi";
import { ButtonLink, EmptyState, FullPageSpinner } from "../../../components/v2Components/ui";
import { FormError, HostClosedBanner, VerifiedBadge } from "../../../components/v2Components/host/HostUi";
import { formatNaira, formErrorText } from "../../../utils/v2Utils/host";
import { foundingOfferOpen } from "../../../utils/v2Utils/hostOffer";
import { ROUTES, hostEditTripPath, hostManifestPath, tripPath } from "../../../utils/v2Utils/routes";
import type { HostProfile, HostTripSummary } from "../../../types/host";

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

// /host/trips: the host dashboard.
export default function HostTripsPage() {
  const [data, setData] = useState<{ profile: HostProfile | null; trips: HostTripSummary[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([hostApi.myProfile(), hostApi.trips()])
      .then(([profile, trips]) => setData({ profile, trips }))
      .catch(e => setError(formErrorText(e, {}, "Couldn't load your trips.")));
  }, []);

  if (error) return <div className="max-w-xl mx-auto px-5 py-16"><FormError message={error} /></div>;
  if (!data) return <FullPageSpinner />;
  if (!data.profile) return <Navigate to={ROUTES.HOST.ONBOARDING} replace />;

  const { profile, trips } = data;
  const closed = !!profile.closedAt;
  const upcoming = trips.filter(t => t.isUpcoming);
  const past = trips.filter(t => !t.isUpcoming);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 pt-10 pb-24 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-2">Hodrac Host</p>
          <h1 className="text-4xl font-light text-ink flex flex-wrap items-center gap-3">
            {profile.displayName} {profile.verificationStatus === "Verified" && <VerifiedBadge size="md" />}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={ROUTES.HOST.REPORTS} variant="outline"><BarChart3 className="w-4 h-4" /> Weekly report</ButtonLink>
          {!closed && <ButtonLink to={ROUTES.HOST.NEW_TRIP}><Plus className="w-4 h-4" /> New hosted trip</ButtonLink>}
        </div>
      </header>

      {closed ? <HostClosedBanner profile={profile} /> : <Banners profile={profile} />}

      {trips.length === 0 ? (
        <EmptyState emoji="🧳" title="No hosted trips yet"
          subtitle={closed ? "Your host account is closed, so you can't create hosted trips." : "Create a trip page with your price, deposit and instalments, then share the link."}
          action={closed ? undefined : <ButtonLink to={ROUTES.HOST.NEW_TRIP}>Create a hosted trip</ButtonLink>} />
      ) : (
        <>
          {upcoming.length > 0 && <TripList title="Upcoming" trips={upcoming} />}
          {past.length > 0 && <TripList title="Past" trips={past} />}
        </>
      )}
    </div>
  );
}

function Banners({ profile }: { profile: HostProfile }) {
  const items: { tone: "warn" | "info" | "good"; body: React.ReactNode }[] = [];

  if (!profile.payoutAccountSet) {
    items.push({ tone: "warn", body: <>Add a payout account so travellers' payments have somewhere to go. <Link to={ROUTES.HOST.ONBOARDING} className="underline underline-offset-4">Add it now</Link></> });
  }
  if (profile.verificationStatus === "Unverified") {
    items.push({ tone: "warn", body: profile.rejectionReason
      ? <>{profile.rejectionReason} Payments are paused until you're verified again. <Link to={ROUTES.HOST.ONBOARDING} className="underline underline-offset-4">Submit your details</Link></>
      : <>Get verified to open payments and show the Verified host badge. <Link to={ROUTES.HOST.ONBOARDING} className="underline underline-offset-4">Submit your details</Link></> });
  } else if (profile.verificationStatus === "Pending") {
    items.push({ tone: "info", body: "Your verification is being reviewed (usually within 24 hours). Payments open once you're verified." });
  } else if (profile.verificationStatus === "Rejected") {
    items.push({ tone: "warn", body: <>We couldn't verify you{profile.rejectionReason ? `: ${profile.rejectionReason}` : "."} <Link to={ROUTES.HOST.ONBOARDING} className="underline underline-offset-4">Update your details</Link></> });
  }
  if (profile.isFoundingHost && foundingOfferOpen()) {
    items.push({ tone: "good", body: profile.foundingFreeDepartureUsed
      ? "Founding host: your free departure has been used."
      : "Founding host: your next hosted trip has no Hodrac fee (until 28 February 2027)." });
  }
  if (profile.plan === "Operator" && profile.operatorPlanExpiresAt) {
    const expires = new Date(profile.operatorPlanExpiresAt);
    items.push({ tone: expires > new Date() ? "good" : "warn", body: expires > new Date()
      ? `Operator plan: no Hodrac fee until ${expires.toLocaleDateString()}.`
      : `Your Operator plan ended on ${expires.toLocaleDateString()}. The 2.5% fee applies again.` });
  }

  if (!items.length) return null;
  const tone = { warn: "bg-sun-100 border-sun-300", info: "bg-white border-line", good: "bg-palm/10 border-palm/20 text-palm" };
  return (
    <div className="space-y-2">
      {items.map((b, i) => <p key={i} className={`rounded-2xl border px-4 py-3 text-sm text-ink ${tone[b.tone]}`}>{b.body}</p>)}
    </div>
  );
}

function TripList({ title, trips }: { title: string; trips: HostTripSummary[] }) {
  return (
    <section>
      <h2 className="text-xl font-normal text-ink mb-4">{title}</h2>
      <ul className="grid gap-4">
        {trips.map(t => <TripCard key={t.id} trip={t} />)}
      </ul>
    </section>
  );
}

function TripCard({ trip: t }: { trip: HostTripSummary }) {
  const seats = Math.max(0, (t.seatsTotal ?? 1) - 1); // seatsTotal includes the host
  const pct = (n: number) => (seats ? `${Math.min(100, (n / seats) * 100)}%` : "0%");
  const viaHodracShare = t.collectedTotalKobo > 0 ? Math.round((t.collectedKobo / t.collectedTotalKobo) * 100) : null;

  return (
    <li className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {t.isNextDeparture && <span className="rounded-full bg-ink text-white text-[11px] px-2 py-0.5">Next departure</span>}
            <span className="inline-flex items-center gap-1 rounded-full bg-cream-deep text-ink-soft text-[11px] px-2 py-0.5">
              {t.isListed ? <><Globe2 className="w-3 h-3" /> Listed</> : <><Lock className="w-3 h-3" /> Private</>}
            </span>
            {t.status !== "Open" && <span className="rounded-full bg-sun-100 text-sun-500 text-[11px] px-2 py-0.5">{t.status}</span>}
            {t.isHidden && <span className="rounded-full bg-red-50 text-red-700 text-[11px] px-2 py-0.5">Hidden by moderators</span>}
          </div>
          <Link to={hostManifestPath(t.id)} className="text-lg text-ink hover:underline underline-offset-4">{t.title}</Link>
          <p className="text-sm text-ink-muted">
            {t.startDate ? `${fmtDay(t.startDate)}${t.endDate ? ` – ${fmtDay(t.endDate)}` : ""}` : "Dates to be confirmed"}
            {t.pricePerSeatKobo > 0 && ` · ${formatNaira(t.pricePerSeatKobo)} a seat`}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink to={hostManifestPath(t.id)} size="sm"><Users className="w-4 h-4" /> Manifest</ButtonLink>
          <ButtonLink to={hostEditTripPath(t.id)} size="sm" variant="outline"><Pencil className="w-4 h-4" /> Edit</ButtonLink>
          <a href={tripPath(t.id)} target="_blank" rel="noopener noreferrer" aria-label="Open the trip page"
            className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-ink hover:border-ink"><ExternalLink className="w-4 h-4" /></a>
        </div>
      </div>

      {seats > 0 && (
        <div className="mt-5">
          <div className="relative h-2.5 rounded-full bg-cream-deep overflow-hidden" aria-hidden>
            <div className="absolute inset-y-0 left-0 bg-ink/15" style={{ width: pct(t.approved) }} />
            <div className="absolute inset-y-0 left-0 bg-palm/50" style={{ width: pct(t.seatsWithDeposit) }} />
            <div className="absolute inset-y-0 left-0 bg-palm" style={{ width: pct(t.seatsPaidInFull) }} />
          </div>
          <p className="text-xs text-ink-soft mt-2">
            {t.seatsPaidInFull} paid in full · {t.seatsWithDeposit} with a deposit · {t.approved} approved · {Math.max(0, seats - t.approved)} open of {seats}
          </p>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Stat label="Collected" value={formatNaira(t.collectedTotalKobo)} />
        <Stat label="Through Hodrac" value={formatNaira(t.collectedKobo)} hint={viaHodracShare != null ? `${viaHodracShare}%` : undefined} />
        <Stat label="Recorded by hand" value={formatNaira(t.collectedManualKobo)} />
        <Stat label="Still owed" value={formatNaira(t.owedKobo)} />
      </dl>
    </li>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-ink">{value}{hint && <span className="text-xs text-ink-muted"> · {hint}</span>}</dd>
    </div>
  );
}
