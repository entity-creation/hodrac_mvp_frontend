import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { authApi } from "../../../dataStore/v2Api/client";
import { Button, PageHeader } from "../../../components/v2Components/ui";
import { friendlyError } from "../../../utils/v2Utils/apiErrors";
import { LOGIN_PATH } from "../../../utils/v2Utils/authRedirect";
import type { UserDto } from "../../../types";
import { CountryList } from "../../../components/v2Components/layout/CountryPicker";
import { useCurrency } from "../../../hooks/v2Hooks/useCurrency";
import { countryName, flagEmoji } from "../../../utils/v2Utils/countries";
import { ResendConfirmation } from "../auth/AuthPages";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors";

// Account settings: profile, email notifications, password.
// Route is behind <RequireAuth>, so `user` is always present here.
export default function AccountPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 pb-24">
      <PageHeader label="Account" title="Your settings" />
      <div className="flex flex-col gap-6">
        <ProfileSection user={user} />
        <CountrySection />
        <NotificationsSection user={user} />
        <PasswordSection />
      </div>
    </div>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-line rounded-2xl p-6 md:p-8">
      <h2 className="text-xl font-light text-ink">{title}</h2>
      {description && <p className="text-sm text-ink-muted mt-1">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Status({ kind, message }: { kind: "ok" | "error"; message: string }) {
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`text-sm ${kind === "error" ? "text-red-700" : "text-mint-500"}`}>
      {message}
    </p>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileSection({ user }: { user: UserDto }) {
  const { updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "error"; message: string } | null>(null);

  const dirty = displayName.trim() !== user.displayName;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setResult({ kind: "error", message: "Your name can't be empty." });
      return;
    }
    setSaving(true);
    setResult(null);
    try {
      const updated = await authApi.updateMe(displayName.trim());
      updateUser(updated ?? { displayName: displayName.trim() });
      setResult({ kind: "ok", message: "Saved." });
    } catch (err) {
      setResult({ kind: "error", message: friendlyError(err, {}, "Couldn't save your name.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Profile">
      <form onSubmit={save} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Name</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" className={inputClass} />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Email</span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink">{user.email}</span>
            {user.emailConfirmed ? (
              <span className="inline-flex items-center gap-1 text-xs text-mint-500">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-sun-500">
                <AlertCircle className="w-3.5 h-3.5" /> Not confirmed. Check your inbox for the confirmation link.
              </span>
            )}
          </div>
          {!user.emailConfirmed && (
            <div className="mt-2 max-w-xs">
              <ResendConfirmation />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" loading={saving} disabled={!dirty}>Save</Button>
          {result && <Status {...result} />}
        </div>
      </form>
    </Card>
  );
}

// ─── Country & currency ───────────────────────────────────────────────────────

function CountrySection() {
  const { country, preferredCurrency, isConverted } = useCurrency();
  const [changing, setChanging] = useState(false);

  return (
    <Card title="Country & currency" description="Prices across Hodrac are shown in your country's currency.">
      {changing ? (
        <div className="flex flex-col gap-4">
          <CountryList onChosen={() => setChanging(false)} />
          <div><Button variant="ghost" onClick={() => setChanging(false)}>Done</Button></div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl leading-none" aria-hidden="true">{flagEmoji(country)}</span>
            <div>
              <p className="text-sm text-ink">{countryName(country)}</p>
              <p className="text-xs text-ink-muted">
                {preferredCurrency}
                {preferredCurrency !== "USD" && !isConverted && " · exchange rates unavailable right now, showing USD"}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setChanging(true)}>Change</Button>
        </div>
      )}
    </Card>
  );
}

// ─── Email notifications ──────────────────────────────────────────────────────

function NotificationsSection({ user }: { user: UserDto }) {
  const { updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const enabled = !!user.notificationEmailOptIn;

  const toggle = async () => {
    const next = !enabled;
    setSaving(true);
    setError("");
    updateUser({ notificationEmailOptIn: next }); // optimistic
    try {
      await authApi.updateNotificationPreferences(next);
    } catch (err) {
      updateUser({ notificationEmailOptIn: enabled }); // roll back
      setError(friendlyError(err, {}, "Couldn't update your preference."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Email notifications" description="In-app notifications are always on. Choose whether we also email you.">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-sm text-ink">Email me about my trips</p>
          <p className="text-xs text-ink-muted mt-0.5">Join requests, approvals and new messages.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Email me about my trips"
          disabled={saving}
          onClick={toggle}
          className={`relative w-12 h-7 rounded-full shrink-0 transition-colors disabled:opacity-60 ${enabled ? "bg-ink" : "bg-cream-deep border border-line"}`}
        >
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>
      {error && <div className="mt-4"><Status kind="error" message={error} /></div>}
    </Card>
  );
}

// ─── Password ─────────────────────────────────────────────────────────────────

function PasswordSection() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!current) return setError("Enter your current password.");
    if (next.length < 8) return setError("Your new password must be at least 8 characters.");
    if (next !== confirm) return setError("The new passwords don't match.");
    if (next === current) return setError("Choose a password different from your current one.");

    setSaving(true);
    try {
      await authApi.changePassword(current, next);
      // The server has ended every session, including this one. Leave this
      // protected page first so the route guard doesn't redirect elsewhere,
      // then clear the local session.
      navigate(`${LOGIN_PATH}?reason=password-changed`, { replace: true });
      await logout();
    } catch (err) {
      setError(friendlyError(err, {
        400: "Your current password is incorrect, or the new one doesn't meet the requirements.",
        401: "Your current password is incorrect.",
      }, "Couldn't change your password."));
      setSaving(false);
    }
  };

  return (
    <Card title="Password" description="Changing your password signs you out on every device.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Current password</span>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={inputClass} />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">New password</span>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Confirm new password</span>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={inputClass} />
          </label>
        </div>
        {error && <Status kind="error" message={error} />}
        <div>
          <Button type="submit" loading={saving}>Change password</Button>
        </div>
      </form>
    </Card>
  );
}
