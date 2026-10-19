import { useEffect, useState } from "react";
import { Button, Modal } from "../ui";
import { friendlyError } from "../../../utils/v2Utils/apiErrors";
import type { TripApiClient, TripPost, UpdateTripPayload } from "../../../types";

interface EditTripModalProps {
  trip: TripPost | null;
  api: Pick<TripApiClient, "updateTrip">;
  onClose: () => void;
  onSaved: (trip: TripPost) => void;
}

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink disabled:opacity-50 transition-colors";

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

// Edits a trip you posted (PATCH /api/trips/{id}). Sends only changed fields.
export default function EditTripModal({ trip, api, onClose, onSaved }: EditTripModalProps) {
  const [caption, setCaption] = useState("");
  const [isDateFlexible, setIsDateFlexible] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxGroupSize, setMaxGroupSize] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trip) return;
    setCaption(trip.caption ?? "");
    setIsDateFlexible(trip.isDateFlexible);
    setStartDate(toDateInput(trip.startDate));
    setEndDate(toDateInput(trip.endDate));
    setMaxGroupSize(trip.maxGroupSize ? String(trip.maxGroupSize) : "");
    setCoverImageUrl(trip.coverImageUrl ?? "");
    setError("");
  }, [trip]);

  if (!trip) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDateFlexible && startDate && endDate && endDate < startDate) {
      setError("The end date must be after the start date.");
      return;
    }
    const group = maxGroupSize ? Number(maxGroupSize) : null;
    if (group !== null && (!Number.isInteger(group) || group < 1)) {
      setError("Group size must be a whole number of at least 1.");
      return;
    }

    const changes: UpdateTripPayload = {};
    if (caption.trim() !== (trip.caption ?? "")) changes.caption = caption.trim();
    if (isDateFlexible !== trip.isDateFlexible) changes.isDateFlexible = isDateFlexible;
    const nextStart = isDateFlexible ? null : startDate || null;
    const nextEnd = isDateFlexible ? null : endDate || null;
    if (nextStart !== (toDateInput(trip.startDate) || null)) changes.startDate = nextStart;
    if (nextEnd !== (toDateInput(trip.endDate) || null)) changes.endDate = nextEnd;
    if (group !== trip.maxGroupSize) changes.maxGroupSize = group;
    if ((coverImageUrl.trim() || null) !== (trip.coverImageUrl ?? null)) changes.coverImageUrl = coverImageUrl.trim() || null;

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await api.updateTrip(trip.id, changes);
      // Fall back to merging locally if the API returns no body.
      onSaved(updated ?? { ...trip, ...changes, status: trip.status });
      onClose();
    } catch (err) {
      setError(friendlyError(err, { 404: "This trip no longer exists." }, "Couldn't save your changes."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={!!trip} onClose={onClose} label="Edit trip" className="sm:max-w-xl">
      <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-5">
        <div className="pr-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted mb-2">Edit trip</p>
          <h2 className="text-2xl font-light text-ink">{trip.destinationLabel}</h2>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">About the trip</span>
          <textarea rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} className={`${inputClass} resize-none`} />
        </label>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink">Dates</span>
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input type="checkbox" checked={isDateFlexible} onChange={(e) => setIsDateFlexible(e.target.checked)} className="w-4 h-4 accent-ink" />
              Flexible
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-muted">Start</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isDateFlexible} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-muted">End</span>
              <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} disabled={isDateFlexible} className={inputClass} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Max group size</span>
            <input type="number" min={1} placeholder="No limit" value={maxGroupSize} onChange={(e) => setMaxGroupSize(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Cover image URL</span>
            <input type="url" placeholder="https://" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} className={inputClass} />
          </label>
        </div>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}
