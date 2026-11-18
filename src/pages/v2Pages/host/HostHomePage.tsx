import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BellRing, FileSignature, Landmark, Link2, ListChecks, Send } from "lucide-react";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { useRequireAuth } from "../../../hooks/v2Hooks/useRequireAuth";
import { hostApi } from "../../../dataStore/v2Api/hostApi";
import { Button, FullPageSpinner } from "../../../components/v2Components/ui";
import { ROUTES } from "../../../utils/v2Utils/routes";
import { flyerHref, foundingOfferOpen } from "../../../utils/v2Utils/hostOffer";

const POINTS = [
  { icon: Link2, title: "Sell your trip from one link", body: "One page with your itinerary, price, deposit and instalments. Share it on WhatsApp and Instagram; it stays private unless you list it." },
  { icon: FileSignature, title: "Travellers sign your terms first", body: "Your refund and dropout terms are accepted, with a timestamp, before anyone pays. No more arguments over screenshots." },
  { icon: Landmark, title: "Money goes straight to your bank", body: "Deposits and instalments are paid by card or transfer through Paystack and settle to your own account. Hodrac never holds your money." },
  { icon: BellRing, title: "Reminders do the chasing", body: "Travellers get reminders before each instalment, and you watch a live list of who has paid, who owes and who's overdue." },
];

// /host: hosts go to their dashboard; everyone else sees the pitch.
export default function HostHomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  // Whether the signed-in user has a host profile (null = still checking).
  const [isHost, setIsHost] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let cancelled = false;
    hostApi.myProfile()
      .then(p => { if (!cancelled) setIsHost(!!p); })
      .catch(() => { if (!cancelled) setIsHost(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading]);

  if (isLoading || (isAuthenticated && isHost === null)) return <FullPageSpinner />;
  if (isAuthenticated && isHost) return <Navigate to={ROUTES.HOST.TRIPS} replace />;
  return <HostLanding />;
}

function HostLanding() {
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const start = () => requireAuth(() => navigate(ROUTES.HOST.ONBOARDING), ROUTES.HOST.ONBOARDING);

  return (
    <div>
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink-muted mb-6">Hodrac Host</p>
            <h1 className="text-5xl md:text-6xl font-light text-ink leading-[0.98] mb-6">
              Paid seats, <em className="italic text-ink-soft">not screenshots.</em>
            </h1>
            <p className="text-lg text-ink-soft max-w-lg mb-8 leading-relaxed">
              For trip hosts and travel clubs: collect deposits and instalments for your group trips from one link,
              with your terms signed before anyone pays.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={start}>Start hosting <ArrowRight className="w-4 h-4" /></Button>
              <a href={flyerHref()} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-line text-ink font-medium hover:border-ink transition-colors">
                <Send className="w-4 h-4" /> Send us your flyer
              </a>
            </div>
            <p className="text-sm text-ink-muted mt-4">Send your flyer and we'll build your trip page within 24 hours.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-line shadow-pop p-7">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted mb-4">Pricing</p>
            <p className="text-3xl font-light text-ink leading-tight">2.5% of payments collected</p>
            <p className="text-ink-soft mt-2">Nothing if no seat sells. You choose whether travellers pay it as a booking fee or you absorb it.</p>
            <div className="mt-6 pt-6 border-t border-line space-y-3 text-sm text-ink-soft">
              <p><span className="font-medium text-ink">Operators</span> running 15+ departures a year: ₦900,000 a year, no percentage.</p>
              {foundingOfferOpen() && (
                <p><span className="font-medium text-palm">Founding hosts:</span> the first 30 hosts get their first departure free, until 28 February 2027.</p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-20">
        <div className="grid sm:grid-cols-2 gap-5">
          {POINTS.map(({ icon: Icon, title, body }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05 }} className="bg-white rounded-3xl border border-line p-7">
              <Icon className="w-6 h-6 text-ink mb-4" strokeWidth={1.5} />
              <h2 className="text-xl font-normal text-ink mb-2">{title}</h2>
              <p className="text-ink-soft leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-cream-deep p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <ListChecks className="w-6 h-6 text-ink shrink-0 mt-1" strokeWidth={1.5} />
            <div>
              <h2 className="text-2xl font-light text-ink">Set up in about 10 minutes</h2>
              <p className="text-ink-soft mt-1">Your profile, your payout account, then a quick verification so travellers see the Verified host badge.</p>
            </div>
          </div>
          <Button size="lg" onClick={start}>Start hosting <ArrowRight className="w-4 h-4" /></Button>
        </div>
      </section>
    </div>
  );
}
