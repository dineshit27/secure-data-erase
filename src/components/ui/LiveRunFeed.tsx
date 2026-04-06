import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { fetchRecentRuns, subscribeRunEvents, ToolProgressEvent, ToolRun } from "@/lib/api";

interface LiveRunFeedProps {
  toolId?: string;
}

function relativeTime(iso: string): string {
  const delta = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

const statusStyles: Record<string, string> = {
  success: "text-primary border-primary/20 bg-primary/5",
  error: "text-destructive border-destructive/30 bg-destructive/10",
};

const LiveRunFeed = ({ toolId }: LiveRunFeedProps) => {
  const [runs, setRuns] = useState<ToolRun[]>([]);
  const [progressEvents, setProgressEvents] = useState<ToolProgressEvent[]>([]);

  useEffect(() => {
    let mounted = true;

    fetchRecentRuns({ limit: 20, toolId })
      .then((page) => {
        if (mounted) setRuns(page.items);
      })
      .catch(() => {
        if (mounted) setRuns([]);
      });

    const unsubscribe = subscribeRunEvents({
      onRun: (incoming) => {
        if (toolId && incoming.tool_id !== toolId) return;
        setRuns((prev) => [incoming, ...prev].slice(0, 20));
      },
      onProgress: (incoming) => {
        if (toolId && incoming.tool_id !== toolId) return;
        setProgressEvents((prev) => [incoming, ...prev].slice(0, 20));
      },
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [toolId]);

  const stats = useMemo(() => {
    const success = runs.filter((r) => r.status === "success").length;
    const error = runs.filter((r) => r.status === "error").length;
    return { success, error };
  }, [runs]);

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-widest text-text-ghost">Live Activity</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="w-3 h-3" />{stats.success}</span>
          <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="w-3 h-3" />{stats.error}</span>
        </div>
      </div>

      {runs.length === 0 ? (
        <p className="font-mono text-xs text-text-ghost">No runs recorded yet. Start any tool to see real-time events.</p>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {runs.map((run) => (
            <div
              key={run.id}
              className={`rounded-lg border px-3 py-2 ${statusStyles[run.status] ?? "text-text-secondary border-border bg-surface-2"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-wider">{run.tool_id}</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-text-ghost">
                  <Clock3 className="w-3 h-3" />{relativeTime(run.started_at)}
                </span>
              </div>
              <p className="font-mono text-[11px] truncate mt-1">{run.endpoint}</p>
              <div className="font-mono text-[10px] text-text-ghost mt-1">
                {run.source} {run.duration_ms != null ? `• ${run.duration_ms}ms` : ""}
                {run.error_message ? ` • ${run.error_message}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {progressEvents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-ghost mb-2">Progress Stream</p>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {progressEvents.slice(0, 8).map((evt, idx) => (
              <div key={`${evt.tool_id}-${evt.stage}-${evt.at}-${idx}`} className="rounded border border-border bg-surface-2 px-2 py-1">
                <p className="font-mono text-[10px] text-text-secondary uppercase">
                  {evt.tool_id} • {evt.stage}
                </p>
                <p className="font-mono text-[10px] text-text-ghost truncate">{evt.endpoint}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveRunFeed;
