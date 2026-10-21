import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import {
  adminApi, INCOME_BRACKETS, PROTOTYPES,
  type InsightAudience, type RebuildJob, type SegmentType,
} from "../api";
import { AdminPage, Btn, LoadingBlock, Panel, Pill, Select } from "../ui";
import { useAction, useRawErrorQuery, useToast } from "../hooks";
import { fmtDateTime, fmtNumber } from "../format";
import { AudienceView, InsightsError, TagTable } from "../insightsUi";
import { isApiError } from "../../dataStore/v2Api/client";

const SEGMENT_TYPES: { value: SegmentType; label: string }[] = [
  { value: "travelerType", label: "Travel group" },
  { value: "budget", label: "Budget" },
  { value: "priority", label: "Priority" },
  { value: "prototype", label: "Traveller type" },
  { value: "income", label: "Spending bracket (tags only)" },
];

// Segment values: from the audience's own buckets (raw answers), or fixed
// lists for prototype/income. "other" merges small groups, so it's left out.
function segmentOptions(type: SegmentType, audience: InsightAudience | null): string[] {
  const keys = (list?: { key: string }[]) => (list ?? []).map(b => b.key).filter(k => k.toLowerCase() !== "other");
  switch (type) {
    case "travelerType": return keys(audience?.whoTheyTravelWith);
    case "budget": return keys(audience?.budgetProfile);
    case "priority": return keys(audience?.primaryPriority);
    case "prototype": return [...PROTOTYPES];
    case "income": return [...INCOME_BRACKETS];
  }
}

export default function InsightsPage() {
  const overall = useRawErrorQuery(() => adminApi.insights.audience(), []);
  const data = overall.data;

  return (
    <AdminPage
      title="Audience insights"
      description={
        data
          ? `Who Hodrac's travellers are. Totals only; groups under ${data.minBucketSize} people are merged into "other". Generated ${fmtDateTime(data.generatedAt)}.`
          : "Who Hodrac's travellers are. Totals only; small groups are merged into \"other\"."
      }
      actions={<RebuildControl onFinished={overall.reload} />}
    >
      {overall.loading && !data ? (
        <LoadingBlock />
      ) : overall.error ? (
        <InsightsError error={overall.error} onRetry={overall.reload} />
      ) : data ? (
        <div className="flex flex-col gap-8">
          <SegmentExplorer audience={data.audience} minBucketSize={data.minBucketSize} />
          <div>
            <h2 className="text-xl font-light text-ink mb-4">Everyone</h2>
            <AudienceView audience={data.audience} minBucketSize={data.minBucketSize} />
          </div>
        </div>
      ) : null}
    </AdminPage>
  );
}

// ─── Segment explorer ─────────────────────────────────────────────────────────

function SegmentExplorer({ audience, minBucketSize }: { audience: InsightAudience; minBucketSize: number }) {
  const [params, setParams] = useSearchParams();
  const type = (SEGMENT_TYPES.some(t => t.value === params.get("segmentType")) ? params.get("segmentType") : "travelerType") as SegmentType;
  const options = useMemo(() => segmentOptions(type, audience), [type, audience]);
  const segment = params.get("segment") && options.includes(params.get("segment")!) ? params.get("segment")! : options[0] ?? "";

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  const wishlists = useRawErrorQuery(
    () => (segment && type !== "income" ? adminApi.insights.segmentWishlists(type, segment, 20) : Promise.resolve(null)),
    [type, segment]
  );
  const tags = useRawErrorQuery(
    () => (segment ? adminApi.insights.tags({ segmentType: type, segment }, 20) : Promise.resolve(null)),
    [type, segment]
  );

  return (
    <Panel
      title="Explore a group"
      actions={
        <div className="flex flex-wrap gap-2">
          <Select label="Group by" value={type} onChange={v => set({ segmentType: v, segment: "" })} options={SEGMENT_TYPES} />
          <Select
            label="Group"
            value={segment}
            onChange={v => set({ segment: v })}
            options={options.length ? options.map(o => ({ value: o, label: o })) : [{ value: "", label: "No groups yet" }]}
          />
        </div>
      }
    >
      {!segment ? (
        <p className="text-sm text-ink-muted">No groups with enough people yet.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Top wishlists */}
          <div>
            <h3 className="text-sm font-medium text-ink font-sans mb-3">Most-saved wishlists</h3>
            {type === "income" ? (
              <p className="text-sm text-ink-muted">Wishlist rankings aren't available by spending bracket. Choose another grouping.</p>
            ) : wishlists.loading && !wishlists.data ? (
              <LoadingBlock />
            ) : wishlists.error ? (
              <InsightsError error={wishlists.error} onRetry={wishlists.reload} />
            ) : wishlists.data && wishlists.data.items.length ? (
              <>
                <ol className="divide-y divide-line">
                  {wishlists.data.items.map((w, i) => (
                    <li key={w.wishlistId} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-6 text-ink-muted tabular-nums">{i + 1}</span>
                      <a href={`/wishlists/${w.wishlistId}`} target="_blank" rel="noreferrer" className="flex-1 min-w-0 truncate text-ink hover:underline underline-offset-4">
                        {w.wishlistName}
                      </a>
                      <span className="text-xs text-ink-soft tabular-nums whitespace-nowrap">
                        {fmtNumber(w.segmentSaveCount)} <span className="text-ink-muted">of {fmtNumber(w.totalGlobalSaveCount)} saves</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="text-[11px] text-ink-muted mt-2">
                  Read as group key “{wishlists.data.segmentKey}”.
                  {wishlists.data.suppressedSaveCount > 0 &&
                    ` ${fmtNumber(wishlists.data.suppressedSaveCount)} more saves are on wishlists with fewer than ${minBucketSize} saves from this group, so they aren't listed.`}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                No wishlist has {minBucketSize} or more saves from this group yet
                {wishlists.data?.suppressedSaveCount ? ` (${fmtNumber(wishlists.data.suppressedSaveCount)} saves spread across smaller ones)` : ""}.
              </p>
            )}
          </div>

          {/* Top tags */}
          <div>
            <h3 className="text-sm font-medium text-ink font-sans mb-3">
              Top tags{tags.data ? <span className="text-ink-muted font-normal"> · {fmtNumber(tags.data.profileCount)} people in this group</span> : null}
            </h3>
            {tags.loading && !tags.data ? (
              <LoadingBlock />
            ) : tags.error ? (
              <InsightsError error={tags.error} onRetry={tags.reload} />
            ) : (
              <TagTable tags={tags.data?.tags} minBucketSize={minBucketSize} />
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ─── Rebuild ──────────────────────────────────────────────────────────────────

const JOB_KEY = "hodrac_insights_rebuild_job";
const PHASE_LABELS: Record<string, string> = {
  starting: "Starting",
  ensure_profiles: "Creating missing profiles",
  profiles: "Recalculating profiles",
  wishlist_popularity: "Recalculating wishlist audiences",
  done: "Finishing",
};

// No percentage from the API: derive it from the current phase's counters.
function progressOf(job: RebuildJob): number | null {
  if (job.status !== "running") return 100;
  if (job.phase === "profiles") return job.profilesTotal ? job.profilesProcessed / job.profilesTotal : 0;
  if (job.phase === "wishlist_popularity") return job.wishlistsTotal ? job.wishlistsProcessed / job.wishlistsTotal : 0;
  return null; // starting / ensure_profiles / done: indeterminate
}

function readJobId() {
  try { return sessionStorage.getItem(JOB_KEY); } catch { return null; }
}
function writeJobId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(JOB_KEY, id);
    else sessionStorage.removeItem(JOB_KEY);
  } catch { /* storage unavailable */ }
}

function RebuildControl({ onFinished }: { onFinished: () => void }) {
  const notify = useToast();
  const start = useAction();
  const [jobId, setJobId] = useState<string | null>(readJobId);
  const [job, setJob] = useState<RebuildJob | null>(null);
  const [open, setOpen] = useState(!!readJobId());

  // Poll while running; stop once it isn't.
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const next = await adminApi.insights.rebuildStatus(jobId);
        if (cancelled) return;
        setJob(next);
        if (next.status === "running") {
          timer = setTimeout(tick, 2000);
        } else {
          writeJobId(null);
          if (next.status === "completed") { notify("Insights rebuilt."); onFinished(); }
          else if (next.status === "failed") notify(`Rebuild failed: ${next.error ?? "unknown error"}`, "error");
          else notify("Rebuild was cancelled (the server restarted).", "error");
        }
      } catch (e) {
        if (cancelled) return;
        if (isApiError(e, 404)) {
          // Job state lives in server memory: gone after a restart.
          writeJobId(null);
          setJobId(null);
          setJob(null);
          notify("That rebuild is no longer tracked (the server restarted). Start a new one if needed.", "error");
        } else {
          timer = setTimeout(tick, 5000); // transient: keep trying
        }
      }
    };
    void tick();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [jobId, notify, onFinished]);

  const startRebuild = async () => {
    const res = await start.run(() => adminApi.insights.rebuild(), {
      errors: { 503: "The insights database can't be reached, so a rebuild can't start right now." },
      fallback: "Couldn't start the rebuild.",
    });
    if (!res.ok || !res.result) return;
    const { job: initial, jobId: id, alreadyRunning } = res.result;
    if (!id) {
      notify("Rebuild started, but its progress can't be tracked from here. Refresh this page in a few minutes.");
      return;
    }
    notify(alreadyRunning ? "A rebuild is already running. Showing its progress." : "Rebuild started.");
    writeJobId(id);
    setJob(initial);
    setJobId(id);
    setOpen(true);
  };

  const running = job?.status === "running" || (!!jobId && !job);
  const pct = job ? progressOf(job) : null;

  return (
    <div className="flex flex-col items-end gap-2">
      <Btn variant="outline" loading={start.busy} disabled={running} onClick={startRebuild}
        title="Recalculates every profile and wishlist audience in the background">
        <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
        {running ? "Rebuilding…" : "Rebuild insights"}
      </Btn>

      {open && job && (
        <div className="w-80 max-w-full rounded-xl border border-line bg-white p-4 text-sm shadow-pop">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-ink">{job.status === "running" ? PHASE_LABELS[job.phase] ?? job.phase : "Rebuild"}</span>
            <Pill tone={job.status === "completed" ? "good" : job.status === "running" ? "info" : "bad"}>{job.status}</Pill>
          </div>
          <div className="h-1.5 rounded-full bg-cream-deep overflow-hidden" role="progressbar"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct == null ? undefined : Math.round(pct * 100)}>
            <div
              className={`h-full rounded-full bg-ink/80 ${pct == null ? "w-1/3 animate-pulse" : "transition-all"}`}
              style={pct == null ? undefined : { width: `${Math.round(pct * 100)}%` }}
            />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-soft">
            <dt>Profiles</dt><dd className="text-right tabular-nums">{fmtNumber(job.profilesProcessed)} / {fmtNumber(job.profilesTotal)}</dd>
            <dt>Wishlists</dt><dd className="text-right tabular-nums">{fmtNumber(job.wishlistsProcessed)} / {fmtNumber(job.wishlistsTotal)}</dd>
            {(job.profilesFailed > 0 || job.wishlistsFailed > 0) && (
              <><dt className="text-red-700">Failed</dt><dd className="text-right text-red-700 tabular-nums">{fmtNumber(job.profilesFailed + job.wishlistsFailed)}</dd></>
            )}
            <dt>Started</dt><dd className="text-right">{fmtDateTime(job.startedAt)}</dd>
            {job.finishedAt && (<><dt>Finished</dt><dd className="text-right">{fmtDateTime(job.finishedAt)}</dd></>)}
          </dl>
          {job.error && <p className="mt-2 text-xs text-red-700 wrap-break-word">{job.error}</p>}
          {job.status !== "running" && (
            <button onClick={() => setOpen(false)} className="mt-2 text-xs text-ink-soft hover:text-ink underline underline-offset-4">Dismiss</button>
          )}
        </div>
      )}
    </div>
  );
}
