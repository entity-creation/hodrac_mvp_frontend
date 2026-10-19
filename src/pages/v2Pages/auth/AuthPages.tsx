import { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { Button, buttonClasses } from "../../../components/v2Components/ui";
import { authPath, LOGIN_PATH, REGISTER_PATH, safeRedirect } from "../../../utils/v2Utils/authRedirect";
import { authApi, isApiError } from "../../../dataStore/v2Api/client";
import { friendlyError } from "../../../utils/v2Utils/apiErrors";
import { rawQueryParam } from "../../../utils/v2Utils/queryParams";

// Why the user landed on the login page, shown as a notice above the form.
const LOGIN_NOTICES: Record<string, string> = {
  "password-changed": "Your password was changed and you've been signed out everywhere. Sign in with your new password.",
  "password-reset": "Your password has been reset. Sign in with your new password.",
};

// Where to send the user after a successful login/register.
function useRedirectTarget() {
  const [params] = useSearchParams();
  const raw = params.get("redirect");
  return { target: safeRedirect(raw), hasRedirect: !!raw && safeRedirect(raw) !== "/" };
}

// ─── Shared field component ───────────────────────────────────────────────────

function AuthField({
  label, type = "text", value, onChange, placeholder, error, autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full px-4 py-3 rounded-2xl border text-sm bg-white text-ink placeholder:text-ink-muted focus:outline-none focus:shadow-pop-sm transition ${
            error ? "border-red-400" : "border-line focus:border-ink"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-muted hover:text-ink"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </span>
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

// ─── Shared shell ─────────────────────────────────────────────────────────────

function AuthShell({
  title, subtitle, emoji, children, footer,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-12 relative overflow-hidden">
      {/* Playful background blobs */}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink-muted mb-5">{emoji}</p>
          <h1 className="text-4xl md:text-5xl font-light text-ink">{title}</h1>
          <p className="text-ink-soft mt-2">{subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl border border-line shadow-pop-lg p-7 md:p-8">
          {children}
        </div>

        <div className="text-center text-sm text-ink-soft mt-6">{footer}</div>
      </motion.div>
    </div>
  );
}

function InfoBox({ message }: { message: string }) {
  return (
    <div role="status" className="px-4 py-3 bg-cream-deep border border-line rounded-2xl text-sm text-ink">
      {message}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="px-4 py-3 bg-red-50 border border-red-300 rounded-2xl text-sm font-semibold text-red-700">
      {message}
    </div>
  );
}

// ─── Login page ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { target, hasRedirect } = useRedirectTarget();
  const [params] = useSearchParams();
  const notice = LOGIN_NOTICES[params.get("reason") ?? ""];

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const validate = (): boolean => {
    if (!email.includes("@")) { setError("Please enter a valid email."); return false; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate(target, { replace: true });
    } catch (e: any) {
      setError(e.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      emoji="Sign in"
      title="Welcome back"
      subtitle={hasRedirect ? "Sign in to pick up right where you left off." : "Sign in to your travel account."}
      footer={
        <>
          New to Hodrac?{" "}
          <Link to={authPath(REGISTER_PATH, target)} className="font-medium text-brand-600 hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {notice && <InfoBox message={notice} />}
        <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <div className="flex flex-col gap-2">
          <AuthField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
          <Link
            to={`/auth/forgot-password${email.includes("@") ? `?email=${encodeURIComponent(email)}` : ""}`}
            className="self-end text-xs text-ink-soft hover:text-ink underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>

        {error && <ErrorBox message={error} />}

        <Button type="submit" loading={loading} fullWidth size="lg">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

// ─── Register page ────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { target, hasRedirect } = useRedirectTarget();

  const [displayName, setDisplayName] = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!displayName.trim())       e.displayName = "Name is required.";
    if (!email.includes("@"))      e.email       = "Enter a valid email.";
    if (password.length < 8)       e.password    = "Password must be at least 8 characters.";
    if (password !== confirm)      e.confirm     = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await register(email, password, displayName);
      navigate(target, { replace: true });
    } catch (e: any) {
      setGlobalError(e.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      emoji="Create account"
      title="Start your journey"
      subtitle={hasRedirect ? "Create a free account to keep going." : "Save trip ideas, plan with friends, and find travel buddies. Free."}
      footer={
        <>
          Already have an account?{" "}
          <Link to={authPath(LOGIN_PATH, target)} className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <AuthField label="Your name" value={displayName} onChange={setDisplayName} placeholder="Alex Johnson" error={errors.displayName} autoComplete="name" />
        <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} autoComplete="email" />
        <AuthField label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" error={errors.password} autoComplete="new-password" />
        <AuthField label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat your password" error={errors.confirm} autoComplete="new-password" />

        {globalError && <ErrorBox message={globalError} />}

        <Button type="submit" loading={loading} fullWidth size="lg">
          Create my account
        </Button>

        <p className="text-center text-xs text-ink-muted">
          By registering you agree to Hodrac's Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}

// ─── Forgot password ──────────────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyError(err, {}, "We couldn't send the reset email. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      emoji="Reset password"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link to={LOGIN_PATH} className="font-medium text-brand-600 hover:underline">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col gap-4 text-center">
          <p className="text-ink">Check your inbox.</p>
          <p className="text-sm text-ink-soft">
            If an account exists for <span className="text-ink">{email}</span>, you'll get an email with a link to reset your password.
          </p>
          <button onClick={() => setSent(false)} className="text-sm text-ink-soft hover:text-ink underline underline-offset-4">
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
          {error && <ErrorBox message={error} />}
          <Button type="submit" loading={loading} fullWidth size="lg">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}

// ─── Reset password (from the emailed link) ───────────────────────────────────
// Expects /reset-password?userId=…&token=… (token read raw — see rawQueryParam).

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [userId] = useState(() => rawQueryParam("userId") ?? "");
  const [token] = useState(() => rawQueryParam("token") ?? "");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const linkInvalid = !userId || !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const next: Record<string, string> = {};
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (password !== confirm) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await authApi.resetPassword(userId, token, password);
      // A reset ends every session, including this browser's.
      navigate(`${LOGIN_PATH}?reason=password-reset`, { replace: true });
      if (isAuthenticated) await logout();
    } catch (err) {
      setError(friendlyError(err, {
        400: "This reset link is invalid or has expired. Request a new one.",
        404: "This reset link is invalid or has expired. Request a new one.",
      }, "We couldn't reset your password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      emoji="Reset password"
      title="Choose a new password"
      subtitle={linkInvalid ? "This reset link is incomplete." : "Pick something you haven't used here before."}
      footer={
        <Link to="/auth/forgot-password" className="font-medium text-brand-600 hover:underline">
          Request a new link
        </Link>
      }
    >
      {linkInvalid ? (
        <p className="text-sm text-ink-soft text-center">
          Open the link from your email again, or request a new one below.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <AuthField label="New password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" error={errors.password} autoComplete="new-password" />
          <AuthField label="Confirm new password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat your password" error={errors.confirm} autoComplete="new-password" />
          {error && <ErrorBox message={error} />}
          <Button type="submit" loading={loading} fullWidth size="lg">Reset password</Button>
        </form>
      )}
    </AuthShell>
  );
}

// ─── Confirm email (from the emailed link) ────────────────────────────────────
// Expects /confirm-email?userId=…&token=… and confirms automatically on load.

type ConfirmState = "confirming" | "confirmed" | "already" | "failed" | "invalid";

export function ConfirmEmailPage() {
  const { isAuthenticated, updateUser } = useAuth();
  const [userId] = useState(() => rawQueryParam("userId") ?? "");
  const [token] = useState(() => rawQueryParam("token") ?? "");
  const [state, setState] = useState<ConfirmState>(userId && token ? "confirming" : "invalid");
  const [message, setMessage] = useState("");
  // The token is single-use: make sure we only send it once, even when React
  // runs effects twice in development.
  const started = useRef(false);

  useEffect(() => {
    if (!userId || !token || started.current) return;
    started.current = true;
    authApi.confirmEmail(userId, token)
      .then(() => {
        setState("confirmed");
        if (isAuthenticated) updateUser({ emailConfirmed: true });
      })
      .catch((err) => {
        if (isApiError(err, 409)) {
          setState("already");
          if (isAuthenticated) updateUser({ emailConfirmed: true });
          return;
        }
        setState("failed");
        setMessage(friendlyError(err, {
          400: "This confirmation link is invalid or has expired.",
          404: "This confirmation link is invalid or has expired.",
        }, "We couldn't confirm your email."));
      });
  }, [userId, token, isAuthenticated, updateUser]);

  const content: Record<ConfirmState, { title: string; subtitle: string }> = {
    confirming: { title: "Confirming your email…", subtitle: "This only takes a moment." },
    confirmed: { title: "Email confirmed", subtitle: "Thanks. Your account is all set." },
    already: { title: "Already confirmed", subtitle: "This email address has already been confirmed." },
    failed: { title: "We couldn't confirm your email", subtitle: message },
    invalid: { title: "This link is incomplete", subtitle: "Open the link from your email again, or request a new one." },
  };
  const { title, subtitle } = content[state];
  const done = state === "confirmed" || state === "already";

  return (
    <AuthShell
      emoji="Email confirmation"
      title={title}
      subtitle={subtitle}
      footer={<Link to="/" className="font-medium text-brand-600 hover:underline">Back to Hodrac</Link>}
    >
      {state === "confirming" ? (
        <div className="flex justify-center py-6">
          <span className="w-6 h-6 border-2 border-line border-t-ink rounded-full animate-spin" aria-label="Confirming" />
        </div>
      ) : done ? (
        isAuthenticated ? (
          <Link to="/" className={buttonClasses("primary", "lg", "w-full")}>Continue exploring</Link>
        ) : (
          <Link to={LOGIN_PATH} className={buttonClasses("primary", "lg", "w-full")}>Sign in</Link>
        )
      ) : (
        <ResendConfirmation />
      )}
    </AuthShell>
  );
}

// Lets a signed-in user request a fresh confirmation email; asks guests to sign in first.
export function ResendConfirmation() {
  const { isAuthenticated } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-ink-soft">Sign in and we'll send you a new confirmation link.</p>
        <Link to={authPath(LOGIN_PATH, "/account")} className={buttonClasses("primary", "lg", "w-full")}>
          Sign in to resend
        </Link>
      </div>
    );
  }

  const resend = async () => {
    setSending(true);
    setError("");
    try {
      await authApi.resendConfirmation();
      setSent(true);
    } catch (err) {
      setError(friendlyError(err, { 409: "Your email is already confirmed." }, "We couldn't send a new link."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {sent ? (
        <InfoBox message="A new confirmation link is on its way. Check your inbox (and spam folder)." />
      ) : (
        <Button fullWidth size="lg" loading={sending} onClick={resend}>Send a new confirmation link</Button>
      )}
      {error && <ErrorBox message={error} />}
    </div>
  );
}
