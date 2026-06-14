import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit";
  fullWidth?: boolean;
}

export function Button({
  children, onClick, variant = "primary", size = "md",
  disabled, loading, className = "", type = "button", fullWidth,
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-700",
    outline: "border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white",
    ghost:   "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    danger:  "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({
  children, color = "#6366f1",
}: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {children}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

export function WishlistCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col">
      <Skeleton className="h-2 rounded-none" />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex justify-between">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function DestinationCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 mt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-18 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full rounded-full mt-2" />
      </div>
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
      <span className="text-5xl mb-4">{emoji}</span>
      <h3 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
        {title}
      </h3>
      {subtitle && <p className="text-gray-500 text-sm max-w-xs mb-6">{subtitle}</p>}
      {action}
    </motion.div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({
  label, title, subtitle,
}: { label?: string; title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-5"
    >
      {label && (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      )}
      <h1
        className="text-3xl md:text-5xl font-black text-gray-900 mb-4"
        style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-gray-500 max-w-xl mx-auto">{subtitle}</p>
      )}
    </motion.div>
  );
}

// ─── SaveButton ──────────────────────────────────────────────────────────────

export function SaveButton({
  saved, onToggle, size = "md",
}: { saved: boolean; onToggle: () => void; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={e => { e.stopPropagation(); e.preventDefault(); onToggle(); }}
      className={`${s} rounded-full flex items-center justify-center transition-all duration-200 ${
        saved ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </motion.button>
  );
}

// ─── StarRating ───────────────────────────────────────────────────────────────

export function StarRating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-amber-400 text-sm font-bold">★ {value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-gray-400 text-xs">({count.toLocaleString()})</span>
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
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl">
      <span className="text-amber-500 text-sm">⏳</span>
      <div>
        <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Price locked for</p>
        <p className="text-sm font-black text-amber-700">{remaining}</p>
      </div>
    </div>
  );
}

// ─── SortBar ─────────────────────────────────────────────────────────────────

export function SortBar({
  options, value, onChange,
}: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      <span className="text-xs font-semibold text-gray-400 shrink-0">Sort:</span>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 flex-1">{value}</span>
    </div>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl md:text-2xl font-black text-gray-900 mb-6"
      style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
    >
      {children}
    </h2>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

export function ScoreBar({ label, value, max = 5, color = "#6366f1" }: {
  label: string; value: number; max?: number; color?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-bold text-gray-700">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
