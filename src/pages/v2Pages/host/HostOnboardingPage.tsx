import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, FileUp, Landmark, Plus, Send, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { hostApi } from "../../../dataStore/v2Api/hostApi";
import { clearHostProfileCache } from "../../../hooks/v2Hooks/useHostProfile";
import { Button, ButtonLink, FullPageSpinner } from "../../../components/v2Components/ui";
import { FormError, HostClosedBanner, HostField, VerifiedBadge } from "../../../components/v2Components/host/HostUi";
import { inputClass } from "../../../components/v2Components/host/hostStyles";
import { fieldErrors, formErrorText, trackHost } from "../../../utils/v2Utils/host";
import { flyerHref } from "../../../utils/v2Utils/hostOffer";
import { trackMeta } from "../../../utils/v2Utils/metaPixel";
import { slugify } from "../../../utils/v2Utils/slugify";
import { ROUTES } from "../../../utils/v2Utils/routes";
import type { HostBank, HostProfile, PayoutAccountResult } from "../../../types/host";

type Step = 1 | 2 | 3 | 4;

const STEPS: { n: Step; label: string; icon: typeof UserRound }[] = [
  { n: 1, label: "Profile", icon: UserRound },
  { n: 2, label: "Payout account", icon: Landmark },
  { n: 3, label: "Verification", icon: ShieldCheck },
  { n: 4, label: "Done", icon: Check },
];

// Resume at the first unfinished step.
function firstOpenStep(p: HostProfile | null): Step {
  if (!p) return 1;
  if (!p.payoutAccountSet) return 2;
  if (p.verificationStatus === "Unverified" || p.verificationStatus === "Rejected") return 3;
  return 4;
}

const done = (p: HostProfile | null, n: Step) =>
  n === 1 ? !!p : n === 2 ? !!p?.payoutAccountSet : n === 3 ? p?.verificationStatus === "Pending" || p?.verificationStatus === "Verified" : false;

// /host/onboarding: profile → payout account → verification → done. Resumable.
export default function HostOnboardingPage() {
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    hostApi.myProfile()
      .then(p => { setProfile(p); setStep(firstOpenStep(p)); })
      .catch(e => setLoadError(formErrorText(e, {}, "Couldn't load your host profile.")));
  }, []);

  const advance = (p: HostProfile, from: Step) => {
    clearHostProfileCache();
    setProfile(p);
    trackHost("host_onboarding_step_completed", { step: from });
    setStep(firstOpenStep(p) > from ? firstOpenStep(p) : ((from + 1) as Step));
  };

  if (loadError) return <div className="max-w-xl mx-auto px-5 py-16"><FormError message={loadError} /></div>;
  if (step === null) return <FullPageSpinner />;

  // A closed host can't change their setup or submit verification.
  if (profile?.closedAt) {
    return (
      <div className="max-w-2xl mx-auto px-5 md:px-8 pt-10 pb-24 space-y-6">
        <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted">Hodrac Host</p>
        <h1 className="text-4xl font-light text-ink">Set up hosting</h1>
        <HostClosedBanner profile={profile} />
        <ButtonLink to={ROUTES.HOST.TRIPS} size="lg">Go to your trips</ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 pt-10 pb-24">
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-muted mb-3">Hodrac Host</p>
      <h1 className="text-4xl font-light text-ink mb-8">Set up hosting</h1>

      <ol className="grid grid-cols-4 gap-2 mb-10" aria-label="Steps">
        {STEPS.map(({ n, label, icon: Icon }) => {
          const reachable = n === 1 || done(profile, (n - 1) as Step) || n <= firstOpenStep(profile);
          const active = n === step;
          return (
            <li key={n}>
              <button type="button" disabled={!reachable} onClick={() => setStep(n)} aria-current={active ? "step" : undefined}
                className={`w-full text-left rounded-2xl border px-3 py-2.5 transition-colors disabled:opacity-40 ${
                  active ? "border-ink bg-white" : "border-line bg-white/60 hover:border-ink/40"}`}>
                <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                  {done(profile, n) ? <Check className="w-3.5 h-3.5 text-palm" /> : <Icon className="w-3.5 h-3.5" />} Step {n}
                </span>
                <span className="block text-sm text-ink truncate">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {step === 1 && <ProfileStep profile={profile} onSaved={p => advance(p, 1)} />}
      {step === 2 && profile && <PayoutStep profile={profile} onSaved={p => advance(p, 2)} />}
      {step === 3 && profile && <VerificationStep profile={profile} onSaved={p => advance(p, 3)} />}
      {step === 4 && profile && <DoneStep profile={profile} />}
    </div>
  );
}

// ─── Step 1: profile ──────────────────────────────────────────────────────────

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function ProfileStep({ profile, onSaved }: { profile: HostProfile | null; onSaved: (p: HostProfile) => void }) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [slug, setSlug] = useState(profile?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!profile);
  const [logoUrl, setLogoUrl] = useState(profile?.logoUrl ?? "");
  const [instagram, setInstagram] = useState(profile?.instagramHandle ?? "");
  const [whatsApp, setWhatsApp] = useState(profile?.whatsAppNumber ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(displayName).replace(/^-+|-+$/g, "").slice(0, 80);
  const slugProblem = effectiveSlug && (effectiveSlug.length < 3 || !SLUG_RE.test(effectiveSlug))
    ? "3–80 characters: lowercase letters and numbers, separated by single hyphens."
    : "";

  const save = async () => {
    const local: Record<string, string> = {};
    if (!displayName.trim()) local.displayName = "Display name is required.";
    if (slugProblem) local.slug = slugProblem;
    setErrors(local);
    setFormError("");
    if (Object.keys(local).length) return;

    const body = {
      displayName: displayName.trim(),
      slug: effectiveSlug || null,
      bio: bio.trim(),
      logoUrl: logoUrl.trim(),
      instagramHandle: instagram.trim(),
      whatsAppNumber: whatsApp.trim(),
    };
    setSaving(true);
    try {
      let saved: HostProfile;
      if (profile) {
        saved = await hostApi.updateProfile(body);
      } else {
        saved = await hostApi.createProfile(body);
        // Meta Pixel conversion: a new host signed up (once; edits don't count).
        trackMeta("CompleteRegistration", { content_name: "Hodrac Host", status: true });
      }
      onSaved(saved);
    } catch (e) {
      setErrors(fieldErrors(e));
      setFormError(formErrorText(e, {}, "Couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <StepIntro title="Your host profile" body="This is what travellers see on your trip pages." />
      <HostField label="Display name *" hint="Your name or your travel club's name." error={errors.displayName}>
        <input className={inputClass} value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={100} placeholder="e.g. Ada's Travel Club" />
      </HostField>
      <HostField label="Link name" error={errors.slug || slugProblem}
        hint={effectiveSlug ? <>Your host link name: <span className="text-ink">{effectiveSlug}</span>. We'll tell you if it's taken when you save.</> : "Made from your display name if you leave it empty."}>
        <input className={inputClass} value={effectiveSlug} maxLength={80}
          onChange={e => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }} placeholder="adas-travel-club" />
      </HostField>
      <div className="grid sm:grid-cols-2 gap-5">
        <HostField label="Instagram handle" error={errors.instagramHandle}>
          <input className={inputClass} value={instagram} onChange={e => setInstagram(e.target.value)} maxLength={64} placeholder="@adastravels" />
        </HostField>
        <HostField label="WhatsApp number" error={errors.whatsAppNumber}>
          <input className={inputClass} value={whatsApp} onChange={e => setWhatsApp(e.target.value)} maxLength={20} inputMode="tel" placeholder="+234 801 234 5678" />
        </HostField>
      </div>
      <HostField label="Logo URL" hint="A link to your logo image (https://…)." error={errors.logoUrl}>
        <input className={inputClass} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} type="url" placeholder="https://" />
      </HostField>
      <HostField label="About you" error={errors.bio}>
        <textarea className={`${inputClass} min-h-28`} value={bio} onChange={e => setBio(e.target.value)} maxLength={2000}
          placeholder="The trips you run and who they're for." />
      </HostField>
      <FormError message={formError} />
      <Button size="lg" loading={saving} onClick={save}>{profile ? "Save and continue" : "Create profile"}</Button>
    </section>
  );
}

// ─── Step 2: payout account ───────────────────────────────────────────────────

function PayoutStep({ profile, onSaved }: { profile: HostProfile; onSaved: (p: HostProfile) => void }) {
  const [editing, setEditing] = useState(!profile.payoutAccountSet);
  const [banks, setBanks] = useState<HostBank[] | null>(null);
  const [bankError, setBankError] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [bankCode, setBankCode] = useState(profile.payoutAccount?.bankCode ?? "");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolved, setResolved] = useState<PayoutAccountResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing || banks) return;
    hostApi.banks().then(setBanks).catch(e => setBankError(formErrorText(e, {}, "Couldn't load the list of banks.")));
  }, [editing, banks]);

  const shownBanks = useMemo(() => {
    const q = bankFilter.trim().toLowerCase();
    const list = banks ?? [];
    return q ? list.filter(b => b.name.toLowerCase().includes(q) || b.code === bankCode) : list;
  }, [banks, bankFilter, bankCode]);

  const digits = accountNumber.replace(/\D/g, "");

  const check = async () => {
    const local: Record<string, string> = {};
    if (!bankCode) local.bankCode = "Choose a bank from the list.";
    if (digits.length !== 10) local.accountNumber = "Account number must be 10 digits.";
    setErrors(local);
    setFormError("");
    setResolved(null);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      setResolved(await hostApi.payoutAccount(bankCode, digits));
    } catch (e) {
      setErrors(fieldErrors(e));
      setFormError(formErrorText(e, {}, "Couldn't check that account."));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setFormError("");
    try {
      const r = await hostApi.payoutAccount(bankCode, digits, true);
      if (r.profile) onSaved(r.profile);
    } catch (e) {
      setErrors(fieldErrors(e));
      setFormError(formErrorText(e, {}, "Couldn't save your payout account."));
    } finally {
      setBusy(false);
    }
  };

  const intro = (
    <StepIntro title="Payout account"
      body="Travellers' payments settle to this account through Paystack. Hodrac never holds your money." />
  );

  if (!editing && profile.payoutAccount) {
    const a = profile.payoutAccount;
    return (
      <section className="space-y-5">
        {intro}
        <div className="bg-white rounded-3xl border border-line p-6">
          <p className="text-sm text-ink-muted">Payouts go to</p>
          <p className="text-lg text-ink mt-1">{a.accountName}</p>
          <p className="text-ink-soft">{a.bankName} · ••••{a.accountLast4}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => onSaved(profile)}>Continue</Button>
          <Button size="lg" variant="outline" onClick={() => setEditing(true)}>Change account</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {intro}
      <FormError message={bankError} />
      <HostField label="Bank *" error={errors.bankCode}>
        <input className={`${inputClass} mb-2`} value={bankFilter} onChange={e => setBankFilter(e.target.value)}
          placeholder={banks ? "Search banks" : "Loading banks…"} disabled={!banks} aria-label="Search banks" />
        <select className={inputClass} value={bankCode} disabled={!banks}
          onChange={e => { setBankCode(e.target.value); setResolved(null); }} aria-label="Bank">
          <option value="">{banks ? `Choose a bank (${shownBanks.length})` : "Loading…"}</option>
          {shownBanks.map(b => <option key={`${b.code}-${b.name}`} value={b.code}>{b.name}</option>)}
        </select>
      </HostField>
      <HostField label="Account number *" error={errors.accountNumber}>
        <input className={inputClass} value={accountNumber} inputMode="numeric" maxLength={14} placeholder="10-digit NUBAN"
          onChange={e => { setAccountNumber(e.target.value); setResolved(null); }} />
      </HostField>

      {resolved && (
        <div className="bg-white rounded-3xl border border-ink p-6">
          <p className="text-sm text-ink-muted">Is this you?</p>
          <p className="text-xl text-ink mt-1 font-medium">{resolved.accountName}</p>
          <p className="text-ink-soft">{resolved.bankName} · ••••{resolved.accountLast4}</p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Button loading={busy} onClick={confirm}>Yes, pay out to this account</Button>
            <Button variant="ghost" onClick={() => setResolved(null)} disabled={busy}>No, change it</Button>
          </div>
        </div>
      )}

      <FormError message={formError} />
      {!resolved && (
        <div className="flex flex-wrap gap-3">
          <Button size="lg" loading={busy} onClick={check}>Check account</Button>
          {profile.payoutAccountSet && <Button size="lg" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
        </div>
      )}
    </section>
  );
}

// ─── Step 3: verification ─────────────────────────────────────────────────────

const MAX_DOC_BYTES = 5 * 1024 * 1024;

function VerificationStep({ profile, onSaved }: { profile: HostProfile; onSaved: (p: HostProfile) => void }) {
  const status = profile.verificationStatus;
  const [editing, setEditing] = useState(status === "Unverified" || status === "Rejected");
  const [cac, setCac] = useState(profile.cacNumber ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [links, setLinks] = useState<string[]>(profile.pastTripProofUrls.length ? profile.pastTripProofUrls : [""]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const intro = (
    <StepIntro title="Get verified"
      body="Travellers see a Verified host badge once we've checked your ID or CAC registration and a past trip. Every field is optional, but the more you share, the faster we can verify you. You can create and share trips now; payments open once you're verified." />
  );

  if (status === "Verified") {
    return (
      <section className="space-y-5">
        {intro}
        <div className="bg-white rounded-3xl border border-line p-6 flex items-center gap-3"><VerifiedBadge size="md" /> You're verified.</div>
        <Button size="lg" onClick={() => onSaved(profile)}>Continue</Button>
      </section>
    );
  }

  if (!editing) {
    return (
      <section className="space-y-5">
        {intro}
        <div className="bg-white rounded-3xl border border-line p-6">
          <p className="text-ink font-medium">Pending review</p>
          <p className="text-ink-soft mt-1">We usually review within 24 hours and will notify you.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => onSaved(profile)}>Continue</Button>
          <Button size="lg" variant="outline" onClick={() => setEditing(true)}>Update documents</Button>
        </div>
      </section>
    );
  }

  const pickFile = (f: File | null) => {
    setErrors(e => ({ ...e, idDocument: "" }));
    if (f && f.size > MAX_DOC_BYTES) {
      setErrors(e => ({ ...e, idDocument: "The ID document must be 5 MB or smaller." }));
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    const cleanLinks = links.map(l => l.trim()).filter(Boolean);
    const local: Record<string, string> = {};
    // Every field is optional; only check that any links given are real URLs.
    if (cleanLinks.some(l => !/^https?:\/\/\S+$/i.test(l))) local.pastTripProofUrls = "Each link must be a full http(s) URL.";
    setErrors(local);
    setFormError("");
    if (Object.keys(local).length) return;

    setSaving(true);
    try {
      onSaved(await hostApi.submitVerification({ cacNumber: cac, idDocument: file, pastTripProofUrls: cleanLinks }));
    } catch (e) {
      setErrors(fieldErrors(e));
      setFormError(formErrorText(e, { 409: "Your host profile is already verified." }, "Couldn't submit your documents."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      {intro}
      {status === "Rejected" && profile.rejectionReason && (
        <FormError message={`We couldn't verify you yet: ${profile.rejectionReason}`} />
      )}
      {status === "Unverified" && profile.rejectionReason && (
        <FormError message={profile.rejectionReason} />
      )}
      <HostField label="CAC registration number" hint="If your business is registered." error={errors.cacNumber}>
        <input className={inputClass} value={cac} onChange={e => setCac(e.target.value)} maxLength={32} placeholder="RC 1234567" />
      </HostField>
      <HostField label="ID document" error={errors.idDocument}
        hint={profile.hasIdDocument && !file ? "We already have an ID document from you. Upload a new one to replace it." : "National ID, passport or driver's licence. PDF, JPG or PNG, up to 5 MB. Only Hodrac staff can see it."}>
        <span className={`${inputClass} flex items-center gap-3 cursor-pointer`}>
          <FileUp className="w-4 h-4 text-ink-muted shrink-0" />
          <span className="truncate">{file ? file.name : "Choose a file"}</span>
          <input type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only"
            onChange={e => pickFile(e.target.files?.[0] ?? null)} />
        </span>
      </HostField>
      <div>
        <p className="text-sm font-medium text-ink mb-1.5">Proof of a past trip</p>
        <p className="text-xs text-ink-muted mb-3">Links to an Instagram post, flyer or photos from a trip you ran.</p>
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputClass} value={l} type="url" placeholder="https://instagram.com/p/…" aria-label={`Past trip link ${i + 1}`}
                onChange={e => setLinks(ls => ls.map((x, j) => (j === i ? e.target.value : x)))} />
              {links.length > 1 && (
                <button type="button" onClick={() => setLinks(ls => ls.filter((_, j) => j !== i))} aria-label="Remove link"
                  className="shrink-0 w-11 rounded-2xl border border-line text-ink-muted hover:text-ink flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {links.length < 3 && (
          <button type="button" onClick={() => setLinks(ls => [...ls, ""])} className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
            <Plus className="w-4 h-4" /> Add another link
          </button>
        )}
        {errors.pastTripProofUrls && <p className="text-xs text-red-700 mt-1.5">{errors.pastTripProofUrls}</p>}
      </div>
      <FormError message={formError} />
      <div className="flex flex-wrap gap-3">
        <Button size="lg" loading={saving} onClick={submit}>Submit for review</Button>
        {status === "Pending" && <Button size="lg" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
      </div>
    </section>
  );
}

// ─── Step 4: done ─────────────────────────────────────────────────────────────

function DoneStep({ profile }: { profile: HostProfile }) {
  return (
    <section className="space-y-6">
      <StepIntro title="You're set up"
        body={profile.verificationStatus === "Verified"
          ? "You're verified, so travellers can pay as soon as your trip is live."
          : "Your verification is being reviewed. You can create and share trips now; payments open once you're verified."} />
      <div className="flex flex-wrap gap-3">
        <ButtonLink to={ROUTES.HOST.NEW_TRIP} size="lg">Create your first trip</ButtonLink>
        <a href={flyerHref()} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-line text-ink font-medium hover:border-ink transition-colors">
          <Send className="w-4 h-4" /> Send us your flyer
        </a>
      </div>
      <p className="text-sm text-ink-muted">
        Or go to your <Link to={ROUTES.HOST.TRIPS} className="underline underline-offset-4 text-ink">host dashboard</Link>.
      </p>
    </section>
  );
}

function StepIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-2xl font-light text-ink">{title}</h2>
      <p className="text-ink-soft mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}
