import { useCallback, useEffect, useRef, useState } from "react";
import type { TripApiClient, TripNotification } from "../../types";
import { useNotificationHub } from "./useSignalR";

interface UseTripNotificationsOptions {
  enabled?: boolean;
  // Safety net for events missed while the hub was down; 0 disables it.
  pollIntervalMs?: number;
}

interface UseTripNotificationsResult {
  notifications: TripNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

// Current user's trip-related notifications for the bell in the nav:
// loads over REST, then stays live via the notification hub.
export function useTripNotifications(
  api: Pick<
    TripApiClient,
    | "getNotifications"
    | "getUnreadNotificationCount"
    | "markNotificationRead"
    | "markAllNotificationsRead"
  >,
  { enabled = true, pollIntervalMs = 120000 }: UseTripNotificationsOptions = {}
): UseTripNotificationsResult {
  const [notifications, setNotifications] = useState<TripNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Ids already shown, so a hub event racing a refresh isn't counted twice.
  const knownIds = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        api.getNotifications(),
        api.getUnreadNotificationCount(),
      ]);
      knownIds.current = new Set(list.map((n) => n.id));
      setNotifications(list);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Reset when signed out so the next user doesn't see stale items.
  useEffect(() => {
    if (!enabled) {
      knownIds.current = new Set();
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    refresh();

    if (!pollIntervalMs) return;
    const interval = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(interval);
  }, [enabled, refresh, pollIntervalMs]);

  const handleIncoming = useCallback((incoming: TripNotification) => {
    if (knownIds.current.has(incoming.id)) return;
    knownIds.current.add(incoming.id);

    setNotifications((prev) => [incoming, ...prev]);
    if (!incoming.isRead) setUnreadCount((c) => c + 1);
  }, []);

  useNotificationHub(enabled, handleIncoming, refresh);

  const markRead = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id);
      if (!target || target.isRead) return;

      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [api, notifications]
  );

  const markAllRead = useCallback(async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [api]);

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead };
}
