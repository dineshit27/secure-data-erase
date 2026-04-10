import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ChartNoAxesCombined,
  Clock3,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { fetchRecentRuns, subscribeRunEvents, ToolRun } from "@/lib/api";

const TOOL_CATALOG = [
  {
    id: "file-wiper",
    label: "File Wiper",
    route: "/app/file-wiper",
    description: "Securely removes sensitive files using overwrite passes.",
    core: true,
  },
  {
    id: "browser-cleaner",
    label: "Browser Cleaner",
    route: "/app/browser-cleaner",
    description: "Clears cookies, cache, and privacy traces from browsers.",
    core: false,
  },
  {
    id: "recent-files",
    label: "Recent Files",
    route: "/app/recent-files",
    description: "Removes recently accessed file trails and document history.",
    core: true,
  },
  {
    id: "log-scanner",
    label: "Log Scanner",
    route: "/app/log-scanner",
    description: "Finds sensitive values inside app and system logs.",
    core: true,
  },
  {
    id: "secret-scanner",
    label: "Secret Scanner",
    route: "/app/secret-scanner",
    description: "Detects leaked credentials, keys, and tokens.",
    core: true,
  },
  {
    id: "temp-cleaner",
    label: "Temp Cleaner",
    route: "/app/temp-cleaner",
    description: "Cleans temporary locations where private data lingers.",
    core: false,
  },
] as const;

type RangeOption = {
  id: string;
  label: string;
  hours: number;
};

const RANGE_OPTIONS: RangeOption[] = [
  { id: "24h", label: "Last 24h", hours: 24 },
  { id: "7d", label: "Last 7d", hours: 24 * 7 },
  { id: "30d", label: "Last 30d", hours: 24 * 30 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRelativeTime(iso: string): string {
  const delta = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

function getAgeHours(iso?: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function scoreTone(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Stable";
  if (score >= 40) return "Warning";
  return "Critical";
}

function scoreToneClass(score: number): string {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-destructive";
}

function scoreRingClass(score: number): string {
  if (score >= 80) return "stroke-primary";
  if (score >= 60) return "stroke-amber-400";
  if (score >= 40) return "stroke-orange-400";
  return "stroke-destructive";
}

interface PrivacyHealthDashboardProps {
  heading?: string;
  subtitle?: string;
}

const PrivacyHealthDashboard = ({
  heading = "Privacy Health Dashboard",
  subtitle = "Live privacy telemetry for your device hygiene posture.",
}: PrivacyHealthDashboardProps) => {
  const [runs, setRuns] = useState<ToolRun[]>([]);
  const [windowHours, setWindowHours] = useState<number>(24 * 7);
  const [activeToolId, setActiveToolId] = useState<string>("all");
  const [refreshTick, setRefreshTick] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    fetchRecentRuns({ limit: 180 })
      .then((page) => {
        if (mounted) setRuns(page.items);
      })
      .catch(() => {
        if (mounted) setRuns([]);
      });

    const unsubscribe = subscribeRunEvents({
      onRun: (incoming) => {
        setRuns((prev) => {
          const deduped = prev.filter((item) => item.id !== incoming.id);
          return [incoming, ...deduped].slice(0, 220);
        });
      },
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRefreshTick((prev) => prev + 1);
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const metrics = useMemo(() => {
    void refreshTick;

    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    const scopedRuns = runs.filter((run) => new Date(run.started_at).getTime() >= cutoff);
    const scopedToolRuns = scopedRuns.filter((run) => TOOL_CATALOG.some((tool) => tool.id === run.tool_id));

    const byTool = TOOL_CATALOG.map((tool) => {
      const toolRuns = scopedToolRuns.filter((run) => run.tool_id === tool.id);
      const lastSuccess = toolRuns.find((run) => run.status === "success")?.started_at;
      const lastRun = toolRuns[0]?.started_at;
      const successCount = toolRuns.filter((run) => run.status === "success").length;
      const errorCount = toolRuns.filter((run) => run.status === "error").length;
      return {
        ...tool,
        runCount: toolRuns.length,
        successCount,
        errorCount,
        lastSuccess,
        lastRun,
      };
    });

    const usedTools = byTool.filter((tool) => tool.runCount > 0).length;
    const staleTools = byTool.filter((tool) => getAgeHours(tool.lastSuccess) > 48);
    const pendingTools = byTool.filter((tool) => !tool.lastSuccess || getAgeHours(tool.lastSuccess) > windowHours / 2);

    const totalErrors = scopedToolRuns.filter((run) => run.status === "error").length;
    const totalSuccess = scopedToolRuns.filter((run) => run.status === "success").length;

    const coreMissed = byTool.filter((tool) => tool.core && (!tool.lastSuccess || getAgeHours(tool.lastSuccess) > 48)).length;
    const nonCoreMissed = byTool.filter((tool) => !tool.core && (!tool.lastSuccess || getAgeHours(tool.lastSuccess) > 72)).length;

    const penalties =
      coreMissed * 12 +
      nonCoreMissed * 6 +
      Math.min(totalErrors * 5, 22) +
      (TOOL_CATALOG.length - usedTools) * 3 +
      Math.min(staleTools.length * 4, 16);

    const privacyScore = clamp(Math.round(100 - penalties), 0, 100);

    const risks = [
      {
        id: "stale",
        label: "Stale Hygiene",
        severity: staleTools.length >= 3 ? "high" : staleTools.length > 0 ? "medium" : "low",
        count: staleTools.length,
        detail:
          staleTools.length > 0
            ? `${staleTools.length} tool${staleTools.length > 1 ? "s" : ""} not cleaned in 48h+.`
            : "All tracked tools were used recently.",
      },
      {
        id: "errors",
        label: "Failed Cleanup Runs",
        severity: totalErrors >= 4 ? "high" : totalErrors > 0 ? "medium" : "low",
        count: totalErrors,
        detail:
          totalErrors > 0
            ? `${totalErrors} run${totalErrors > 1 ? "s" : ""} failed and may have left traces behind.`
            : "No failed runs in the selected period.",
      },
      {
        id: "coverage",
        label: "Coverage Gaps",
        severity: pendingTools.length >= 4 ? "high" : pendingTools.length > 1 ? "medium" : "low",
        count: pendingTools.length,
        detail:
          pendingTools.length > 0
            ? `${pendingTools.length} module${pendingTools.length > 1 ? "s" : ""} still need cleanup attention.`
            : "Coverage is complete for all cleanup modules.",
      },
    ];

    return {
      scopedRuns,
      scopedToolRuns,
      byTool,
      staleTools,
      pendingTools,
      usedTools,
      totalErrors,
      totalSuccess,
      privacyScore,
      risks,
    };
  }, [runs, windowHours, refreshTick]);

  const filteredTimeline = useMemo(() => {
    const candidates = metrics.scopedToolRuns.filter((run) => activeToolId === "all" || run.tool_id === activeToolId);
    return candidates.slice(0, 20);
  }, [metrics.scopedToolRuns, activeToolId]);

  const circumference = 2 * Math.PI * 44;
  const progressOffset = circumference * (1 - metrics.privacyScore / 100);

  return (
    <div className="rounded-2xl border border-primary/15 bg-surface/95 p-5 sm:p-6 shadow-[0_0_40px_hsl(157_100%_50%/0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-mono text-[11px] tracking-[3px] uppercase text-primary">Privacy Health Dashboard</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-text-primary uppercase tracking-wide">{heading}</h3>
          <p className="font-mono text-xs sm:text-sm text-text-secondary mt-1">{subtitle}</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-primary">Real-time</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        <div className="xl:col-span-4 rounded-xl border border-border bg-surface-2 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[11px] uppercase tracking-widest text-text-ghost">Overall Score</span>
            <span className={`font-mono text-xs uppercase tracking-wider ${scoreToneClass(metrics.privacyScore)}`}>
              {scoreTone(metrics.privacyScore)}
            </span>
          </div>

          <div className="relative w-36 h-36 mx-auto">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="44" className="stroke-border" strokeWidth="10" fill="none" />
              <motion.circle
                cx="60"
                cy="60"
                r="44"
                className={scoreRingClass(metrics.privacyScore)}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: progressOffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-4xl font-extrabold text-text-primary">{metrics.privacyScore}</span>
              <span className="font-mono text-[11px] text-text-ghost uppercase tracking-wider">out of 100</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5">
            <div className="rounded-lg border border-border bg-surface px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-ghost">Successful Runs</p>
              <p className="font-display text-xl font-bold text-primary mt-1">{metrics.totalSuccess}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-ghost">Failed Runs</p>
              <p className="font-display text-xl font-bold text-destructive mt-1">{metrics.totalErrors}</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 space-y-4">
          <div className="rounded-xl border border-border bg-surface-2 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="font-mono text-[11px] uppercase tracking-widest text-text-ghost">Risk Radar</span>
              <div className="inline-flex rounded-lg border border-border bg-surface p-1">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setWindowHours(option.hours)}
                    className={`px-2.5 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-wider transition-colors ${
                      windowHours === option.hours ? "bg-primary/20 text-primary" : "text-text-ghost hover:text-text-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {metrics.risks.map((risk) => {
                const accent =
                  risk.severity === "high"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : risk.severity === "medium"
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                    : "border-primary/30 bg-primary/10 text-primary";

                return (
                  <div key={risk.id} className="rounded-lg border border-border bg-surface p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-display text-sm font-semibold text-text-primary">{risk.label}</p>
                      <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${accent}`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="font-display text-2xl font-extrabold text-text-primary mb-1">{risk.count}</p>
                    <p className="font-mono text-[11px] text-text-secondary leading-relaxed">{risk.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface-2 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-2">
                  <ChartNoAxesCombined className="w-4 h-4 text-primary" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-text-ghost">Tool Coverage</span>
                </div>
                <span className="font-mono text-xs text-text-secondary">
                  {metrics.usedTools}/{TOOL_CATALOG.length} used
                </span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {metrics.byTool.map((tool) => {
                  const activity = clamp(tool.runCount * 20, 0, 100);
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveToolId(tool.id)}
                      className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                        activeToolId === tool.id
                          ? "border-primary/40 bg-primary/10"
                          : "border-border bg-surface hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-display text-sm font-semibold text-text-primary">{tool.label}</p>
                        <p className="font-mono text-[11px] text-text-ghost">{tool.runCount} run{tool.runCount === 1 ? "" : "s"}</p>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${activity}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[10px] text-text-ghost">
                        <span>{tool.errorCount > 0 ? `${tool.errorCount} failed` : "No failures"}</span>
                        <span>{tool.lastRun ? getRelativeTime(tool.lastRun) : "Never"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setActiveToolId("all")}
                className={`mt-3 w-full rounded-lg border px-3 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                  activeToolId === "all"
                    ? "border-primary/40 text-primary bg-primary/10"
                    : "border-border text-text-ghost hover:text-text-primary"
                }`}
              >
                Show all tool activity
              </button>
            </div>

            <div className="rounded-xl border border-border bg-surface-2 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-text-ghost">Live Timeline</span>
                </div>
                <span className="font-mono text-[11px] text-text-ghost">
                  {activeToolId === "all" ? "All modules" : TOOL_CATALOG.find((tool) => tool.id === activeToolId)?.label}
                </span>
              </div>

              {filteredTimeline.length === 0 ? (
                <p className="font-mono text-xs text-text-ghost">No activity in this range yet. Run a tool to populate real-time events.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredTimeline.map((run) => {
                    const statusClass =
                      run.status === "success"
                        ? "border-primary/30 bg-primary/10"
                        : run.status === "error"
                        ? "border-destructive/40 bg-destructive/10"
                        : "border-border bg-surface";

                    return (
                      <div key={`${run.id}-${run.started_at}`} className={`rounded-lg border px-3 py-2 ${statusClass}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-[11px] uppercase tracking-wider text-text-primary">{run.tool_id}</p>
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-text-ghost">
                            <Clock3 className="w-3 h-3" />
                            {getRelativeTime(run.started_at)}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-text-secondary truncate mt-1">{run.endpoint}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-2 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-text-ghost">What Needs Cleaning</span>
              </div>
              {metrics.pendingTools.length === 0 ? (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-primary uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Fully Covered
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-destructive uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {metrics.pendingTools.length} Pending
                </span>
              )}
            </div>

            {metrics.pendingTools.length === 0 ? (
              <p className="font-mono text-xs text-text-secondary">All privacy modules have been run recently. Keep this cadence to maintain a healthy score.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metrics.pendingTools.map((tool) => (
                  <div key={tool.id} className="rounded-lg border border-border bg-surface p-3">
                    <p className="font-display text-sm font-semibold text-text-primary">{tool.label}</p>
                    <p className="font-mono text-[11px] text-text-secondary mt-1 leading-relaxed">{tool.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-text-ghost">
                        {tool.lastSuccess ? `Last success ${getRelativeTime(tool.lastSuccess)}` : "No successful run yet"}
                      </span>
                      <Link
                        to={tool.route}
                        className="rounded border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
                      >
                        Clean now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyHealthDashboard;
