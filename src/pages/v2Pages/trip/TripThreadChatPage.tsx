import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, CalendarDays, Users } from "lucide-react";
import { motion } from "framer-motion";
import TripThreadChat from "../../../components/v2Components/tripPost/TripThreadChat";
import { tripClient } from "../../../dataStore/v2Api/client";
import type { TripPost } from "../../../types";



export default function TripThreadChatPage() {
  const [trip, setTrip] = useState<TripPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tripId = window.location.pathname.split("/")[2];

  useEffect(() => {
    let cancelled = false;

    async function loadTrip() {
      try {
        setLoading(true);
        setError("");

        
        const found = await tripClient.getTrip(tripId);

        if (!found) {
          throw new Error("Trip not found.");
        }

        if (!cancelled) {
          setTrip(found);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this trip."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTrip();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const handleBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10">
          <div className="h-5 w-24 bg-ink/10 rounded-full animate-pulse mb-8" />

          <div className="bg-white border border-line rounded-3xl shadow-sm overflow-hidden">
            <div className="h-24 bg-cream-deep animate-pulse" />
            <div className="p-6 space-y-4">
              <div className="h-6 w-1/3 bg-ink/10 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-ink/10 rounded animate-pulse" />
              <div className="h-[420px] bg-cream-deep rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="mt-10 bg-white border border-line rounded-3xl shadow-sm p-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-cream-deep flex items-center justify-center mb-4">
              <MapPin size={20} className="text-ink-soft" />
            </div>

            <h1 className="text-xl font-normal text-ink">
              Trip not found
            </h1>

            <p className="text-sm text-ink-soft mt-2">
              {error || "This trip may have been removed or is no longer available."}
            </p>

            <button
              onClick={handleBack}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-soft transition"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dateLabel = trip.isDateFlexible
    ? "Flexible dates"
    : formatDateRange(trip.startDate, trip.endDate);

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-5xl mx-auto px-5 md:px-8 pb-20 pt-8">
        {/* Back */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink transition mb-8"
        >
          <ArrowLeft size={16} />
          Back to trips
        </button>

        {/* Page heading */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-ink-muted uppercase">
            Trip conversation
          </p>

          <h1 className="mt-2 text-3xl md:text-4xl font-light tracking-tight text-ink">
            {trip.destinationLabel}
          </h1>

          <p className="mt-2 text-ink-soft">
            Talk with the people joining this trip and figure out the details
            together.
          </p>
        </div>

        {/* Trip summary */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-line rounded-3xl shadow-sm p-5 md:p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h2 className="text-lg font-normal text-ink">
                {trip.destinationLabel}
              </h2>

              {trip.caption && (
                <p className="text-sm text-ink-soft mt-1 line-clamp-2">
                  {trip.caption}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <InfoPill
                icon={<CalendarDays size={14} />}
                label={dateLabel}
              />

              {trip.stops?.length > 0 && (
                <InfoPill
                  icon={<MapPin size={14} />}
                  label={`${trip.stops.length} ${
                    trip.stops.length === 1 ? "stop" : "stops"
                  }`}
                />
              )}

              {trip.maxGroupSize && (
                <InfoPill
                  icon={<Users size={14} />}
                  label={`Up to ${trip.maxGroupSize}`}
                />
              )}
            </div>
          </div>
        </motion.section>

        {/* Chat */}
        <section>
          <TripThreadChat
            tripId={trip.id}
            currentUserId={tripClient.currentUserId}
            api={tripClient}
          />
        </section>
      </main>
    </div>
  );
}

function InfoPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-cream-deep px-3 py-1.5 text-xs font-medium text-ink-soft">
      {icon}
      {label}
    </span>
  );
}

function formatDateRange(
  start?: string | null,
  end?: string | null
): string {
  if (!start && !end) {
    return "Dates not set";
  }

  const format = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (start && end) {
    return `${format(start)} – ${format(end)}`;
  }

  if (start) {
    return format(start);
  }

  return format(end!);
}