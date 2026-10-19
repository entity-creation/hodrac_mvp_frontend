import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, X, ArrowRight, Loader2 } from "lucide-react";

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant =
  | "primary"   // solid black — the main call to action
  | "secondary" // charcoal
  | "dark"      // solid ink
  | "outline"   // hairline outline on white
  | "soft"      // quiet tinted
  | "ghost"
  | "danger";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit";
  fullWidth?: boolean;
  ariaLabel?: string;
}

const BUTTON_BASE =
  "inline-flex items-center justify-center font-medium tracking-wide rounded-full transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink-soft",
  secondary: "bg-grape-500 text-white hover:bg-ink",
  dark: "bg-ink text-white hover:bg-ink-soft",
  outline: "bg-transparent text-ink border border-ink/25 hover:border-ink hover:bg-white",
  soft: "bg-cream-deep text-ink hover:bg-brand-100",
  ghost: "text-ink-soft hover:text-ink hover:bg-ink/5",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

const BUTTON_SIZES = {
  sm: "px-4 py-2 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-sm gap-2",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: "sm" | "md" | "lg" = "md",
  extra = ""
) {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${extra}`;
}

export function Button({
  children, onClick, variant = "primary", size = "md",
  disabled, loading, className = "", type = "button", fullWidth, ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={buttonClasses(variant, size, `${fullWidth ? "w-full" : ""} ${className}`)}
    >
      {loading && <Loader2 className="animate-spin w-4 h-4" />}
      {children}
    </button>
  );
}

// Router link styled as a Button.
export function ButtonLink({
  to, children, variant = "primary", size = "md", className = "",
}: {
  to: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <Link to={to} className={buttonClasses(variant, size, className)}>
      {children}
    </Link>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeTone = "brand" | "grape" | "sky" | "sun" | "mint" | "ink" | "neutral" | "sponsored";

const BADGE_TONES: Record<BadgeTone, string> = {
  brand: "bg-brand-100 text-brand-700",
  grape: "bg-grape-100 text-grape-700",
  sky: "bg-sky-100 text-ink",
  sun: "bg-sun-300 text-ink",
  mint: "bg-mint-100 text-ink",
  ink: "bg-ink text-white",
  neutral: "bg-ink/5 text-ink-soft",
  sponsored: "bg-sun-100 text-sun-500 border border-sun-300",
};

export function Badge({
  children, tone = "neutral", className = "",
}: { children: React.ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-[0.12em] ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ─── Chip (toggleable filter / vibe pill) ─────────────────────────────────────

export function Chip({
  children, active, onClick, className = "",
}: { children: React.ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
        active
          ? "bg-ink text-white border-ink"
          : "bg-white text-ink-soft border-line hover:border-ink hover:text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-ink/6 rounded-xl ${className}`} />;
}

export function WishlistCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-line overflow-hidden flex flex-col">
      <Skeleton className="h-40 rounded-none" />
      <div className="p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-6 w-24 mt-2" />
      </div>
    </div>
  );
}

export function DestinationCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-line overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 mt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-18 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`animate-spin text-ink-muted ${className}`} />;
}

export function FullPageSpinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({
  emoji = "🗺️", title, subtitle, action,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center px-6"
    >
      <span className="w-14 h-14 rounded-full bg-cream-deep flex items-center justify-center text-2xl mb-6 grayscale opacity-70" aria-hidden="true">
        {emoji}
      </span>
      <h3 className="text-2xl font-normal text-ink mb-2">{title}</h3>
      {subtitle && <p className="text-ink-muted text-sm max-w-sm mb-6">{subtitle}</p>}
      {action}
    </motion.div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({
  label, title, subtitle, children,
}: { label?: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center pt-16 pb-12 px-5"
    >
      {label && (
        <p className="text-[11px] font-medium text-ink-muted uppercase tracking-[0.25em] mb-5">
          {label}
        </p>
      )}
      <h1 className="text-4xl md:text-6xl font-light text-ink mb-5 leading-[1.05]">
        {title}
      </h1>
      {subtitle && (
        <p className="text-ink-soft text-base md:text-lg max-w-xl mx-auto">{subtitle}</p>
      )}
      {children}
    </motion.div>
  );
}

// ─── Section (landing / detail page block) ────────────────────────────────────

export function Section({
  eyebrow, title, subtitle, action, children, className = "", id,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  action?: { label: string; to: string };
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-20 md:py-28 ${className}`}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-muted mb-4">{eyebrow}</p>
            )}
            <h2 className="text-3xl md:text-5xl font-light text-ink leading-[1.08]">{title}</h2>
            {subtitle && <p className="text-ink-soft mt-3 text-base md:text-lg">{subtitle}</p>}
          </div>
          {action && (
            <Link
              to={action.to}
              className="group inline-flex items-center gap-2 text-sm font-medium text-ink shrink-0 border-b border-ink/30 hover:border-ink pb-0.5 transition-colors"
            >
              {action.label}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  isOpen, onClose, children, className = "", label,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 bg-ink/25 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-5"
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={`relative w-full sm:max-w-lg bg-white/85 backdrop-blur-2xl border border-white/70 rounded-t-2xl sm:rounded-2xl shadow-pop-lg max-h-[92vh] overflow-y-auto ${className}`}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center hover:bg-cream-deep transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── SaveButton ──────────────────────────────────────────────────────────────

export function SaveButton({
  saved, onToggle, size = "md",
}: { saved: boolean; onToggle: () => void; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-9 h-9" : "w-11 h-11";
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.85 }}
      onClick={e => { e.stopPropagation(); e.preventDefault(); onToggle(); }}
      aria-label={saved ? "Remove from saved" : "Save"}
      aria-pressed={saved}
      className={`${s} rounded-full flex items-center justify-center border border-line transition-colors duration-200 ${
        saved ? "bg-ink text-white border-ink" : "bg-white/90 backdrop-blur text-ink hover:bg-white"
      }`}
    >
      <Heart className="w-4 h-4" fill={saved ? "currentColor" : "none"} strokeWidth={1.75} />
    </motion.button>
  );
}

// ─── StarRating ───────────────────────────────────────────────────────────────

export function StarRating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sun-500 text-sm font-medium">★ {value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-ink-muted text-xs">({count.toLocaleString()})</span>
      )}
    </div>
  );
}

// ─── CountdownTimer ───────────────────────────────────────────────────────────

export function CountdownTimer({ validUntil }: { validUntil: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(validUntil).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [validUntil]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-sun-100 border border-line rounded-2xl">
      <span className="text-sm">⏳</span>
      <div>
        <p className="text-[10px] font-medium text-ink-soft uppercase tracking-wide">Price locked for</p>
        <p className="text-sm font-semibold text-ink">{remaining}</p>
      </div>
    </div>
  );
}

// ─── SortBar ─────────────────────────────────────────────────────────────────

export function SortBar({
  options, value, onChange,
}: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      <span className="text-xs font-medium text-ink-muted shrink-0 uppercase tracking-wide">Sort</span>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
            value === opt.value
              ? "bg-ink text-white border-ink"
              : "bg-white text-ink-soft border-line hover:border-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── InfoRow (detail page stat) ───────────────────────────────────────────────

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-line last:border-0">
      <span className="text-xs font-medium text-ink-muted uppercase tracking-wide w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-ink flex-1">{value}</span>
    </div>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl md:text-3xl font-light text-ink mb-6">
      {children}
    </h2>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

export function ScoreBar({ label, value, max = 5, color = "var(--color-brand-500)" }: {
  label: string; value: number; max?: number; color?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-soft">{label}</span>
        <span className="text-xs font-semibold text-ink">{value}/{max}</span>
      </div>
      <div className="h-1 bg-cream-deep rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
