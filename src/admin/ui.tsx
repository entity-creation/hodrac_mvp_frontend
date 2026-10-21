import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, X, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { ToastContext, type ToastKind } from "./hooks";
import { fmtDate, fmtNumber } from "./format";

// Shared components for every admin section. Keep sections consistent by
// composing these rather than styling from scratch. Formatters live in
// ./format, data/toast hooks in ./hooks.

// ─── Toasts ───────────────────────────────────────────────────────────────────

type Toast = { id: number; kind: ToastKind; message: string };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((message: string, kind: ToastKind = "ok") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, kind, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 right-5 z-200 flex flex-col gap-2 max-w-sm" aria-live="polite">
          <AnimatePresence>
            {toasts.map(t => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-pop-lg ${
                  t.kind === "ok" ? "bg-white border-line text-ink" : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {t.kind === "ok" ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-mint-500 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                <span>{t.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export function AdminPage({ title, description, actions, children }: {
  title: string; description?: string; actions?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-light text-ink">{title}</h1>
          {description && <p className="text-sm text-ink-muted mt-1">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, actions, children, className = "", padded = true }: {
  title?: string; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean;
}) {
  return (
    <section className={`bg-white border border-line rounded-2xl ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
          {title && <h2 className="text-base font-normal text-ink">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="bg-white border border-line rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">{label}</p>
      <p className="font-display text-3xl font-light text-ink mt-2">{value}</p>
      {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 mb-4">{children}</div>;
}

export function LoadingBlock() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-ink-muted" />
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && <button onClick={onRetry} className="underline underline-offset-4">Retry</button>}
    </div>
  );
}

// ─── Buttons & pills ──────────────────────────────────────────────────────────

type Variant = "primary" | "outline" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-soft",
  outline: "border border-line bg-white text-ink hover:border-ink",
  ghost: "text-ink-soft hover:text-ink hover:bg-cream-deep",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

export function Btn({ variant = "outline", size = "md", loading, disabled, children, className = "", ...rest }: {
  variant?: Variant; size?: "sm" | "md"; loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

// Two-step destructive action: first click asks, second confirms.
export function ConfirmBtn({ label, confirmLabel = "Confirm", onConfirm, loading, size = "md", variant = "danger" }: {
  label: ReactNode; confirmLabel?: string; onConfirm: () => void; loading?: boolean; size?: "sm" | "md"; variant?: Variant;
}) {
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!asking) return;
    const t = setTimeout(() => setAsking(false), 5000);
    return () => clearTimeout(t);
  }, [asking]);
  return asking ? (
    <span className="inline-flex items-center gap-1">
      <Btn size={size} variant="danger" loading={loading} onClick={() => { onConfirm(); setAsking(false); }}>{confirmLabel}</Btn>
      <Btn size={size} variant="ghost" onClick={() => setAsking(false)}>Cancel</Btn>
    </span>
  ) : (
    <Btn size={size} variant={variant === "danger" ? "outline" : variant} className={variant === "danger" ? "text-red-700!" : ""} onClick={() => setAsking(true)}>
      {label}
    </Btn>
  );
}

type Tone = "neutral" | "good" | "warn" | "bad" | "info";
const TONES: Record<Tone, string> = {
  neutral: "bg-cream-deep text-ink-soft border-line",
  good: "bg-mint-100 text-mint-500 border-mint-300",
  warn: "bg-sun-100 text-sun-500 border-sun-300",
  bad: "bg-red-50 text-red-700 border-red-200",
  info: "bg-sky-100 text-sky-500 border-sky-300",
};
export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink disabled:opacity-50";

export function SearchBox({ value, onChange, placeholder = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className={`${inputCls} pl-9 pr-8 rounded-full`} />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function Select<T extends string>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label?: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as T)} aria-label={label}
      className="rounded-full border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-ink-muted">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${inputCls} resize-y ${props.className ?? ""}`} />;
}

export function NumberInput({ value, onChange, className = "", ...rest }: {
  value: number | null | undefined; onChange: (v: number | null) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input type="number" value={value ?? ""} onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
      {...rest} className={`${inputCls} ${className}`} />
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-ink" />
      {label}
    </label>
  );
}

// Edits a string[] as removable chips plus an "add" input (Enter or comma).
export function ListInput({ value, onChange, placeholder = "Add and press Enter" }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length) onChange([...value, ...parts.filter(p => !value.includes(p))]);
    setDraft("");
  };
  return (
    <div className="rounded-lg border border-line bg-white p-2 flex flex-wrap gap-1.5 focus-within:border-ink">
      {value.map(v => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-cream-deep px-2 py-0.5 text-xs text-ink">
          {v}
          <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter(x => x !== v))} className="text-ink-muted hover:text-ink">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add} className="flex-1 min-w-32 text-sm text-ink bg-transparent outline-none px-1" />
    </div>
  );
}

// ─── Table & pager ────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, loading, empty = "Nothing here yet." }: {
  columns: Column<T>[]; rows: T[] | null | undefined; rowKey: (row: T) => string;
  onRowClick?: (row: T) => void; loading?: boolean; empty?: ReactNode;
}) {
  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {columns.map(c => (
                <th key={c.key} className={`px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted whitespace-nowrap ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !rows?.length ? (
              <tr><td colSpan={columns.length}><LoadingBlock /></td></tr>
            ) : !rows?.length ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-ink-muted">{empty}</td></tr>
            ) : (
              rows.map(row => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-line last:border-0 ${onRowClick ? "cursor-pointer hover:bg-cream-deep/60" : ""} ${loading ? "opacity-60" : ""}`}
                >
                  {columns.map(c => (
                    <td key={c.key} className={`px-4 py-3 align-middle text-ink ${c.className ?? ""}`}>{c.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Pager({ page, totalPages, totalCount, onChange }: {
  page: number; totalPages: number; totalCount?: number; onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mt-4 text-sm text-ink-soft">
      <span>{totalCount != null ? `${fmtNumber(totalCount)} total` : ""}</span>
      <div className="flex items-center gap-2">
        <Btn size="sm" variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="w-4 h-4" />
        </Btn>
        <span>Page {page} of {totalPages}</span>
        <Btn size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight className="w-4 h-4" />
        </Btn>
      </div>
    </div>
  );
}

// ─── Drawer (detail/edit panel) ───────────────────────────────────────────────

// Open drawers, oldest first: Escape closes only the topmost one.
const drawerStack: symbol[] = [];

export function Drawer({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const id = Symbol("drawer");
    drawerStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawerStack[drawerStack.length - 1] === id) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const i = drawerStack.indexOf(id);
      if (i !== -1) drawerStack.splice(i, 1);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-100 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm" onMouseDown={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className={`relative h-full w-full ${wide ? "max-w-3xl" : "max-w-xl"} bg-white border-l border-line shadow-pop-lg flex flex-col`}
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-line">
              <div className="min-w-0 text-lg font-light text-ink truncate">{title}</div>
              <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-cream-deep flex items-center justify-center shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-line flex flex-wrap justify-end gap-2">{footer}</div>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Key/value rows for detail views.
export function DetailList({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex gap-4 py-2.5 text-sm">
          <dt className="w-40 shrink-0 text-ink-muted">{k}</dt>
          <dd className="flex-1 min-w-0 text-ink wrap-break-word">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

// Daily bar chart (inline SVG). `points` should be gap-free (fillDailySeries).
export function DailyBars({ points, label, height = 120 }: { points: { date: string; value: number }[]; label: string; height?: number }) {
  const max = Math.max(1, ...points.map(p => p.value));
  const total = points.reduce((s, p) => s + p.value, 0);
  const w = 100 / Math.max(1, points.length);
  return (
    <figure>
      <div className="flex items-baseline justify-between mb-2">
        <figcaption className="text-sm text-ink">{label}</figcaption>
        <span className="text-xs text-ink-muted">{fmtNumber(total)} total</span>
      </div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label={`${label}: ${total} total`}>
        {points.map((p, i) => {
          const h = (p.value / max) * (height - 4);
          return (
            <rect key={p.date} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={Math.max(h, p.value ? 1 : 0)} rx={0.6} className="fill-ink/80 hover:fill-ink">
              <title>{`${fmtDate(p.date)}: ${fmtNumber(p.value)}`}</title>
            </rect>
          );
        })}
        <line x1="0" x2="100" y1={height - 0.5} y2={height - 0.5} className="stroke-line" strokeWidth={0.5} />
      </svg>
      {points.length > 1 && (
        <div className="flex justify-between text-[10px] text-ink-muted mt-1">
          <span>{fmtDate(points[0].date)}</span>
          <span>{fmtDate(points[points.length - 1].date)}</span>
        </div>
      )}
    </figure>
  );
}
