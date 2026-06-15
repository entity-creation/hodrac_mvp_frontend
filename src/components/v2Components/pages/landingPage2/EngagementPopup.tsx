import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createNewUserInfo } from "../../../../dataStore/user_info_apis";

interface EngagementPopupProps {
  triggerAfterSeconds?: number;
}

export default function EngagementPopup({
  triggerAfterSeconds = 45,
}: EngagementPopupProps) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Don't show if already seen this session
    if (sessionStorage.getItem("hodrac_popup_seen")) return;

    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem("hodrac_popup_seen", "1");
    }, triggerAfterSeconds * 1000);

    return () => clearTimeout(timer);
  }, [triggerAfterSeconds]);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    await createNewUserInfo(email);
    setLoading(false);
    setSubmitted(true);
    setTimeout(() => setVisible(false), 2000);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-[200] w-full max-w-sm"
        >
          <div className="bg-gray-950 text-white rounded-3xl p-6 shadow-2xl border border-white/10">
            <button
              onClick={() => setVisible(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60 hover:bg-white/20 transition-colors"
            >
              ✕
            </button>

            {submitted ? (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <span className="text-3xl">🎉</span>
                <p className="font-bold text-white">You're in!</p>
                <p className="text-sm text-white/60">We'll keep you posted.</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                  Enjoying your experience?
                </p>
                <h3
                  className="text-lg font-black text-white mb-2 leading-snug"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  Get personalized travel recommendations.
                </h3>
                <p className="text-sm text-white/60 mb-5">
                  Early access to features built around your travel style.
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 text-sm outline-none focus:ring-2 focus:ring-white/30 transition"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="py-3 rounded-xl bg-white text-gray-300 text-sm font-bold hover:bg-gray-100! active:scale-95 transition-all duration-150"
                  >
                    {loading ? "Joining..." : "Join Early Access →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
