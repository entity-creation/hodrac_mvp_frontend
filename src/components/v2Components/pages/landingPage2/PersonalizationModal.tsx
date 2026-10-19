import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Modal, Button, Skeleton } from "../../ui";
import { wishlistsApi } from "../../../../dataStore/v2Api/client";
import { slugify } from "../../../../utils/v2Utils/slugify";
import type { PersonalizationData } from "../../../../hooks/v2Hooks/usePersonalization";
import type { WishlistCard } from "../../../../types";
import { useCurrency } from "../../../../hooks/v2Hooks/useCurrency";

export type { PersonalizationData };

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: PersonalizationData) => void;
}

type StepKey = keyof PersonalizationData;

const STEPS: {
  key: StepKey;
  question: string;
  hint: string;
  type: "single" | "multi";
  options: { label: string; emoji: string; desc?: string }[];
}[] = [
  {
    key: "travelGroup",
    question: "Who's coming along?",
    hint: "Pick one",
    type: "single",
    options: [
      { label: "Solo", emoji: "🧳" },
      { label: "Partner", emoji: "💑" },
      { label: "Family", emoji: "👨‍👩‍👧" },
      { label: "Friends", emoji: "👯" },
    ],
  },
  {
    key: "interests",
    question: "What gets you excited?",
    hint: "Pick as many as you like",
    type: "multi",
    options: [
      { label: "Food", emoji: "🍜" },
      { label: "Anime", emoji: "⛩️" },
      { label: "Luxury", emoji: "✨" },
      { label: "Relaxation", emoji: "🧘" },
      { label: "Nightlife", emoji: "🌙" },
      { label: "Nature", emoji: "🌿" },
      { label: "Culture", emoji: "🎭" },
      { label: "Adventure", emoji: "🧗" },
    ],
  },
  {
    key: "budget",
    question: "How do you like to spend?",
    hint: "Pick one",
    type: "single",
    options: [
      { label: "Budget", emoji: "💸", desc: "Smart spending, max experience" },
      { label: "Mid-range", emoji: "💳", desc: "Balanced comfort & value" },
      { label: "Luxury", emoji: "🛁", desc: "Treat yourself" },
    ],
  },
  {
    key: "priorities",
    question: "What matters most?",
    hint: "Pick as many as you like",
    type: "multi",
    options: [
      { label: "Saving money", emoji: "💰" },
      { label: "Hidden gems", emoji: "💎" },
      { label: "Structure", emoji: "📋" },
      { label: "Flexibility", emoji: "🌊" },
      { label: "Unique experiences", emoji: "🎯" },
    ],
  },
];

const EMPTY: PersonalizationData = { travelGroup: "", interests: [], budget: "", priorities: [] };

const TILE_COLOURS = ["bg-white"];

export default function PersonalizationModal({ isOpen, onClose, onComplete }: PersonalizationModalProps) {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<PersonalizationData>(EMPTY);
  const [done, setDone] = useState(false);
  const [matches, setMatches] = useState<WishlistCard[] | null>(null);

  // Fresh quiz each time it opens.
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setData(EMPTY);
      setDone(false);
      setMatches(null);
    }
  }, [isOpen]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const value = data[current.key];
  const canContinue = Array.isArray(value) ? value.length > 0 : !!value;

  const select = (label: string) => {
    setData(prev => {
      if (current.type === "single") return { ...prev, [current.key]: label };
      const list = prev[current.key] as string[];
      return {
        ...prev,
        [current.key]: list.includes(label) ? list.filter(l => l !== label) : [...list, label],
      };
    });
    // Single-choice steps advance on tap, so the quiz feels quick.
    if (current.type === "single" && !isLast) setTimeout(() => setStep(s => s + 1), 180);
  };

  const finish = () => {
    onComplete(data);
    setDone(true);
    wishlistsApi
      .list({ vibeTags: data.interests.join(","), sort: "saves", pageSize: 3 })
      .then(r => setMatches(r.items ?? []))
      .catch(() => setMatches([]));
  };

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const exploreUrl = `/explore/wishlists?vibeTags=${encodeURIComponent(data.interests.join(","))}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Find your trip" className="sm:max-w-xl">
      <div className="p-6 md:p-8">
        {!done ? (
          <>
            {/* Progress */}
            <div className="flex items-center gap-2 mb-6 pr-10">
              {STEPS.map((_, i) => (
                <div key={i} className="h-2.5 flex-1 rounded-full border border-line overflow-hidden bg-white">
                  <motion.div
                    className="h-full bg-ink"
                    initial={false}
                    animate={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
                  />
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted mb-3">
                  Question {step + 1} of {STEPS.length}
                </p>
                <h2 className="text-3xl font-light text-ink mb-1">{current.question}</h2>
                <p className="text-sm text-ink-muted mb-6">{current.hint}</p>

                <div className={`grid gap-3 ${current.options.length > 4 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
                  {current.options.map((opt, i) => {
                    const selected = Array.isArray(value) ? value.includes(opt.label) : value === opt.label;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => select(opt.label)}
                        aria-pressed={selected}
                        className={`relative flex flex-col items-start gap-1 p-4 rounded-2xl border text-left transition-all ${
                          selected
                            ? "border-ink bg-ink text-white shadow-pop"
                            : `border-line ${TILE_COLOURS[i % TILE_COLOURS.length]} text-ink hover:border-ink`
                        }`}
                      >
                        <span className="font-medium text-sm">{opt.label}</span>
                        {opt.desc && (
                          <span className={`text-xs ${selected ? "text-white/70" : "text-ink-muted"}`}>{opt.desc}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className={step === 0 ? "invisible" : ""}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              {isLast ? (
                <Button onClick={finish} disabled={!canContinue}>
                  Show my trips <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canContinue} variant="dark">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        ) : (
          // ── Results ─────────────────────────────────────────────────────
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted mb-3">Your matches</p>
            <h2 className="text-3xl font-light text-ink mb-1">Here's where you could go</h2>
            <p className="text-sm text-ink-soft mb-6">
              Trips picked for {data.travelGroup ? `${data.travelGroup.toLowerCase()} travel` : "you"} with{" "}
              {data.interests.slice(0, 3).join(", ").toLowerCase() || "a bit of everything"}.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {matches === null ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
              ) : matches.length === 0 ? (
                <p className="text-sm text-ink-muted bg-white border border-line rounded-2xl p-4">
                  We're still adding trips for that combo — explore everything we have so far.
                </p>
              ) : (
                matches.map(w => (
                  <button
                    key={w.wishlistId}
                    onClick={() => goTo(`/wishlists/${w.wishlistId}/${slugify(w.wishlistName)}`)}
                    className="flex items-center gap-4 p-3 bg-white border border-line rounded-2xl text-left pop-hover shadow-pop-sm"
                  >
                    <span className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-brand-100 flex items-center justify-center text-2xl">
                      {w.wishlistHeroImage
                        ? <img src={w.wishlistHeroImage} alt="" className="w-full h-full object-cover" />
                        : null}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-ink truncate">{w.wishlistName}</span>
                      <span className="block text-xs text-ink-muted">
                        {w.totalDays} days · from {formatPrice(w.basePricePerPerson)}
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                ))
              )}
            </div>

            <Button fullWidth size="lg" onClick={() => goTo(exploreUrl)}>
              See all my matches <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
