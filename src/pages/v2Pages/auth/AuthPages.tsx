import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { Button } from "../../../components/v2Components/ui";

// ─── Shared field component ───────────────────────────────────────────────────

function AuthField({
  label, type = "text", value, onChange, placeholder, error,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl border-2 text-sm bg-white focus:outline-none transition ${
            error
              ? "border-red-300 focus:border-red-500"
              : "border-gray-200 focus:border-gray-900"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Login page ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

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
      navigate("/");
    } catch (e: any) {
      setError(e.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-3xl font-black text-gray-900 mb-3 block mx-auto"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Hodrac
          </button>
          <h1 className="text-xl font-black text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your travel account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col gap-5">
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />
          <AuthField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Sign In
          </Button>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/auth/register" className="font-semibold text-gray-900 hover:underline">
              Create one
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in you agree to Hodrac's{" "}
          <span className="underline cursor-pointer">Terms of Service</span> and{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Register page ────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

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
      navigate("/");
    } catch (e: any) {
      setGlobalError(e.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-3xl font-black text-gray-900 mb-3 block mx-auto"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Hodrac
          </button>
          <h1 className="text-xl font-black text-gray-900">Start your journey</h1>
          <p className="text-gray-500 text-sm mt-1">Create your free travel account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col gap-5">
          <AuthField
            label="Your Name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Alex Johnson"
            error={errors.displayName}
          />
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            error={errors.email}
          />
          <AuthField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            error={errors.password}
          />
          <AuthField
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat your password"
            error={errors.confirm}
          />

          {globalError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {globalError}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Create Account
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-semibold text-gray-900 hover:underline">
              Sign in
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          By registering you agree to Hodrac's{" "}
          <span className="underline cursor-pointer">Terms of Service</span> and{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
}
