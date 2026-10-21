import type { ReactNode } from "react";
import {
  adminApi, type InsightAudience, type InsightBucket, type InsightTag, type InsightVectors,
} from "./api";
import { ErrorBlock, LoadingBlock, Panel, StatCard } from "./ui";
import { useRawErrorQuery as useInsightQuery } from "./hooks";
import { fmtDateTime, fmtNumber } from "./format";
import { isApiError } from "../dataStore/v2Api/client";
import { friendlyError } from "../utils/v2Utils/apiErrors";

// Shared views for /api/admin/insights responses. Everything here is totals
// only: groups smaller than minBucketSize are merged into "other".

// ─── Labels ───────────────────────────────────────────────────────────────────

// Keys that read badly as-is. "stress_free_logistics" is where the backend
// stores the "Saving money" priority (legacy mapping).
const KEY_LABELS: Record<string, string> = {
  stress_free_logistics: "Saving money",
  budget_under_100_per_day: "Budget (under $100/day)",
  mid_range_100_250: "Mid-range ($100–250/day)",
  premium_250_500: "Premium ($250–500/day)",
  luxury_500_plus: "Luxury ($500+/day)",
  upper_middle: "Upper middle",
  cluster_luxury_couple: "Luxury couple",
  cluster_budget_solo: "Budget solo",
};

function label(key: string, minBucketSize: number): string {
  const k = key.trim();
  const lower = k.toLowerCase();
  if (lower === "unknown" || lower === "cluster_unknown") return "Not answered";
  if (lower === "other") return `Other (groups under ${minBucketSize})`;
  if (KEY_LABELS[lower]) return KEY_LABELS[lower];
  // Normalised keys (snake_case, cluster_ prefix) → "Sentence case".
  if (/^[a-z0-9_]+$/.test(k)) {
    const words = k.replace(/^cluster_/, "").split("_").filter(Boolean).join(" ");
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  return k; // raw answer text: show as given
}

const isOther = (key: string) => key.trim().toLowerCase() === "other";
const isUnknown = (key: string) => ["unknown", "cluster_unknown"].includes(key.trim().toLowerCase());

const VECTOR_LABELS: Record<keyof InsightVectors, string> = {
  adventureSeeker: "Adventure seeker",
  socialButterfly: "Social butterfly",
  plannerVsSpontaneous: "Planner vs spontaneous",
  culturalImmersionIndex: "Cultural immersion",
  teenValidationPriority: "Teen validation priority",
  opennessToExperience: "Openness to experience",
  conscientiousness: "Conscientiousness",
  extraversion: "Extraversion",
};

// ─── Errors ───────────────────────────────────────────────────────────────────

export function InsightsError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = isApiError(error, 503)
    ? "Insights are unavailable right now because the insights database can't be reached. Try again shortly."
    : friendlyError(error, {}, "Couldn't load insights.");
  return <ErrorBlock message={message} onRetry={onRetry} />;
}

// ─── Building blocks ──────────────────────────────────────────────────────────

export function BucketBars({ title, buckets, minBucketSize, hint }: {
  title: string; buckets: InsightBucket[] | null | undefined; minBucketSize: number; hint?: ReactNode;
}) {
  const rows = buckets ?? [];
  const total = rows.reduce((s, b) => s + b.count, 0);
  const max = Math.max(1, ...rows.map(b => b.count));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-medium text-ink font-sans">{title}</h3>
        <span className="text-xs text-ink-muted">{fmtNumber(total)}</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No data yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map(b => {
            const share = total ? Math.round((b.count / total) * 100) : 0;
            const muted = isOther(b.key) || isUnknown(b.key);
            return (
              <li key={b.key} className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className={`truncate ${muted ? "text-ink-muted italic" : "text-ink"}`} title={b.key}>
                    {label(b.key, minBucketSize)}
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft tabular-nums">
                    {fmtNumber(b.count)} <span className="text-ink-muted">· {share}%</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-cream-deep overflow-hidden">
                  <div className={`h-full rounded-full ${muted ? "bg-ink/25" : "bg-ink/80"}`} style={{ width: `${(b.count / max) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {hint && <p className="text-[11px] text-ink-muted mt-2">{hint}</p>}
    </div>
  );
}

export function TagTable({ tags, minBucketSize }: { tags: InsightTag[] | null | undefined; minBucketSize: number }) {
  const rows = tags ?? [];
  if (!rows.length) return <p className="text-sm text-ink-muted">No tag activity yet.</p>;
  const max = Math.max(1, ...rows.map(t => t.interactions));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-line">
            <th className="py-2 pr-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">#</th>
            <th className="py-2 pr-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">Tag</th>
            <th className="py-2 pr-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted w-1/3">Interactions</th>
            <th className="py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted text-right">People</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => {
            const other = isOther(t.tag);
            return (
              <tr key={t.tag} className="border-b border-line last:border-0">
                <td className="py-2 pr-3 text-ink-muted tabular-nums">{other ? "" : i + 1}</td>
                <td className={`py-2 pr-3 ${other ? "text-ink-muted italic" : "text-ink"}`}>{label(t.tag, minBucketSize)}</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-cream-deep overflow-hidden">
                      <div className="h-full rounded-full bg-ink/80" style={{ width: `${(t.interactions / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-ink-soft tabular-nums w-12 text-right">{fmtNumber(t.interactions)}</span>
                  </div>
                </td>
                <td className="py-2 text-right text-ink-soft tabular-nums">{fmtNumber(t.users)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[11px] text-ink-muted mt-2">
        Interactions are weighted: a save counts 2, a view counts 1. People in the "other" row are summed across small tags,
        so someone can be counted more than once.
      </p>
    </div>
  );
}

export function VectorBars({ vectors, minBucketSize }: { vectors: InsightVectors | null; minBucketSize: number }) {
  if (!vectors) {
    return <p className="text-sm text-ink-muted">Not shown for groups of fewer than {minBucketSize} people.</p>;
  }
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
      {(Object.keys(VECTOR_LABELS) as (keyof InsightVectors)[]).map(k => {
        const v = Math.max(0, Math.min(100, vectors[k] ?? 0));
        return (
          <li key={k}>
            <div className="flex justify-between text-sm">
              <span className="text-ink">{VECTOR_LABELS[k]}</span>
              <span className="text-xs text-ink-soft tabular-nums">{v.toFixed(1)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-cream-deep overflow-hidden">
              <div className="h-full rounded-full bg-ink/80" style={{ width: `${v}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// The full audience object (overall, savers of a wishlist, or clickers of a destination).
export function AudienceView({ audience, minBucketSize, compact }: {
  audience: InsightAudience; minBucketSize: number; compact?: boolean;
}) {
  const answered = "Answers as given in the quiz. Groups under " + minBucketSize + " people are merged into \"other\".";
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Profiles" value={fmtNumber(audience.profileCount)} />
        <StatCard
          label="Completed the quiz"
          value={fmtNumber(audience.onboardedCount)}
          hint={audience.profileCount ? `${Math.round((audience.onboardedCount / audience.profileCount) * 100)}% of profiles` : undefined}
        />
      </div>

      <Panel title="Quiz answers">
        <div className={`grid grid-cols-1 ${compact ? "" : "lg:grid-cols-2"} gap-8`}>
          <BucketBars title="Who they travel with" buckets={audience.whoTheyTravelWith} minBucketSize={minBucketSize} />
          <BucketBars title="Trip type" buckets={audience.tripTypePreference} minBucketSize={minBucketSize} hint="The first interest picked in the quiz." />
          <BucketBars title="Budget" buckets={audience.budgetProfile} minBucketSize={minBucketSize} />
          <BucketBars title="Top priority" buckets={audience.primaryPriority} minBucketSize={minBucketSize} hint="The first priority picked in the quiz." />
        </div>
        <p className="text-[11px] text-ink-muted mt-4">{answered}</p>
      </Panel>

      <Panel title="Traveller profile">
        <div className={`grid grid-cols-1 ${compact ? "" : "lg:grid-cols-2"} gap-8`}>
          <BucketBars title="Traveller type" buckets={audience.primaryTravelerType} minBucketSize={minBucketSize} />
          <BucketBars title="Spending bracket" buckets={audience.incomeBracket} minBucketSize={minBucketSize} />
        </div>
      </Panel>

      <Panel title="Personality scores (average, 0–100)">
        <VectorBars vectors={audience.averageVectors} minBucketSize={minBucketSize} />
      </Panel>

      <Panel title="Top tags">
        <TagTable tags={audience.topTags} minBucketSize={minBucketSize} />
      </Panel>
    </div>
  );
}

// ─── Per-item panels ──────────────────────────────────────────────────────────

// "Who saves this wishlist" — for the wishlist template editor.
export function WishlistAudiencePanel({ wishlistId }: { wishlistId: string }) {
  const q = useInsightQuery(() => adminApi.insights.wishlistAudience(wishlistId), [wishlistId]);
  if (q.loading && !q.data) return <LoadingBlock />;
  if (q.error) return <InsightsError error={q.error} onRetry={q.reload} />;
  if (!q.data) return null;
  const d = q.data;
  const min = d.minBucketSize;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Saves (all time)" value={fmtNumber(d.totalGlobalSaveCount)} />
        <StatCard label="People saving it now" value={fmtNumber(d.saverCount)} />
      </div>

      <Panel title="Saves by group">
        {d.segmentCounters ? (
          <>
            <div className="grid grid-cols-1 gap-8">
              <BucketBars title="Travel group" buckets={d.segmentCounters.travelerTypes} minBucketSize={min} />
              <BucketBars title="Budget tier" buckets={d.segmentCounters.budgetTiers} minBucketSize={min} />
              <BucketBars title="Priority" buckets={d.segmentCounters.primaryPriorities} minBucketSize={min} />
              <BucketBars title="Persona cluster" buckets={d.segmentCounters.personaClusters} minBucketSize={min} />
            </div>
            <p className="text-[11px] text-ink-muted mt-4">Last computed {fmtDateTime(d.segmentCounters.lastComputedAt)}.</p>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            No group counts yet. They appear once this wishlist has been saved, or after an insights rebuild.
          </p>
        )}
      </Panel>

      <h3 className="text-lg font-light text-ink">Who the savers are</h3>
      <AudienceView audience={d.savers} minBucketSize={min} compact />
    </div>
  );
}

// "Who viewed this destination" (last N days) — for the destination editor.
export function DestinationAudiencePanel({ destinationId }: { destinationId: string }) {
  const q = useInsightQuery(() => adminApi.insights.destinationAudience(destinationId), [destinationId]);
  if (q.loading && !q.data) return <LoadingBlock />;
  if (q.error) return <InsightsError error={q.error} onRetry={q.reload} />;
  if (!q.data) return null;
  const d = q.data;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-ink-muted">Views in the last {d.windowDays} days.</p>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Views" value={fmtNumber(d.clickCount)} />
        <StatCard label="Unique people" value={fmtNumber(d.uniqueUsers)} />
      </div>
      <AudienceView audience={d.clickers} minBucketSize={d.minBucketSize} compact />
    </div>
  );
}
