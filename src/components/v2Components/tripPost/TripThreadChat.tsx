import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  ThreadMessage,
  ThreadParticipant,
  TripApiClient,
} from "../../../types";
import { useTripThreadHub } from "../../../hooks/v2Hooks/useSignalR";

interface TripThreadChatProps {
  tripId: string;
  currentUserId: string;
  participants?: ThreadParticipant[];
  api: Pick<TripApiClient, "getThreadMessages" | "sendMessage">;
}

// Appends a message unless it's already shown (the sender's own message
// arrives both from the POST response and from the hub).
function appendUnique(prev: ThreadMessage[], message: ThreadMessage) {
  return prev.some((m) => m.id === message.id) ? prev : [...prev, message];
}

// Group chat for an approved trip.
export default function TripThreadChat({
  tripId,
  currentUserId,
  participants,
  api,
}: TripThreadChatProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleIncoming = useCallback((incoming: ThreadMessage) => {
    setMessages((prev) => appendUnique(prev, incoming));
  }, []);

  useTripThreadHub(tripId, handleIncoming);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const history = await api.getThreadMessages(tripId);

        if (cancelled) return;

        // API returns newest first, so reverse for chat display. Keep any
        // live messages that arrived while history was loading.
        setMessages((prev) =>
          prev.reduce(appendUnique, history.slice().reverse())
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tripId, api]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = draft.trim();

    if (!body || sending) return;

    setDraft("");
    setSending(true);

    try {
      const sent = await api.sendMessage(tripId, body);

      setMessages((prev) => appendUnique(prev, sent));
    } finally {
      setSending(false);
    }
  };

  const participantCount = participants?.length ?? 0;

  return (
    <div
      className="
        flex
        flex-col
        h-full
        min-h-[500px]
        bg-white
        border border-line
        rounded-3xl
        overflow-hidden
        shadow-sm
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <div className="flex items-center gap-3">
          <div
            className="
              w-10
              h-10
              rounded-full
              bg-ink
              flex
              items-center
              justify-center
              text-white
              text-sm
            "
          >
            💬
          </div>

          <div>
            <h3 className="text-sm font-normal text-ink">
              Trip chat
            </h3>

            <p className="text-xs text-ink-muted mt-0.5">
              {participantCount}{" "}
              {participantCount === 1 ? "person" : "people"} in this trip
            </p>
          </div>
        </div>

        {/* Participant avatars */}
        {participants && participants.length > 0 && (
          <div className="flex items-center">
            {participants.slice(0, 4).map((participant, index) => (
              <div
                key={participant.userId}
                title={participant.displayName}
                className={`
                  w-8
                  h-8
                  rounded-full
                  bg-cream-deep
                  border
                  border-white/30
                  flex
                  items-center
                  justify-center
                  text-[11px]
                  font-semibold
                  text-ink-soft
                  ${index > 0 ? "-ml-2" : ""}
                `}
              >
                {participant.displayName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            ))}

            {participants.length > 4 && (
              <div
                className="
                  w-8
                  h-8
                  rounded-full
                  bg-ink
                  border
                  border-white/30
                  -ml-2
                  flex
                  items-center
                  justify-center
                  text-[10px]
                  font-semibold
                  text-white
                "
              >
                +{participants.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-5 py-5 bg-cream">
        {loading ? (
          <div className="flex flex-col gap-4">
            <MessageSkeleton own={false} />
            <MessageSkeleton own />
            <MessageSkeleton own={false} />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-4">💬</div>

            <h4 className="text-sm font-semibold text-ink">
              Start the conversation
            </h4>

            <p className="text-xs text-ink-muted mt-1.5 max-w-xs leading-relaxed">
              Talk about your plans, coordinate activities, or get to know
              the people joining your trip.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                const isOwn =
                  message.senderUserId === currentUserId;

                return (
                  <motion.div
                    key={message.id}
                    initial={{
                      opacity: 0,
                      y: 8,
                      scale: 0.98,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className={`
                      flex
                      ${isOwn ? "justify-end" : "justify-start"}
                    `}
                  >
                    <div
                      className={`
                        max-w-[80%]
                        md:max-w-[70%]
                        ${
                          isOwn
                            ? "bg-ink text-white rounded-2xl rounded-br-md"
                            : "bg-white border border-line text-ink rounded-2xl rounded-bl-md"
                        }
                        px-4
                        py-2.5
                      `}
                    >
                      {!isOwn && (
                        <p className="text-[11px] font-semibold text-ink-muted mb-1">
                          {getSenderName(message, participants)}
                        </p>
                      )}

                      <p
                        className={`
                          text-sm
                          leading-relaxed
                          break-words
                          ${
                            isOwn
                              ? "text-white"
                              : "text-ink"
                          }
                        `}
                      >
                        {message.body}
                      </p>

                      <time
                        className={`
                          block
                          text-[10px]
                          mt-1
                          ${
                            isOwn
                              ? "text-ink-muted"
                              : "text-ink-muted"
                          }
                        `}
                      >
                        {new Date(
                          message.createdAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="
          flex
          items-center
          gap-2
          p-3
          border-t
          border-line
          bg-white
        "
      >
        <input
          type="text"
          placeholder="Message the group..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
          className="
            flex-1
            min-w-0
            rounded-full
            border border-line
            bg-cream
            px-4
            py-2.5
            text-sm
            text-ink
            placeholder:text-ink-muted
            focus:outline-none
            focus:border-ink
            focus:ring-1
            focus:ring-ink
            disabled:opacity-50
            transition-all
          "
        />

        <motion.button
          type="submit"
          disabled={!draft.trim() || sending}
          whileTap={{
            scale: draft.trim() && !sending ? 0.95 : 1,
          }}
          className="
            flex-shrink-0
            w-10
            h-10
            rounded-full
            bg-ink
            text-white
            flex
            items-center
            justify-center
            hover:bg-ink-soft
            disabled:opacity-30
            disabled:cursor-not-allowed
            transition-all
          "
          aria-label="Send message"
        >
          {sending ? (
            <div className="w-4 h-4 border border-ink/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="text-sm">↑</span>
          )}
        </motion.button>
      </form>
    </div>
  );
}

/**
 * Finds the display name of a message sender when participant data
 * is available.
 */
function getSenderName(
  message: ThreadMessage,
  participants?: ThreadParticipant[]
): string {
  const participant = participants?.find(
    (p) => p.userId === message.senderUserId
  );

  return participant?.displayName ?? "Traveler";
}

/**
 * Loading placeholder for chat messages.
 */
function MessageSkeleton({ own }: { own: boolean }) {
  return (
    <div
      className={`flex ${own ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
          w-36
          h-14
          rounded-2xl
          bg-ink/10
          animate-pulse
          ${own ? "rounded-br-md" : "rounded-bl-md"}
        `}
      />
    </div>
  );
}