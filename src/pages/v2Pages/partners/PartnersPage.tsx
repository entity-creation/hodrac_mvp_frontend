import { useState } from "react";
import { motion } from "framer-motion";
import {
  Map, Megaphone, MousePointerClick, ArrowRight, Check, ExternalLink, Heart, CalendarDays, Send,
} from "lucide-react";
import { partnerApi } from "../../../dataStore/v2Api/client";
import { Button, Section } from "../../../components/v2Components/ui";
import type { PartnerLeadPayload } from "../../../types";

const OFFERINGS = [
  {
    key: "custom_wishlists",
    icon: Map,
    title: "Custom wishlists",
    body: "We build ready-made trips around your tours, hotels or packages, so travellers discover them while they're still deciding where to go.",
    bg: "bg-white",
  },
  {
    key: "sponsored_destinations",
    icon: Megaphone,
    title: "Sponsored destinations",
    body: "Put your brand on the destinations you specialise in. Your logo and booking link sit on the guide travellers read before they decide.",
    bg: "bg-white",
  },
  {
    key: "booking_traffic",
    icon: MousePointerClick,
    title: "Direct booking traffic",
    body: "A 'Book with you' button on your listings sends ready-to-book travellers straight to your site. Every click is tracked and reported.",
    bg: "bg-white",
  },
];

const STEPS = [
  { title: "Tell us about your business", body: "Fill in the form below. We'll get back to you within two business days." },
  { title: "We plan your placements", body: "Together we pick the wishlists and destinations that match what you sell." },
  { title: "Travellers come to you", body: "Your branding and booking link go live. You get click reports for every listing." },
];

const BUSINESS_TYPES = ["Travel agency", "Tour operator", "Hotel / accommodation", "Airline / transport", "Tourism board", "Other"];

const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors";

export default function PartnersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-ink text-white">

        <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/50 mb-6">
              Hodrac for business
            </p>
            <h1 className="text-5xl md:text-6xl font-light leading-[0.98] mb-6">
              Reach travellers <em className="italic text-white/70">before</em> they decide where to go.
            </h1>
            <p className="text-lg text-white/75 max-w-lg mb-8">
              Hodrac is where undecided travellers come to find their next trip. Put your tours, destinations and booking links in front of them while they're choosing.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#partner-form" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-ink font-medium border border-white transition-transform">
                Become a partner <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#placements" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-medium border border-white/30 hover:border-white/30 transition-colors">
                See how it looks
              </a>
            </div>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-3"
          >
            {[
              "Travellers in the 'where should I go?' stage, before they've picked a competitor",
              "Placements that fit inside the content they're already reading",
              "Booking traffic sent straight to your own site",
              "Click reporting for every listing you sponsor",
            ].map((t, i) => (
              <li key={t} className={`flex items-start gap-3 bg-white/10 border border-white/15 rounded-2xl px-5 py-4 ${i % 2 ? "lg:ml-10" : ""}`}>
                <span className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </span>
                <span className="font-semibold">{t}</span>
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* Offerings */}
      <Section
        eyebrow="What you can do"
        title="Three ways to show up on Hodrac"
        subtitle="Mix and match. Every placement is clearly labelled, so travellers trust what they see."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OFFERINGS.map((o, i) => (
            <motion.div
              key={o.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`${o.bg} border border-line rounded-2xl p-7 shadow-pop`}
            >
              <span className="w-14 h-14 rounded-2xl bg-white border border-line flex items-center justify-center mb-6">
                <o.icon className="w-6 h-6 text-ink" />
              </span>
              <h3 className="text-2xl font-normal text-ink mb-2">{o.title}</h3>
              <p className="text-ink-soft leading-relaxed">{o.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Placement preview */}
      <Section
        id="placements"
        eyebrow="Where your brand appears"
        title="Right where the decision happens"
        subtitle="Here's how a sponsored wishlist looks to travellers: your badge on the card, and your Book button on the trip page."
        className="bg-white border-y border-line"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <PlacementMock />
          <ul className="flex flex-col gap-5">
            {[
              { n: "1", title: "Sponsored badge", body: "Your logo and name on wishlist and destination cards across explore, search and the home page." },
              { n: "2", title: "Book with you", body: "The main button on the trip page sends travellers to your booking page, tagged so you know where they came from." },
              { n: "3", title: "Tracked clicks", body: "Every click goes through Hodrac's tracking link, so you can see exactly which listings send you traffic." },
            ].map(item => (
              <li key={item.n} className="flex gap-4">
                <span className="w-10 h-10 shrink-0 rounded-full border border-line flex items-center justify-center font-display text-ink-muted">
                  {item.n}
                </span>
                <div>
                  <p className="font-display text-xl font-normal text-ink">{item.title}</p>
                  <p className="text-ink-soft">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* How it works */}
      <Section eyebrow="Getting started" title="Live in three steps">
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative bg-white border border-line rounded-2xl p-7">
              <span className="font-display text-7xl font-light text-brand-500/20 absolute top-3 right-5 leading-none">{i + 1}</span>
              <p className="font-display text-xl font-normal text-ink mb-2 pr-10">{s.title}</p>
              <p className="text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Lead form */}
      <section id="partner-form" className="px-5 md:px-8 pb-20 md:pb-28 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-light text-ink mb-3">Let's talk</h2>
            <p className="text-ink-soft text-lg">Tell us a little about your business. No commitment, no sales pressure.</p>
          </div>
          <LeadForm />
        </div>
      </section>
    </div>
  );
}

// Illustrative preview of a sponsored card + booking button (not real data).
function PlacementMock() {
  return (
    <div className="relative max-w-md mx-auto w-full" aria-hidden="true">
      <div className="bg-cream rounded-2xl border border-line shadow-pop-lg overflow-hidden">
        <div className="relative h-44 bg-sky-100 border-b border-line flex items-center justify-center text-7xl">
          
          <span className="absolute top-3 left-3 text-[10px] font-medium uppercase tracking-[0.15em] bg-white/70 backdrop-blur-md text-sun-500 rounded-full px-2.5 py-1">
            Sponsored
          </span>
          <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center">
            <Heart className="w-4 h-4" />
          </span>
        </div>
        <div className="p-5">
          <p className="font-display text-xl font-normal text-ink">Island Hopping for First-Timers</p>
          <p className="text-sm text-ink-soft mt-1 inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> 8 days · from $1,240</p>
          <span className="mt-3 flex items-center gap-2 w-fit rounded-full border border-sun-300 bg-sun-100 pl-1 pr-3 py-1 text-xs text-ink">
            <span className="w-5 h-5 rounded-full bg-ink text-white text-[9px] flex items-center justify-center">YB</span>
            Sponsored by Your Brand
          </span>
          <div className="mt-5 flex items-center justify-center gap-2 rounded-full bg-ink text-white text-sm font-medium py-3">
            Book with Your Brand <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>
      <span className="absolute -top-3 right-4 bg-white text-ink-muted border border-line rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">
        Example
      </span>
    </div>
  );
}

function LeadForm() {
  const [form, setForm] = useState<PartnerLeadPayload>({
    companyName: "",
    contactName: "",
    email: "",
    website: "",
    businessType: "",
    interests: [],
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const set = <K extends keyof PartnerLeadPayload>(key: K, value: PartnerLeadPayload[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleInterest = (key: string) =>
    set("interests", form.interests.includes(key) ? form.interests.filter(i => i !== key) : [...form.interests, key]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required.";
    if (!form.contactName.trim()) e.contactName = "Your name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.businessType) e.businessType = "Pick the closest match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await partnerApi.submitLead({ ...form, website: form.website.trim(), message: form.message.trim() });
      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-line rounded-2xl shadow-pop-lg p-10 text-center"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink-muted">Received</p>
        <h3 className="text-3xl font-light text-ink mt-4 mb-2">Thanks, {form.contactName.split(" ")[0]}!</h3>
        <p className="text-ink-soft max-w-md mx-auto">
          We've got your details and will reach out to {form.email} within two business days.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white border border-line rounded-2xl shadow-pop-lg p-6 md:p-8 flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company name" error={errors.companyName}>
          <input className={inputClass} value={form.companyName} onChange={e => set("companyName", e.target.value)} autoComplete="organization" />
        </Field>
        <Field label="Your name" error={errors.contactName}>
          <input className={inputClass} value={form.contactName} onChange={e => set("contactName", e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Work email" error={errors.email}>
          <input type="email" className={inputClass} value={form.email} onChange={e => set("email", e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Website (optional)">
          <input type="url" className={inputClass} placeholder="https://" value={form.website} onChange={e => set("website", e.target.value)} autoComplete="url" />
        </Field>
      </div>

      <Field group label="What kind of business are you?" error={errors.businessType}>
        <div className="flex flex-wrap gap-2">
          {BUSINESS_TYPES.map(t => (
            <button
              key={t}
              type="button"
              aria-pressed={form.businessType === t}
              onClick={() => set("businessType", t)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                form.businessType === t ? "bg-ink text-white border-ink" : "bg-white text-ink border-line hover:border-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>

      <Field group label="What are you interested in?">
        <div className="flex flex-col sm:flex-row gap-2">
          {OFFERINGS.map(o => {
            const on = form.interests.includes(o.key);
            return (
              <button
                key={o.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggleInterest(o.key)}
                className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium border text-left transition-all ${
                  on ? `${o.bg} border-ink shadow-pop-sm` : "bg-white border-line hover:border-ink"
                }`}
              >
                <span className={`w-5 h-5 rounded-md border border-line flex items-center justify-center shrink-0 ${on ? "bg-ink" : "bg-white"}`}>
                  {on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                {o.title}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Anything else? (optional)">
        <textarea
          rows={4}
          className={`${inputClass} resize-none`}
          placeholder="Destinations you specialise in, goals, timelines…"
          value={form.message}
          onChange={e => set("message", e.target.value)}
        />
      </Field>

      {submitError && (
        <p role="alert" className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{submitError}</p>
      )}

      <Button type="submit" size="lg" loading={submitting} fullWidth>
        {!submitting && <Send className="w-4 h-4" />} Send
      </Button>
    </form>
  );
}

// Single inputs use <label>; button groups use <fieldset> so clicking the
// caption doesn't activate the first button.
function Field({ label, error, group, children }: { label: string; error?: string; group?: boolean; children: React.ReactNode }) {
  const errorText = error && <span className="text-xs font-semibold text-red-600">{error}</span>;
  if (group) {
    return (
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium text-ink mb-1.5">{label}</legend>
        {children}
        {errorText}
      </fieldset>
    );
  }
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {errorText}
    </label>
  );
}
