import { useState } from "react";
import { Key, AlertTriangle, FolderOpen, CheckCircle2, Download, X, Server, GitBranch } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { apiPost, apiGet, logClientRun, subscribeRunEvents, ToolProgressEvent, API_BASE } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────
interface SecretFinding {
  file: string;
  line: number;
  type: string;
  value: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  context: string;
}

// ── Client-side patterns (browser scan) ──────────────────────────
const SECRET_PATTERNS: Array<{
  type: string;
  confidence: SecretFinding["confidence"];
  regex: RegExp;
}> = [
    { type: "AWS Access Key", confidence: "HIGH", regex: /\bAKIA[0-9A-Z]{16}\b/g },
    { type: "AWS Secret Key", confidence: "HIGH", regex: /(?:aws[_-]?secret|secret[_-]?access[_-]?key)\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})/gi },
    { type: "OpenAI API Key", confidence: "HIGH", regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
    { type: "Anthropic API Key", confidence: "HIGH", regex: /\bsk-ant-[A-Za-z0-9\-_]{20,}\b/g },
    { type: "GitHub Token", confidence: "HIGH", regex: /\bghp_[A-Za-z0-9]{36}\b/g },
    { type: "GitHub OAuth", confidence: "HIGH", regex: /\bgho_[A-Za-z0-9]{36}\b/g },
    { type: "Stripe Secret Key", confidence: "HIGH", regex: /\bsk_live_[A-Za-z0-9]{24,}\b/g },
    { type: "Stripe Test Key", confidence: "MEDIUM", regex: /\bsk_test_[A-Za-z0-9]{24,}\b/g },
    { type: "Twilio SID", confidence: "HIGH", regex: /\bAC[a-z0-9]{32}\b/g },
    { type: "SendGrid Key", confidence: "HIGH", regex: /\bSG\.[A-Za-z0-9\-_]{22,}\.[A-Za-z0-9\-_]{43,}\b/g },
    { type: "Private RSA Key", confidence: "HIGH", regex: /-----BEGIN RSA PRIVATE KEY-----/g },
    { type: "Private EC Key", confidence: "HIGH", regex: /-----BEGIN EC PRIVATE KEY-----/g },
    { type: "Private Key (generic)", confidence: "HIGH", regex: /-----BEGIN PRIVATE KEY-----/g },
    { type: "OpenSSH Private Key", confidence: "HIGH", regex: /-----BEGIN OPENSSH PRIVATE KEY-----/g },
    { type: "Database URL", confidence: "HIGH", regex: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s"'`]+:[^@\s"'`]+@[^\s"'`]+/gi },
    { type: "Database Password", confidence: "HIGH", regex: /(?:DB_PASS|DATABASE_PASSWORD|MYSQL_PASSWORD|POSTGRES_PASSWORD)\s*[=:]\s*['"]?([^\s'"]{6,})/gi },
    { type: "Hardcoded Password", confidence: "HIGH", regex: /(?:password|passwd)\s*=\s*['"]([^'"]{6,})['"]/gi },
    { type: "Generic Secret", confidence: "MEDIUM", regex: /(?:SECRET|TOKEN|PRIVATE_KEY|CLIENT_SECRET)\s*[=:]\s*['"]([A-Za-z0-9\-_=+/]{16,})['"]/gi },
    { type: "Generic API Key", confidence: "MEDIUM", regex: /(?:API_KEY|APIKEY|ACCESS_KEY)\s*[=:]\s*['"]([A-Za-z0-9\-_]{16,})['"]/gi },
    { type: "JWT Token", confidence: "MEDIUM", regex: /eyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_.+/=]{10,}/g },
    { type: "Basic Auth (URL)", confidence: "HIGH", regex: /https?:\/\/[^:\s"'`]+:[^@\s"'`]{4,}@/gi },
  ];

const TEXT_EXTENSIONS = new Set([
  "js", "ts", "jsx", "tsx", "mjs", "cjs",
  "py", "rb", "go", "java", "php", "cs", "cpp", "c", "h", "rs",
  "sh", "bash", "zsh", "fish",
  "env", "cfg", "conf", "config", "ini", "toml", "yaml", "yml", "json",
  "tf", "hcl", "dockerfile", "makefile",
  "txt", "md", "log",
]);

// ── Helpers ───────────────────────────────────────────────────────
function isTextFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (name.toLowerCase() === "dockerfile" || name.toLowerCase() === "makefile") return true;
  return TEXT_EXTENSIONS.has(ext);
}

function redact(val: string): string {
  const show = Math.min(6, Math.floor(val.length / 3));
  return val.slice(0, show) + "█".repeat(Math.max(4, val.length - show));
}

function scanFileText(text: string, filename: string): SecretFinding[] {
  const lines = text.split("\n");
  const findings: SecretFinding[] = [];
  lines.forEach((lineText, lineIdx) => {
    for (const pattern of SECRET_PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let m: RegExpExecArray | null;
      while ((m = regex.exec(lineText)) !== null) {
        const rawMatch = m[1] || m[0];
        const duplicate = findings.some(
          (f) => f.file === filename && f.line === lineIdx + 1 && f.type === pattern.type
        );
        if (!duplicate) {
          findings.push({
            file: filename,
            line: lineIdx + 1,
            type: pattern.type,
            value: redact(rawMatch),
            confidence: pattern.confidence,
            context: lineText.trim().slice(0, 100),
          });
        }
      }
    }
  });
  return findings;
}

// ── Component ─────────────────────────────────────────────────────
const SecretScanner = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [findings, setFindings] = useState<SecretFinding[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Backend state
  const [backendEnabled, setBackendEnabled] = useState(false);
  const [repoPath, setRepoPath] = useState("");
  const [remediateAction, setRemediateAction] = useState<"redact" | "flag">("redact");
  const [installHook, setInstallHook] = useState(false);
  const [backendRunning, setBackendRunning] = useState(false);
  const [backendResult, setBackendResult] = useState<any>(null);
  const [availablePatterns, setAvailablePatterns] = useState<Record<string, any>>({});

  // ── Load backend patterns when toggle is turned on ──
  const handleBackendToggle = async () => {
    const next = !backendEnabled;
    setBackendEnabled(next);
    if (next && Object.keys(availablePatterns).length === 0) {
      try {
        const data = await apiGet("/api/secrets/patterns");
        setAvailablePatterns(data?.patterns ?? {});
      } catch {
        // backend not running yet — silently ignore
      }
    }
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setScanned(false);
    setFindings([]);
  };

  const pickFiles = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = Array.from(TEXT_EXTENSIONS).map((e) => `.${e}`).join(",");
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        setFiles((prev) => [...prev, ...Array.from(target.files!)]);
        setScanned(false);
        setFindings([]);
      }
    };
    input.click();
  };

  // ── Browser-side scan ─────────────────────────────────────────
  const startScan = async () => {
    if (files.length === 0) return;
    setScanning(true);
    setScanned(false);
    setLogs([]);
    setFindings([]);
    setBackendResult(null);
    const addLog = (msg: string) => setLogs((p) => [...p, msg]);
    const ts = () => new Date().toISOString().slice(11, 19);

    addLog(`> [${ts()}] SecureDel Secret Scanner`);
    addLog(`> [${ts()}] Files: ${files.length} — Patterns: ${SECRET_PATTERNS.length}`);
    addLog(`>`);

    const allFindings: SecretFinding[] = [];

    for (const file of files) {
      if (!isTextFile(file.name)) {
        addLog(`> [${ts()}] SKIP (binary): ${file.name}`);
        continue;
      }
      addLog(`> [${ts()}] Scanning: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      try {
        const text = await file.text();
        const found = scanFileText(text, file.name);
        allFindings.push(...found);
        if (found.length === 0) {
          addLog(`> [${ts()}] ✓ ${file.name} — clean`);
        } else {
          const high = found.filter((f) => f.confidence === "HIGH").length;
          addLog(`> [${ts()}] ⚠ ${file.name} — ${found.length} secret(s) (HIGH:${high})`);
        }
      } catch {
        addLog(`> [${ts()}] ERROR reading ${file.name}`);
      }
    }

    addLog(`>`);
    addLog(`> [${ts()}] ══ Scan complete ══`);
    addLog(`> [${ts()}] Total secrets found: ${allFindings.length}`);
    addLog(`> [${ts()}] HIGH confidence: ${allFindings.filter((f) => f.confidence === "HIGH").length}`);

    logClientRun({
      toolId: "secret-scanner",
      action: "browser_secret_scan",
      status: "success",
      details: {
        files: files.length,
        findings: allFindings.length,
      },
    });

    setFindings(allFindings);
    setScanning(false);
    setScanned(true);
  };

  // ── Backend repo scan + remediate + optional hook install ─────
  const runBackendScan = async () => {
    if (!repoPath.trim()) return;
    setBackendRunning(true);
    setBackendResult(null);
    const requestId = crypto.randomUUID();

    const appendProgress = (progress: ToolProgressEvent) => {
      if (progress.tool_id !== "secret-scanner") return;
      if (progress.request_id !== requestId) return;
      const d = progress.details as Record<string, any>;
      setLogs((p) => [...p, `[backend:${progress.stage}] ${d.file ?? d.root ?? d.action ?? ""}`]);
    };

    const unsubscribe = subscribeRunEvents({ onProgress: appendProgress });

    try {
      // Step 1: scan repo folder
      const scanData = await apiPost("/api/secrets/scan", {
        root: repoPath.trim(),
        fail_on_critical: false,
        request_id: requestId,
      });

      // Step 2: remediate (redact or flag)
      const fixData = await apiPost("/api/secrets/remediate", {
        root: repoPath.trim(),
        action: remediateAction,
        passes: 3,
        request_id: requestId,
      });

      // Step 3 (optional): install pre-commit hook
      let hookData = null;
      if (installHook) {
        hookData = await apiPost("/api/secrets/install-hook", {
          repo_root: repoPath.trim(),
          server_url: API_BASE,
          request_id: requestId,
        });
      }

      setBackendResult({ scan: scanData, fix: fixData, hook: hookData });
    } catch (err: any) {
      setBackendResult({ error: err?.message ?? "Backend unreachable. Is it running on localhost:8000?" });
    } finally {
      unsubscribe();
      setBackendRunning(false);
    }
  };

  // ── Export report ─────────────────────────────────────────────
  const exportReport = () => {
    const lines = [
      "SecureDel Secret Scanner — Report",
      `Generated: ${new Date().toISOString()}`,
      `Files scanned: ${files.length}`,
      `Total findings: ${findings.length}`,
      "",
    ];
    for (const f of findings) {
      lines.push(`[${f.confidence}] ${f.file}:${f.line} — ${f.type}`);
      lines.push(`  Value: ${f.value}`);
      lines.push(`  Context: ${f.context}`);
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "secrets-scan-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const criticalCount = findings.filter((f) => f.confidence === "HIGH").length;
  const backendPatternList = Object.entries(availablePatterns).slice(0, 6);

  // ── Scanning state ────────────────────────────────────────────
  if (scanning) {
    return (
      <div>
        <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
          <Key className="inline w-5 h-5 text-primary mr-2" />
          Hardcoded Secret Detector
        </h2>
        <TerminalWindow title="secret-scanner">
          {logs.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-primary" : l.includes("⚠") ? "text-warning" : ""}>{l}</p>
          ))}
          <span className="animate-blink text-primary">▌</span>
        </TerminalWindow>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <Key className="inline w-5 h-5 text-primary mr-2" />
        Hardcoded Secret Detector
      </h2>

      {/* ── Browser-side file upload & scan ── */}
      {!scanned && (
        <div className="space-y-6">
          <div
            className="border-2 border-dashed border-primary/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={pickFiles}
            data-interactive
          >
            <FolderOpen className="w-8 h-8 text-primary/50 mx-auto mb-3" />
            <p className="font-mono text-sm text-text-secondary">Click to select source files</p>
            <p className="font-mono text-xs text-text-ghost mt-1">.js .ts .py .env .json .yaml .sh .conf and more</p>
            <p className="font-mono text-xs text-text-ghost mt-1">Scans for {SECRET_PATTERNS.length} real secret patterns</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-border">
                  <span className="font-mono text-sm text-text-primary">{f.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-text-ghost">{(f.size / 1024).toFixed(1)} KB</span>
                    <button onClick={() => removeFile(i)} className="text-text-ghost hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <CyberButton onClick={startScan} disabled={files.length === 0}>
            Run Secret Scan
          </CyberButton>

          {/* ── Backend repo scan section ── */}
          <div className="p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-text-ghost uppercase tracking-widest flex items-center gap-2">
                <Server className="w-3.5 h-3.5" />
                // Backend Repo Scanner & Remediator
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
                  Enter your project folder path. The backend will walk all files, detect secrets, and remediate them before your next commit.
                </p>

                {/* Repo path input */}
                <input
                  type="text"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  placeholder="e.g. C:\Users\dinesh\myproject  or  /home/user/myapp"
                  className="w-full h-10 px-3 bg-surface-2 border border-border rounded-lg font-mono text-xs text-text-primary focus:border-primary/40 outline-none placeholder:text-text-ghost"
                />

                {/* Remediate action */}
                <div className="flex gap-2">
                  {(["redact", "flag"] as const).map((act) => (
                    <button
                      key={act}
                      onClick={() => setRemediateAction(act)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-all ${remediateAction === act
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-surface text-text-ghost hover:border-border/60"
                        }`}
                      data-interactive
                    >
                      {act === "redact" ? "Redact secrets" : "Flag only (no edit)"}
                    </button>
                  ))}
                </div>

                {/* Pre-commit hook toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-text-ghost" />
                    <span className="font-mono text-xs text-text-ghost">Install git pre-commit hook</span>
                  </div>
                  <button
                    onClick={() => setInstallHook((v) => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${installHook ? "bg-primary" : "bg-surface border border-border"}`}
                    data-interactive
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${installHook ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
                {installHook && (
                  <p className="font-mono text-xs text-text-ghost px-1">
                    Installs <code className="text-primary">.git/hooks/pre-commit</code> — blocks commits when critical secrets are found.
                  </p>
                )}

                {/* Backend pattern count */}
                {backendPatternList.length > 0 && (
                  <p className="font-mono text-xs text-text-ghost">
                    Backend patterns: {backendPatternList.map(([k, v]) => `${k} (${v.severity})`).join(", ")}
                    {Object.keys(availablePatterns).length > 6 ? ` +${Object.keys(availablePatterns).length - 6} more` : ""}
                  </p>
                )}

                <p className="font-mono text-xs text-destructive">
                  ⚠ Requires backend running at localhost:8000.
                  {remediateAction === "redact" ? " Secrets will be overwritten in source files." : ""}
                </p>

                <CyberButton
                  variant="danger"
                  onClick={runBackendScan}
                  disabled={!repoPath.trim() || backendRunning}
                >
                  {backendRunning
                    ? "Scanning..."
                    : `Scan & ${remediateAction === "redact" ? "Redact" : "Flag"} Repo${installHook ? " + Install Hook" : ""}`}
                </CyberButton>

                {/* Backend result */}
                {backendResult && (
                  <div className="mt-3 p-3 rounded-lg bg-surface-2 border border-border font-mono text-xs space-y-1">
                    {backendResult.error ? (
                      <p className="text-destructive">✗ {backendResult.error}</p>
                    ) : (
                      <>
                        <p className="text-primary">✓ Backend scan complete</p>
                        <p className="text-text-secondary">
                          Findings: {backendResult.scan?.total_findings ?? "—"} &nbsp;|&nbsp;
                          Critical: {backendResult.scan?.by_severity?.critical ?? 0} &nbsp;|&nbsp;
                          High: {backendResult.scan?.by_severity?.high ?? 0}
                        </p>
                        <p className="text-text-secondary">
                          Remediated: {backendResult.fix?.files_processed ?? "—"} file(s) &nbsp;|&nbsp;
                          Secrets fixed: {backendResult.fix?.total_secrets ?? "—"}
                        </p>
                        {backendResult.hook && (
                          <p className={backendResult.hook.success ? "text-primary" : "text-destructive"}>
                            Hook: {backendResult.hook.success ? `✓ Installed at ${backendResult.hook.hook_path}` : `✗ ${backendResult.hook.reason ?? backendResult.hook.error}`}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {scanned && (
        <div>
          {findings.length === 0 ? (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-mono text-sm text-primary">
                No secrets detected in {files.length} file(s) — {SECRET_PATTERNS.length} patterns checked
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="font-mono text-sm text-destructive uppercase tracking-wider">
                {criticalCount} HIGH-confidence secrets — {findings.length} total findings
              </span>
            </div>
          )}

          <div className="space-y-2 mb-6">
            {findings.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-border">
                <span className="font-mono text-xs text-primary min-w-[120px] truncate">📄 {f.file}</span>
                <span className="font-mono text-xs text-text-ghost min-w-[40px]">L{f.line}</span>
                <span className="font-mono text-xs text-text-secondary flex-1 break-all">{f.value}</span>
                <span className="text-[10px] font-mono text-warning bg-warning/10 px-1.5 py-0.5 rounded whitespace-nowrap">{f.type}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap ${f.confidence === "HIGH" ? "text-destructive bg-destructive/10" :
                    f.confidence === "MEDIUM" ? "text-warning bg-warning/10" : "text-text-ghost bg-surface-2"
                  }`}>
                  {f.confidence}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <CyberButton variant="secondary" onClick={exportReport}>
              <Download className="w-4 h-4 mr-2 inline" />
              Export Report
            </CyberButton>
            <CyberButton variant="secondary" onClick={() => { setScanned(false); setFiles([]); setFindings([]); setLogs([]); setBackendResult(null); }}>
              Scan New Files
            </CyberButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretScanner;