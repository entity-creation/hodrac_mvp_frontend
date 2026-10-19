import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { tripClient } from "../../../dataStore/v2Api/client";
import { useTripNotifications } from "../../../hooks/v2Hooks/useTripNotifications";
import type { NotificationType, TripNotification } from "../../../types";
import { timeAgo } from "../../../utils/v2Utils/format";

const NOTIFICATION_COPY: Record<NotificationType, { icon: string; text: string }> = {
  InterestReceived: { icon: "🙋", text: "Someone asked to join your trip" },
  InterestApproved: { icon: "🎉", text: "Your request to join a trip was approved" },
  InterestDeclined: { icon: "📭", text: "Your request to join a trip was declined" },
  NewThreadMessage: { icon: "💬", text: "New message in your trip chat" },
  TripStartingSoon: { icon: "🧳", text: "Your trip is starting soon" },
};

// Where clicking a notification takes the user.
function notificationPath(n: TripNotification): string {
  const opensThread =
    n.type === "NewThreadMessage" ||
    n.type === "InterestApproved" ||
    n.type === "TripStartingSoon";

  return opensThread && n.tripPostId ? `/trip-thread/${n.tripPostId}` : "/trip-hub";
}

export default function NotificationBell({ enabled }: { enabled: boolean }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useTripNotifications(tripClient, { enabled });

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (n: TripNotification) => {
    setOpen(false);
    markRead(n.id).catch(() => {});
    navigate(notificationPath(n));
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center border border-line bg-white text-ink hover:bg-cream-deep transition-colors"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-brand-500 border border-line text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-13 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-3xl border border-line shadow-pop-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <p className="font-display text-base font-normal text-ink">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead().catch(() => {})}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-12 bg-ink/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-sm font-semibold text-ink-soft">You're all caught up</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const copy = NOTIFICATION_COPY[n.type] ?? { icon: "🔔", text: "New notification" };
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cream ${
                        n.isRead ? "" : "bg-brand-50"
                      }`}
                    >
                      <span className="text-lg leading-none mt-0.5">{copy.icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm ${n.isRead ? "text-ink-soft" : "text-ink font-medium"}`}>
                          {copy.text}
                        </span>
                        <span className="block text-xs text-ink-muted mt-0.5">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                      {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
