import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Activity } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { fetchRecentRuns, RunsQuery, subscribeToolRuns, ToolRun } from "@/lib/api";

const TOOL_OPTIONS = [
  { value: "all", label: "All Tools" },
  { value: "file-wiper", label: "File Wiper" },
  { value: "browser-cleaner", label: "Browser Cleaner" },
  { value: "recent-files", label: "Recent Files" },
  { value: "log-scanner", label: "Log Scanner" },
  { value: "secret-scanner", label: "Secret Scanner" },
  { value: "temp-cleaner", label: "Temp Cleaner" },
  { value: "system", label: "System" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

function toCsv(rows: ToolRun[]): string {
  const header = ["id", "tool_id", "source", "endpoint", "status", "started_at", "finished_at", "duration_ms", "error_message"];
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
      return `\"${s.replace(/\"/g, '\"\"')}\"`;
    }
    return s;
  };

  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push([
      row.id,
      row.tool_id,
      row.source,
      row.endpoint,
      row.status,
      row.started_at,
      row.finished_at ?? "",
      row.duration_ms ?? "",
      row.error_message ?? "",
    ].map(escape).join(","));
  }
  return lines.join("\n");
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const RunsHistory = () => {
  const [items, setItems] = useState<ToolRun[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [toolId, setToolId] = useState<string>("all");
  const [source, setSource] = useState<"all" | "backend" | "client">("all");
  const [status, setStatus] = useState<"all" | "success" | "error">("all");
  const [q, setQ] = useState("");

  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const query = useMemo<RunsQuery>(() => {
    return {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      toolId: toolId === "all" ? undefined : toolId,
      source,
      status,
      q,
    };
  }, [pageSize, page, toolId, source, status, q]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await fetchRecentRuns(query);
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [query]);

  useEffect(() => {
    const unsubscribe = subscribeToolRuns((incoming) => {
      const toolMatch = toolId === "all" || incoming.tool_id === toolId;
      const sourceMatch = source === "all" || incoming.source === source;
      const statusMatch = status === "all" || incoming.status === status;
      const qMatch = !q.trim() || `${incoming.tool_id} ${incoming.endpoint} ${incoming.error_message ?? ""}`.toLowerCase().includes(q.toLowerCase());
      if (!(toolMatch && sourceMatch && statusMatch && qMatch)) return;

      if (page === 1) {
        setItems((prev) => [incoming, ...prev].slice(0, pageSize));
      }
      setTotal((prev) => prev + 1);
    });

    return () => unsubscribe();
  }, [toolId, source, status, q, page, pageSize]);

  const exportCurrentJson = () => {
    downloadText(
      `runs-history-page-${page}.json`,
      JSON.stringify(items, null, 2),
      "application/json"
    );
  };

  const exportCurrentCsv = () => {
    downloadText(
      `runs-history-page-${page}.csv`,
      toCsv(items),
      "text/csv;charset=utf-8"
    );
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <Activity className="inline w-5 h-5 text-primary mr-2" />
        Runs / History
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <select
          value={toolId}
          onChange={(e) => {
            setToolId(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 bg-surface border border-border rounded-lg font-mono text-xs text-text-primary"
        >
          {TOOL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value as any);
            setPage(1);
          }}
          className="h-10 px-3 bg-surface border border-border rounded-lg font-mono text-xs text-text-primary"
        >
          <option value="all">All Sources</option>
          <option value="backend">Backend</option>
          <option value="client">Client</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as any);
            setPage(1);
          }}
          className="h-10 px-3 bg-surface border border-border rounded-lg font-mono text-xs text-text-primary"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>

        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search endpoint/error..."
          className="h-10 px-3 bg-surface border border-border rounded-lg font-mono text-xs text-text-primary placeholder:text-text-ghost"
        />

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="h-10 px-3 bg-surface border border-border rounded-lg font-mono text-xs text-text-primary"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <CyberButton variant="secondary" onClick={loadRuns}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </CyberButton>
        <CyberButton variant="secondary" onClick={exportCurrentCsv} disabled={items.length === 0}>
          <Download className="w-4 h-4" /> Export CSV
        </CyberButton>
        <CyberButton variant="secondary" onClick={exportCurrentJson} disabled={items.length === 0}>
          <Download className="w-4 h-4" /> Export JSON
        </CyberButton>
        <span className="font-mono text-xs text-text-ghost ml-auto">
          Total: <span className="text-text-secondary">{total}</span>
        </span>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[70px_120px_90px_95px_1fr_170px_110px] gap-2 px-3 py-2 bg-surface-2 border-b border-border font-mono text-[11px] text-text-ghost uppercase tracking-wider">
          <span>ID</span>
          <span>Tool</span>
          <span>Source</span>
          <span>Status</span>
          <span>Endpoint</span>
          <span>Started</span>
          <span>Duration</span>
        </div>

        {loading ? (
          <div className="p-6 font-mono text-xs text-text-ghost">Loading runs...</div>
        ) : items.length === 0 ? (
          <div className="p-6 font-mono text-xs text-text-ghost">No runs match current filters.</div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[70px_120px_90px_95px_1fr_170px_110px] gap-2 px-3 py-2 border-b border-border/60 font-mono text-xs"
              >
                <span className="text-text-secondary">#{item.id}</span>
                <span className="text-text-primary truncate">{item.tool_id}</span>
                <span className="text-text-ghost uppercase">{item.source}</span>
                <span className={item.status === "error" ? "text-destructive" : "text-primary"}>{item.status}</span>
                <span className="text-text-secondary truncate" title={item.endpoint}>{item.endpoint}</span>
                <span className="text-text-ghost">{formatDate(item.started_at)}</span>
                <span className="text-text-ghost">{item.duration_ms ?? 0}ms</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="font-mono text-xs text-text-ghost">Page {page} / {totalPages}</span>
        <div className="flex items-center gap-2">
          <CyberButton
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </CyberButton>
          <CyberButton
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </CyberButton>
        </div>
      </div>
    </div>
  );
};

export default RunsHistory;
