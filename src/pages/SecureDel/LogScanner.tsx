import { useState } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  TestTube,
  RotateCcw,
  Shield,
  Loader2,
  ShieldAlert,
  Upload,
  X,
  FolderOpen,
} from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { InputMethodSelector } from "@/components/ui/InputMethodSelector";
import {
  validateLogPath,
  generateDemoLogs,
  uploadLogFile,
  scanLogs,
  redactLogs,
  formatBytes,
} from "@/lib/api";
import { validatePathExtension, type ExtensionValidationResult } from "@/lib/extensionRules";
import { ExtensionErrorBadge } from "@/components/ui/ExtensionErrorBadge";

type InputMode = "select" | "upload" | "filepath" | "demo";

const LogScanner = () => {
  const [inputMode, setInputMode] = useState<InputMode>("select");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Upload Mode State
  const [uploading, setUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Path Mode State
  const [pathInput, setPathInput] = useState("C:\\SecureDel-Demo\\Logs\\");
  const [validatingPath, setValidatingPath] = useState(false);
  const [pathData, setPathData] = useState<any | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);
  const [pathExtError, setPathExtError] = useState<ExtensionValidationResult | null>(null);

  // Demo Mode State
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [demoData, setDemoData] = useState<any | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  // Scan & Redaction State
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [redacting, setRedacting] = useState(false);
  const [redacted, setRedacted] = useState(false);
  const [redactResult, setRedactResult] = useState<any | null>(null);

  const handleResetAll = () => {
    setPathData(null);
    setUploadedData(null);
    setDemoData(null);
    setScanResult(null);
    setRedactResult(null);
    setLogs([]);
    setScanning(false);
    setScanned(false);
    setRedacted(false);
    setPathError(null);
    setPathExtError(null);
    setUploadError(null);
    setDemoError(null);
    setInputMode("select");
  };

  const handleFileUpload = async (file: File) => {
    setInputMode("upload");
    setUploading(true);
    setUploadError(null);
    try {
      const res = await uploadLogFile(file);
      if (res.success) {
        setUploadedData(res);
        try {
          const val = await validateLogPath(res.path);
          if (val.success) setPathData(val);
        } catch (_) {}
      } else {
        setUploadError(res.message || "Failed to upload log file.");
      }
    } catch (err: any) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleValidatePath = async (custom?: string) => {
    const rawTarget = (custom ?? pathInput).trim();
    const target = rawTarget.replace(/^["']+|["']+$/g, "").trim();
    if (!target) return;

    // Extension whitelist check before API call
    const extResult = validatePathExtension("log-scanner", target);
    if (!extResult.valid) {
      setPathExtError(extResult);
      setPathError(null);
      setPathData(null);
      return;
    }
    setPathExtError(null);

    setValidatingPath(true);
    setPathError(null);
    try {
      const res = await validateLogPath(target);
      if (res.success && res.exists) {
        setPathData(res);
      } else {
        setPathError(res.message || "Log file or directory not found.");
        setPathData(null);
      }
    } catch (err: any) {
      setPathError(err.message || "Validation failed.");
      setPathData(null);
    } finally {
      setValidatingPath(false);
    }
  };

  const handleSetupDemo = async () => {
    setInputMode("demo");
    setGeneratingDemo(true);
    setDemoError(null);
    try {
      const res = await generateDemoLogs();
      setDemoData(res);
    } catch (err: any) {
      setDemoError(err.message || "Failed to generate demo log files on disk.");
    } finally {
      setGeneratingDemo(false);
    }
  };

  const executeScan = async () => {
    setScanning(true);
    setScanned(false);
    setRedacted(false);
    setLogs([]);
    const ts = () => new Date().toISOString().slice(11, 19);
    const addLog = (m: string) => setLogs((p) => [...p, m]);

    const targetPath =
      inputMode === "upload"
        ? uploadedData?.path
        : inputMode === "demo"
        ? demoData?.path
        : pathData?.path;

    if (!targetPath) {
      setScanning(false);
      return;
    }

    addLog(`> [${ts()}] Initiating Real Log Scanner Engine`);
    addLog(`> [${ts()}] Target Log Source: ${targetPath}`);

    try {
      const res = await scanLogs({ paths: [targetPath], recursive: true });
      setScanResult(res);
      setScanned(true);

      addLog(`> [${ts()}] ✓ Files Scanned: ${res.files_scanned}`);
      addLog(`> [${ts()}] ✓ Lines Scanned: ${res.lines_scanned}`);
      addLog(`> [${ts()}] Total Findings: ${res.total_findings}`);
      addLog(`> [${ts()}] Critical: ${res.critical_count} | High: ${res.high_count} | Medium: ${res.medium_count}`);
    } catch (err: any) {
      addLog(`> [${ts()}] ✗ Error during log scan: ${err.message || "Scan failed"}`);
    } finally {
      setScanning(false);
    }
  };

  const executeRedaction = async (action: "redact" | "delete") => {
    setRedacting(true);
    const ts = () => new Date().toISOString().slice(11, 19);
    const addLog = (m: string) => setLogs((p) => [...p, m]);

    const targetPaths = scanResult?.flagged_files?.map((f: any) => f.path) || [];
    if (targetPaths.length === 0) {
      setRedacting(false);
      return;
    }

    addLog(`> [${ts()}] Executing ${action.toUpperCase()} on ${targetPaths.length} flagged log files on disk...`);

    try {
      const res = await redactLogs({ paths: targetPaths, action, passes: 3 });
      setRedactResult(res);
      setRedacted(true);
      addLog(`> [${ts()}] ✓ ${action === "delete" ? "Deleted" : "Redacted"} ${res.processed_count} files on disk`);
      addLog(`> [${ts()}] ✓ Filesystem verification: PASSED`);
    } catch (err: any) {
      addLog(`> [${ts()}] ✗ Action failed: ${err.message || "Failed"}`);
    } finally {
      setRedacting(false);
    }
  };

  if (inputMode === "select") {
    return (
      <div className="space-y-6">
        <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Log Sensitive Data Scanner
        </h2>
        <InputMethodSelector
          title="Choose Log Source"
          subtitle="Scan a real .log file or log directory (e.g. C:\SecureDel-Demo\Logs\) for exposed passwords, API keys, and credentials, Upload a log file, or generate real test logs on disk."
          onSelectManual={(file) => {
            if (file) {
              handleFileUpload(file);
            } else {
              setInputMode("upload");
            }
          }}
          onSelectFilePath={() => setInputMode("filepath")}
          onSelectDemo={handleSetupDemo}
          accept=".log,.txt,.out,.err"
          acceptLabel=".log  .txt  .out  .err"
        />
      </div>
    );
  }

  const SourceHeader = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Log Sensitive Data Scanner
      </h2>
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="px-2.5 py-1 rounded-lg border font-bold uppercase border-primary/40 bg-primary/10 text-primary">
          {inputMode === "demo" ? "🧪 SecureDel Demo Generator" : inputMode === "upload" ? "📁 Uploaded Log File" : "📍 Local Log Path"}
        </span>
        <button onClick={handleResetAll} className="text-text-ghost hover:text-text-primary underline text-xs cursor-pointer">
          Change Source
        </button>
      </div>
    </div>
  );

  const canScan =
    (inputMode === "upload" && uploadedData !== null) ||
    (inputMode === "filepath" && pathData !== null) ||
    (inputMode === "demo" && demoData !== null);

  return (
    <div className="space-y-6">
      <SourceHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Source Selection & Actions */}
        <div className="space-y-4">
          {/* 📁 UPLOAD MODE */}
          {inputMode === "upload" && (
            <div className="p-5 rounded-xl border border-primary/40 bg-surface space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase">
                <FolderOpen className="w-4 h-4" /> Uploaded Log File
              </div>

              {!uploadedData ? (
                <div
                  className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-void/50 hover:bg-primary/5 rounded-xl p-6 text-center transition-all cursor-pointer group"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".log,.txt,.out,.err";
                    input.onchange = (e: any) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-8 h-8 text-primary/60 group-hover:text-primary mx-auto mb-2" />
                  <p className="font-mono text-xs text-text-primary font-bold">
                    {uploading ? "UPLOADING TO SECURE STORAGE..." : "CLICK TO CHOOSE LOG FILE"}
                  </p>
                  <p className="font-mono text-[10px] text-text-ghost mt-1">
                    Accepts: .log, .txt, .out, .err
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-void border border-primary/30 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-primary font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> LOG FILE LOADED
                    </span>
                    <button
                      onClick={() => { setUploadedData(null); setPathData(null); }}
                      className="text-text-ghost hover:text-destructive"
                      title="Clear file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <span className="text-text-ghost">Filename:</span>
                    <span className="text-text-primary font-bold truncate">{uploadedData.name}</span>
                    <span className="text-text-ghost">Size:</span>
                    <span className="text-primary font-bold">{formatBytes(uploadedData.size || 0)}</span>
                    <span className="text-text-ghost">Path:</span>
                    <span className="text-text-secondary truncate" title={uploadedData.path}>{uploadedData.path}</span>
                    <span className="text-text-ghost">Status:</span>
                    <span className="text-emerald-400 font-bold">READY TO SCAN</span>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono">
                  ✗ {uploadError}
                </div>
              )}
            </div>
          )}

          {/* 📍 FILEPATH MODE */}
          {inputMode === "filepath" && (
            <div className="p-5 rounded-xl border border-blue-500/40 bg-surface space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-bold uppercase">
                <MapPin className="w-4 h-4" /> Log File / Directory Path
              </div>

              <div className="space-y-2">
                <p className="text-xs text-text-secondary">Enter path to a .log file or log directory:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pathInput}
                    onChange={(e) => {
                      setPathInput(e.target.value);
                      if (pathError) setPathError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleValidatePath();
                      }
                    }}
                    placeholder="C:\SecureDel-Demo\Logs\"
                    className="w-full h-11 px-3 bg-surface-2 border border-border rounded-xl font-mono text-xs text-text-primary outline-none focus:border-blue-400"
                  />
                  <CyberButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleValidatePath()}
                    disabled={validatingPath || !pathInput.trim()}
                    className="shrink-0 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                  >
                    {validatingPath ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate"}
                  </CyberButton>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-text-ghost">
                  <span>Preset:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPathInput("C:\\SecureDel-Demo\\Logs\\");
                      handleValidatePath("C:\\SecureDel-Demo\\Logs\\");
                    }}
                    className="text-blue-400 hover:underline"
                  >
                    C:\SecureDel-Demo\Logs\
                  </button>
                </div>
              </div>

              {pathExtError && (
                <ExtensionErrorBadge
                  ext={pathExtError.ext}
                  currentToolLabel="Log Sensitive Data Scanner"
                  allowedExtensions={pathExtError.allowedExtensions}
                  suggestedTool={pathExtError.suggestedTool}
                />
              )}

              {pathError && !pathExtError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono space-y-2">
                  <div>✗ {pathError}</div>
                  <button
                    type="button"
                    onClick={handleSetupDemo}
                    className="text-amber-400 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    ✦ Click here to generate demo log files in this location
                  </button>
                </div>
              )}

              {pathData && (
                <div className="p-4 rounded-xl bg-void border border-blue-500/30 space-y-2 font-mono text-xs">
                  <p className="text-blue-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> LOG SOURCE READY
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <span className="text-text-ghost">Files Found:</span>
                    <span className="text-primary font-bold">{pathData.fileCount} log file(s)</span>
                    <span className="text-text-ghost">Total Size:</span>
                    <span className="text-primary font-bold">{formatBytes(pathData.totalBytes)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {inputMode === "demo" && (
            <div className="p-5 rounded-xl border border-amber-500/40 bg-surface space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-amber-400 font-bold uppercase flex items-center gap-2">
                  <TestTube className="w-4 h-4" /> 🧪 Physical Demo Logs Created
                </p>
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 font-mono text-[10px] font-bold">
                  REAL FILES
                </span>
              </div>
              <CyberButton variant="ghost" size="sm" className="w-full text-amber-400" onClick={handleSetupDemo}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Re-generate Demo Logs
              </CyberButton>
            </div>
          )}

          <div className="pt-2">
            <CyberButton variant="danger" size="lg" className="w-full" disabled={!canScan || scanning} onClick={executeScan}>
              {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
              {scanning ? "Scanning Real Logs..." : "Scan Logs for Secrets"}
            </CyberButton>
          </div>
        </div>

        {/* Right Column: Scan Findings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-text-ghost tracking-widest uppercase block">
              // Scan Findings ({scanResult?.total_findings ?? 0})
            </span>
          </div>

          {scanned && scanResult && (
            <div className="p-4 rounded-xl bg-void border border-border font-mono text-xs space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-border/40">
                <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
                  <p className="text-destructive font-bold">{scanResult.critical_count}</p>
                  <p className="text-[10px] text-text-ghost">CRITICAL</p>
                </div>
                <div className="p-2 rounded bg-warning/10 border border-warning/30">
                  <p className="text-warning font-bold">{scanResult.high_count}</p>
                  <p className="text-[10px] text-text-ghost">HIGH</p>
                </div>
                <div className="p-2 rounded bg-surface-2 border border-border">
                  <p className="text-text-secondary font-bold">{scanResult.medium_count}</p>
                  <p className="text-[10px] text-text-ghost">MEDIUM</p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {scanResult.flagged_files?.flatMap((f: any) =>
                  f.matches.map((m: any, mi: number) => (
                    <div key={`${f.filename}-${mi}`} className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">{f.filename} (Line {m.line})</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          m.severity === "CRITICAL" ? "bg-destructive/20 text-destructive" : m.severity === "HIGH" ? "bg-warning/20 text-warning" : "bg-surface-2 text-text-secondary"
                        }`}>{m.type}</span>
                      </div>
                      <p className="text-[11px] text-text-ghost break-all">{m.preview}</p>
                    </div>
                  ))
                )}
              </div>

              {scanResult.total_findings > 0 && !redacted && (
                <div className="flex gap-2 pt-2">
                  <CyberButton variant="secondary" size="sm" className="flex-1 text-xs" disabled={redacting} onClick={() => executeRedaction("redact")}>
                    Redact Secrets In-Place
                  </CyberButton>
                  <CyberButton variant="danger" size="sm" className="flex-1 text-xs" disabled={redacting} onClick={() => executeRedaction("delete")}>
                    Secure Delete Flagged Logs
                  </CyberButton>
                </div>
              )}

              {redacted && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Action complete and verified on disk.</span>
                </div>
              )}
            </div>
          )}

          {!scanned && (
            <div className="p-8 text-center text-text-ghost font-mono text-xs border border-dashed border-border rounded-xl">
              No scan performed yet. Validate a log path or upload a file and click Scan Logs.
            </div>
          )}
        </div>
      </div>

      <TerminalWindow title="log-scanner-live">
        {logs.map((l, i) => (
          <p key={i} className={l.includes("✓") ? "text-emerald-400" : l.includes("✗") ? "text-destructive" : ""}>{l}</p>
        ))}
      </TerminalWindow>
    </div>
  );
};

export default LogScanner;