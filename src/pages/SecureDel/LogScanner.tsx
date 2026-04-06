import { useState, useCallback } from "react";
import { FileText, AlertTriangle, CheckCircle2, Download, Server } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { apiPost, apiGet, logClientRun, subscribeRunEvents, ToolProgressEvent } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────
interface Finding {
  line: number;
  content: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  match: string;
}

interface FileFindings {
  filename: string;
  items: Finding[];
  lines: number;
  sizeKB: number;
}

// ── Client-side patterns (browser scan) ──────────────────────────
const PATTERNS: Array<{ type: string; severity: Finding["severity"]; regex: RegExp }> = [
  { type: "Password", severity: "CRITICAL", regex: /(?:password|passwd|pwd|pass)\s*[=:]\s*['"]?([^\s'"]{4,})/gi },
  { type: "API Key", severity: "CRITICAL", regex: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]?([A-Za-z0-9\-_]{16,})/gi },
  { type: "AWS Access Key", severity: "CRITICAL", regex: /AKIA[0-9A-Z]{16}/g },
  { type: "AWS Secret Key", severity: "CRITICAL", regex: /(?:aws[_-]?secret|secret[_-]?key)\s*[=:]\s*['"]?([A-Za-z0-9/+]{40})/gi },
  { type: "OpenAI Key", severity: "CRITICAL", regex: /sk-[A-Za-z0-9]{20,}/g },
  { type: "GitHub Token", severity: "CRITICAL", regex: /ghp_[A-Za-z0-9]{36}/g },
  { type: "JWT Token", severity: "HIGH", regex: /eyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_.+/=]*/g },
  { type: "Bearer Token", severity: "HIGH", regex: /Bearer\s+([A-Za-z0-9\-_.+/=]{20,})/gi },
  { type: "Private Key", severity: "CRITICAL", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { type: "Database URL", severity: "CRITICAL", regex: /(?:postgres|mysql|mongodb|redis):\/\/[^:\s]+:[^@\s]+@[^\s]+/gi },
  { type: "Email Address", severity: "MEDIUM", regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g },
  { type: "IPv4 Address", severity: "MEDIUM", regex: /\b(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g },
  { type: "Credit Card", severity: "CRITICAL", regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g },
  { type: "Social Security", severity: "CRITICAL", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "Secret", severity: "HIGH", regex: /(?:secret|token|auth|credential)\s*[=:]\s*['"]?([A-Za-z0-9\-_]{12,})/gi },
];

// ── Helpers ───────────────────────────────────────────────────────
function redactMatch(line: string, match: string): string {
  const visibleChars = Math.min(6, Math.floor(match.length / 3));
  const redacted = match.slice(0, visibleChars) + "█".repeat(Math.max(4, match.length - visibleChars));
  return line.replace(match, redacted);
}

function scanText(text: string, filename: string): FileFindings {
  const lines = text.split("\n");
  const findings: Finding[] = [];
  lines.forEach((lineText, lineIdx) => {
    for (const pattern of PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let m: RegExpExecArray | null;
      while ((m = regex.exec(lineText)) !== null) {
        const match = m[0];
        const alreadyFound = findings.some(
          (f) => f.line === lineIdx + 1 && f.type === pattern.type && f.match === match
        );
        if (!alreadyFound) {
          findings.push({
            line: lineIdx + 1,
            content: redactMatch(lineText.trim().slice(0, 120), match),
            type: pattern.type,
            severity: pattern.severity,
            match,
          });
        }
      }
    }
  });
  return { filename, items: findings, lines: lines.length, sizeKB: Math.round(text.length / 1024) };
}

const severityColor = {
  CRITICAL: "text-destructive bg-destructive/10 border-destructive/30",
  HIGH: "text-warning bg-warning/10 border-warning/30",
  MEDIUM: "text-text-secondary bg-surface-2 border-border",
};

// ── Component ─────────────────────────────────────────────────────
const LogScanner = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [results, setResults] = useState<FileFindings[]>([]);

  // Backend state
  const [backendEnabled, setBackendEnabled] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const [backendAction, setBackendAction] = useState<"redact" | "delete">("redact");
  const [backendRunning, setBackendRunning] = useState(false);
  const [backendResult, setBackendResult] = useState<any>(null);
  const [availablePatterns, setAvailablePatterns] = useState<string[]>([]);

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    setFiles((prev) => [...prev, ...Array.from(incoming)]);
    setScanned(false);
    setResults([]);
  }, []);

  // ── Load backend patterns when backend toggle is turned on ──
  const handleBackendToggle = async () => {
    const next = !backendEnabled;
    setBackendEnabled(next);
    if (next && availablePatterns.length === 0) {
      try {
        const data = await apiGet("/api/logs/patterns");
        setAvailablePatterns(data?.patterns ?? []);
      } catch {
        // backend not running yet — silently ignore
      }
    }
  };

  // ── Browser-side scan ─────────────────────────────────────────
  const scan = async () => {
    setScanning(true);
    setScanLog([]);
    setResults([]);
    setBackendResult(null);
    const addLog = (msg: string) => setScanLog((p) => [...p, msg]);
    const ts = () => new Date().toISOString().slice(11, 19);

    addLog(`> [${ts()}] SecureDel Log Scanner — real-time analysis`);
    addLog(`> [${ts()}] Files queued: ${files.length}`);
    addLog(`> [${ts()}] Patterns loaded: ${PATTERNS.length}`);

    const allResults: FileFindings[] = [];

    for (const file of files) {
      addLog(`> [${ts()}] Reading: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      const text = await file.text();
      addLog(`> [${ts()}] Lines: ${text.split("\n").length} — scanning patterns...`);
      const result = scanText(text, file.name);
      allResults.push(result);
      const critical = result.items.filter((i) => i.severity === "CRITICAL").length;
      const high = result.items.filter((i) => i.severity === "HIGH").length;
      const medium = result.items.filter((i) => i.severity === "MEDIUM").length;
      if (result.items.length === 0) {
        addLog(`> [${ts()}] ✓ ${file.name} — no sensitive data detected`);
      } else {
        addLog(`> [${ts()}] ⚠ ${file.name} — ${result.items.length} matches (CRITICAL:${critical} HIGH:${high} MEDIUM:${medium})`);
      }
    }

    const total = allResults.reduce((s, r) => s + r.items.length, 0);
    addLog(`> [${ts()}] ══ Scan complete ══`);
    addLog(`> [${ts()}] Total findings: ${total} across ${files.length} file(s)`);

    logClientRun({
      toolId: "log-scanner",
      action: "browser_log_scan",
      status: "success",
      details: {
        files: files.length,
        findings: total,
      },
    });

    setResults(allResults);
    setScanning(false);
    setScanned(true);
  };

  // ── Backend scan + redact/delete via FastAPI ──────────────────
  const runBackendScan = async () => {
    if (!folderPath.trim()) return;
    setBackendRunning(true);
    setBackendResult(null);
    const requestId = crypto.randomUUID();

    const appendProgress = (progress: ToolProgressEvent) => {
      if (progress.tool_id !== "log-scanner") return;
      if (progress.request_id !== requestId) return;
      const d = progress.details as Record<string, any>;
      setScanLog((p) => [...p, `[backend:${progress.stage}] ${d.path ?? d.files_scanned ?? d.action ?? ""}`]);
    };

    const unsubscribe = subscribeRunEvents({ onProgress: appendProgress });

    try {
      // Step 1: scan
      const scanData = await apiPost("/api/logs/scan", {
        paths: [folderPath.trim()],
        recursive: true,
        patterns: ["password", "api_key", "jwt", "bearer_token",
          "aws_access_key", "github_token", "private_key",
          "db_connection", "credit_card", "ssn"],
        request_id: requestId,
      });

      // Step 2: redact or delete flagged files
      const redactData = await apiPost("/api/logs/redact", {
        paths: [folderPath.trim()],
        action: backendAction,
        passes: 3,
        request_id: requestId,
      });

      setBackendResult({ scan: scanData, redact: redactData });
    } catch (err: any) {
      setBackendResult({ error: err?.message ?? "Backend unreachable. Is it running on localhost:8000?" });
    } finally {
      unsubscribe();
      setBackendRunning(false);
    }
  };

  // ── Export report ─────────────────────────────────────────────
  const exportReport = () => {
    const lines: string[] = ["SecureDel Log Scanner — Findings Report", `Generated: ${new Date().toISOString()}`, ""];
    for (const r of results) {
      lines.push(`FILE: ${r.filename} (${r.lines} lines, ${r.sizeKB} KB)`);
      if (r.items.length === 0) {
        lines.push("  No findings.");
      } else {
        for (const item of r.items) {
          lines.push(`  [${item.severity}] Line ${item.line}: [${item.type}] ${item.content}`);
        }
      }
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "secureddel-scan-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalFindings = results.reduce((s, r) => s + r.items.length, 0);
  const criticalCount = results.reduce((s, r) => s + r.items.filter((i) => i.severity === "CRITICAL").length, 0);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <FileText className="inline w-5 h-5 text-primary mr-2" />
        Sensitive Log Detector
      </h2>

      {/* ── Browser-side upload & scan ── */}
      {!scanned && !scanning && (
        <div className="space-y-6">
          <div
            className="border-2 border-dashed border-primary/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById("log-input")?.click()}
            data-interactive
          >
            <FileText className="w-8 h-8 text-primary/50 mx-auto mb-3" />
            <p className="font-mono text-sm text-text-secondary">Drop log files or click to browse</p>
            <p className="font-mono text-xs text-text-ghost mt-1">Supported: .log, .txt, .json, .env, any text</p>
            <input
              id="log-input"
              type="file"
              accept=".log,.txt,.json,.env,.csv,.yaml,.yml,.conf,.cfg,.ini,.sh,.bash,.zsh,.py,.js,.ts,.jsx,.tsx"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-border">
                  <span className="font-mono text-sm text-text-primary">{f.name}</span>
                  <span className="font-mono text-xs text-text-ghost">{(f.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          )}

          <CyberButton onClick={scan} disabled={files.length === 0}>
            Scan for Sensitive Data
          </CyberButton>

          {/* ── Backend OS-level section ── */}
          <div className="p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-text-ghost uppercase tracking-widest flex items-center gap-2">
                <Server className="w-3.5 h-3.5" />
                // Backend Folder Scan & Redact
              </span>
              <button
                onClick={handleBackendToggle}
                className={`relative w-10 h-5 rounded-full transition-colors ${backendEnabled ? "bg-primary" : "bg-surface-2 border border-border"}`}
                data-interactive
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${backendEnabled ? "left-5" : "left-0.5"}`} />
              </button>
            </div>

            {backendEnabled && (
              <div className="space-y-3">
                <p className="font-mono text-xs text-text-ghost">
                  Enter a folder path on your machine. The backend will scan all log files inside and redact or delete sensitive entries.
                </p>

                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="e.g. C:\Users\dinesh\logs  or  /var/log/myapp"
                  className="w-full h-10 px-3 bg-surface-2 border border-border rounded-lg font-mono text-xs text-text-primary focus:border-primary/40 outline-none placeholder:text-text-ghost"
                />

                {/* Action selector */}
                <div className="flex gap-2">
                  {(["redact", "delete"] as const).map((act) => (
                    <button
                      key={act}
                      onClick={() => setBackendAction(act)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-all ${backendAction === act
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-surface text-text-ghost hover:border-border/60"
                        }`}
                      data-interactive
                    >
                      {act === "redact" ? "Redact in-place" : "Securely delete"}
                    </button>
                  ))}
                </div>

                {availablePatterns.length > 0 && (
                  <p className="font-mono text-xs text-text-ghost">
                    Backend patterns available: {availablePatterns.slice(0, 6).join(", ")}
                    {availablePatterns.length > 6 ? ` +${availablePatterns.length - 6} more` : ""}
                  </p>
                )}

                <p className="font-mono text-xs text-destructive">
                  ⚠ Requires backend running at localhost:8000.
                  {backendAction === "delete" ? " DELETION IS PERMANENT." : ""}
                </p>

                <CyberButton
                  variant="danger"
                  onClick={runBackendScan}
                  disabled={!folderPath.trim() || backendRunning}
                >
                  {backendRunning ? "Running..." : `Scan & ${backendAction === "redact" ? "Redact" : "Delete"} via Backend`}
                </CyberButton>

                {/* Backend result */}
                {backendResult && (
                  <div className="mt-3 p-3 rounded-lg bg-surface-2 border border-border">
                    {backendResult.error ? (
                      <p className="font-mono text-xs text-destructive">✗ {backendResult.error}</p>
                    ) : (
                      <div className="font-mono text-xs space-y-1">
                        <p className="text-primary">✓ Backend scan + {backendAction} complete</p>
                        <p className="text-text-secondary">
                          Files scanned: {backendResult.scan?.files_scanned ?? "—"} &nbsp;|&nbsp;
                          Flagged: {backendResult.scan?.files_with_secrets ?? "—"} &nbsp;|&nbsp;
                          Matches: {backendResult.scan?.total_matches ?? "—"}
                        </p>
                        <p className="text-text-secondary">
                          {backendAction === "redact"
                            ? `Redacted: ${backendResult.redact?.succeeded ?? "—"} file(s)`
                            : `Deleted: ${backendResult.redact?.succeeded ?? "—"} file(s)`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Scanning terminal ── */}
      {scanning && (
        <TerminalWindow title="scanning">
          {scanLog.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-primary" : l.includes("⚠") ? "text-warning" : ""}>{l}</p>
          ))}
          <span className="animate-blink text-primary">▌</span>
        </TerminalWindow>
      )}

      {/* ── Results ── */}
      {scanned && (
        <div>
          {totalFindings === 0 ? (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-mono text-sm text-primary">No sensitive data detected in {files.length} file(s)</span>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="font-mono text-sm text-destructive">
                {totalFindings} SENSITIVE MATCHES — {criticalCount} CRITICAL — in {results.length} file(s)
              </span>
            </div>
          )}

          {results.map((r, ri) => (
            <div key={ri} className="mb-6">
              <h3 className="font-mono text-sm text-text-primary mb-1">
                📄 {r.filename} — {r.items.length} match(es) — {r.lines} lines
              </h3>
              {r.items.length === 0 ? (
                <p className="font-mono text-xs text-primary px-3 py-2">✓ Clean — no findings</p>
              ) : (
                <div className="space-y-2">
                  {r.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-border">
                      <span className="font-mono text-xs text-text-ghost min-w-[60px]">L{item.line}</span>
                      <span className="font-mono text-xs text-text-secondary flex-1 break-all">{item.content}</span>
                      <span className="font-mono text-[10px] text-text-ghost bg-surface-2 px-1.5 py-0.5 rounded whitespace-nowrap">{item.type}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap ${severityColor[item.severity]}`}>
                        {item.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-3 mt-6 flex-wrap">
            <CyberButton variant="secondary" onClick={exportReport}>
              <Download className="w-4 h-4 mr-2 inline" />
              Export Report
            </CyberButton>
            <CyberButton variant="secondary" onClick={() => { setScanned(false); setFiles([]); setResults([]); setScanLog([]); setBackendResult(null); }}>
              Scan New Files
            </CyberButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogScanner;