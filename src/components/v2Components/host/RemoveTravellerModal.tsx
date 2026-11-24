import { useState } from "react";
import { hostApi } from "../../../dataStore/v2Api/hostApi";
import { Button, Modal } from "../ui";
import { FormError, HostField } from "./HostUi";
import { inputClass } from "./hostStyles";
import { fieldErrors, formErrorText, trackHost } from "../../../utils/v2Utils/host";
import type { RemoveTravellerResult } from "../../../types/host";

const MAX_REASON = 450;

// Confirm-and-remove for a traveller with an overdue instalment (row.canRemove).
export default function RemoveTravellerModal({ tripId, interestId, travellerName, onClose, onRemoved }: {
  tripId: string;
  interestId: string;
  travellerName: string;
  onClose: () => void;
  onRemoved: (result: RemoveTravellerResult) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reasonError, setReasonError] = useState("");

  const remove = async () => {
    setBusy(true);
    setError("");
    setReasonError("");
    try {
      const result = await hostApi.removeTraveller(tripId, interestId, reason);
      trackHost("traveller_removed");
      onRemoved(result);
    } catch (e) {
      setReasonError(fieldErrors(e).reason ?? "");
      setError(formErrorText(e, {
        404: "This trip isn't one of yours.",
        409: "You can only remove a traveller once an instalment is past its due date and unpaid.",
      }, "Couldn't remove this traveller."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} label="Remove traveller">
      <div className="p-6 md:p-8 space-y-5">
        <div className="pr-10">
          <h3 className="text-2xl font-normal text-ink">Remove {travellerName}?</h3>
          <p className="text-sm text-ink-soft mt-2">
            This frees their seat and removes them from the trip chat. Money already paid is kept.
            Record any refund you agree to on the manifest.
          </p>
        </div>
        <HostField label="Reason (shown to the traveller)" error={reasonError}
          hint={`${reason.length}/${MAX_REASON}`}>
          <textarea className={`${inputClass} min-h-24`} value={reason} maxLength={MAX_REASON}
            onChange={e => setReason(e.target.value)} placeholder="e.g. Missed the first instalment." />
        </HostField>
        <FormError message={error} />
        <div className="flex gap-2">
          <Button loading={busy} onClick={remove} className="bg-red-700! hover:bg-red-800!">Remove traveller</Button>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
