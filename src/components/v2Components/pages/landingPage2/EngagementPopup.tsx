import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { createNewUserInfo } from "../../../../dataStore/user_info_apis";
import { useAuth } from "../../../../hooks/v2Hooks/useAuth";

interface EngagementPopupProps {
  triggerAfterSeconds?: number;
}

const SEEN_KEY = "hodrac_popup_seen";

function alreadySeen() {
  try { return !!sessionStorage.getItem(SEEN_KEY); } catch { return false; }
}

function markSeen() {
  try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* storage unavailable */ }
}

// Gentle email capture for anonymous visitors who've been browsing a while.
export default function EngagementPopup({ triggerAfterSeconds = 45 }: EngagementPopupProps) {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isAuthenticated || alreadySeen()) return;
    const timer = setTimeout(() => {
      setVisible(true);
      markSeen();
    }, triggerAfterSeconds * 1000);
    return () => clearTimeout(timer);
  }, [triggerAfterSeconds, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    try {
      await createNewUserInfo(email);
      setSubmitted(true);
      setTimeout(() => setVisible(false), 2200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-90 sm:w-full sm:max-w-sm"
          role="dialog"
          aria-label="Get trip ideas by email"
        >
          <div className="relative bg-white text-ink rounded-2xl border border-line shadow-pop-lg p-7">
            <button
              onClick={() => setVisible(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center hover:bg-cream"
            >
              <X className="w-4 h-4" />
            </button>

            {submitted ? (
              <div className="flex flex-col items-center gap-1 py-2 text-center">
                
                <p className="font-display text-xl font-normal">You're in!</p>
                <p className="text-sm text-ink-soft">Trip ideas are on their way.</p>
              </div>
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted">The Hodrac letter</p>
                <h3 className="font-display text-2xl font-normal leading-tight mt-2 mb-1 pr-8">Still deciding?</h3>
                <p className="text-sm text-ink-soft mb-4">
                  A few considered trip ideas, once a month. Unsubscribe any time.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-label="Email address"
                    className="px-4 py-3 rounded-full bg-white border border-line text-ink placeholder:text-ink-muted text-sm outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-3 rounded-full bg-ink text-white text-sm font-medium hover:bg-ink-soft active:scale-95 transition-all disabled:opacity-60"
                  >
                    {loading ? "Joining…" : "Send me ideas"}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
