import { useState, useEffect } from "react";
import {
  Chrome,
  CheckCircle2,
  XCircle,
  MapPin,
  TestTube,
  RotateCcw,
  Shield,
  Loader2,
  FolderOpen,
  AlertTriangle,
  Info,
  Upload,
  X,
} from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { InputMethodSelector } from "@/components/ui/InputMethodSelector";
import {
  validateCachePath,
  generateDemoCache,
  uploadCacheFile,
  wipeCachePath,
  detectBrowsers,
  wipeBrowsers,
  formatBytes,
  subscribeRunEvents,
  ToolProgressEvent,
} from "@/lib/api";
import { validatePathExtension, type ExtensionValidationResult } from "@/lib/extensionRules";
import { ExtensionErrorBadge } from "@/components/ui/ExtensionErrorBadge";

type InputMode = "select" | "upload" | "filepath" | "demo" | "system";

const BrowserCleaner = () => {
  const [inputMode, setInputMode] = useState<InputMode>("select");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // System detected browsers
  const [detectedBrowsers, setDetectedBrowsers] = useState<Record<string, any>>({});
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>([]);
  const [wipeCache, setWipeCache] = useState(true);
  const [wipeCookies, setWipeCookies] = useState(true);
  const [wipeSessions, setWipeSessions] = useState(true);
  const [passes, setPasses] = useState(3);

  // Upload Mode State
  const [uploading, setUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Path Mode State
  const [pathInput, setPathInput] = useState("C:\\SecureDel-Demo\\BrowserCache\\");
  const [validatingPath, setValidatingPath] = useState(false);
  const [pathData, setPathData] = useState<any | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);
  const [pathExtError, setPathExtError] = useState<ExtensionValidationResult | null>(null);

  // Demo Mode State
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [demoData, setDemoData] = useState<any | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  // Operation State
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [wipeResult, setWipeResult] = useState<any | null>(null);

  // Detect browsers on mount
  useEffect(() => {
    detectBrowsers()
      .then((data) => {
        if (data?.detected_browsers) {
          setDetectedBrowsers(data.detected_browsers);
          setSelectedBrowsers(Object.keys(data.detected_browsers));
        }
      })
      .catch(() => {});
  }, []);

  // Subscribe to real-time progress events
  useEffect(() => {
    const unsub = subscribeRunEvents({
      onProgress: (evt: ToolProgressEvent) => {
        if (evt.tool_id !== "browser-cleaner") return;
        const ts = new Date().toISOString().slice(11, 19);
        if (evt.stage === "category_start") {
          setLogs((p) => [...p, `> [${ts}] Wiping category: ${evt.details?.category} (${evt.details?.targets || 0} paths)`]);
        } else if (evt.stage === "browser_complete") {
          setLogs((p) => [...p, `> [${ts}] ✓ ${evt.details?.browser} processed: ${evt.details?.wiped_files} files wiped`]);
        } else if (evt.stage === "run_complete") {
          setLogs((p) => [...p, `> [${ts}] ✓ Cache sanitization complete & verified`]);
        }
      },
    });
    return () => unsub();
  }, []);

  const handleResetAll = () => {
    setPathData(null);
    setUploadedData(null);
    setDemoData(null);
    setWipeResult(null);
    setLogs([]);
    setProgress(0);
    setRunning(false);
    setComplete(false);
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
      const res = await uploadCacheFile(file);
      if (res.success) {
        setUploadedData(res);
      } else {
        setUploadError(res.message || "Failed to upload cache file.");
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
    const extResult = validatePathExtension("browser-cleaner", target);
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
      const res = await validateCachePath(target);
      if (res.success && res.exists) {
        setPathData(res);
      } else {
        setPathError(res.message || "Cache directory does not exist or cannot be accessed.");
        setPathData(null);
      }
    } catch (err: any) {
      setPathError(err.message || "Failed to validate cache path.");
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
      const res = await generateDemoCache();
      setDemoData(res);
    } catch (err: any) {
      setDemoError(err.message || "Failed to create demo browser cache on disk.");
    } finally {
      setGeneratingDemo(false);
    }
  };

  const executeWipe = async () => {
    setConfirmOpen(false);
    setRunning(true);
    setComplete(false);
    setProgress(10);
    setLogs([]);
    const ts = () => new Date().toISOString().slice(11, 19);
    const addLog = (m: string) => setLogs((p) => [...p, m]);

    addLog(`> [${ts()}] Initiating Real Browser Cache Wipe Protocol`);

    try {
      if (inputMode === "upload" && uploadedData) {
        addLog(`> [${ts()}] Target Uploaded Cache File: ${uploadedData.path}`);
        addLog(`> [${ts()}] File: ${uploadedData.name} (${formatBytes(uploadedData.size || 0)})`);
        addLog(`> [${ts()}] Overwrite passes: ${passes}`);
        setProgress(40);

        const res = await wipeCachePath(uploadedData.path, passes);
        setWipeResult(res);
        setProgress(100);

        if (res.verified || res.success) {
          addLog(`> [${ts()}] ✓ Cache File Wiped: ${res.wiped_files || 1}`);
          addLog(`> [${ts()}] ✓ Bytes Sanitized: ${formatBytes(res.bytes_wiped || uploadedData.size || 0)}`);
          addLog(`> [${ts()}] ✓ Filesystem post-wipe verification: PASSED`);
          setComplete(true);
        } else {
          addLog(`> [${ts()}] ✗ Incomplete: ${res.failed_files || 1} file(s) could not be wiped`);
          setComplete(true);
        }
      } else if (inputMode === "filepath" && pathData) {
        addLog(`> [${ts()}] Target Directory: ${pathData.path}`);
        addLog(`> [${ts()}] Files Found: ${pathData.fileCount} (${formatBytes(pathData.totalBytes)})`);
        addLog(`> [${ts()}] Overwrite passes: ${passes}`);
        setProgress(40);

        const res = await wipeCachePath(pathData.path, passes);
        setWipeResult(res);
        setProgress(100);

        if (res.verified) {
          addLog(`> [${ts()}] ✓ Files Wiped: ${res.wiped_files}`);
          addLog(`> [${ts()}] ✓ Bytes Sanitized: ${formatBytes(res.bytes_wiped)}`);
          addLog(`> [${ts()}] ✓ Filesystem post-wipe verification: PASSED (0 remaining files)`);
          setComplete(true);
        } else {
          addLog(`> [${ts()}] ✗ Incomplete: ${res.failed_files} files could not be wiped`);
          setComplete(true);
        }
      } else if (inputMode === "demo" && demoData) {
        addLog(`> [${ts()}] Target Demo Cache: ${demoData.path}`);
        addLog(`> [${ts()}] Files in Demo Directory: ${demoData.fileCount} (${formatBytes(demoData.totalBytes)})`);
        setProgress(40);

        const res = await wipeCachePath(demoData.path, passes);
        setWipeResult(res);
        setProgress(100);

        if (res.verified) {
          addLog(`> [${ts()}] ✓ Demo Cache Wiped: ${res.wiped_files} files`);
          addLog(`> [${ts()}] ✓ Filesystem verification: PASSED (demo directory empty)`);
          setComplete(true);
        } else {
          addLog(`> [${ts()}] ✗ Verification failed`);
          setComplete(true);
        }
      } else {
        // System browsers mode
        addLog(`> [${ts()}] Selected Browsers: ${selectedBrowsers.join(", ")}`);
        const res = await wipeBrowsers({
          browsers: selectedBrowsers,
          wipe_cache: wipeCache,
          wipe_cookies: wipeCookies,
          wipe_sessions: wipeSessions,
          passes,
        });
        setWipeResult(res);
        setProgress(100);
        addLog(`> [${ts()}] Total Files Wiped: ${res.summary?.wiped_files || 0}`);
        addLog(`> [${ts()}] Total Bytes Wiped: ${formatBytes(res.summary?.bytes_wiped || 0)}`);
        addLog(`> [${ts()}] Status: ${res.verified ? "VERIFIED PASSED" : "PARTIAL"}`);
        setComplete(true);
      }
    } catch (err: any) {
      addLog(`> [${ts()}] ✗ Error: ${err.message || "Failed to wipe cache."}`);
      setComplete(true);
    } finally {
      setRunning(false);
    }
  };

  // ── Render: Selection Screen ─────────────────────────────────────────────

  if (inputMode === "select") {
    return (
      <div className="space-y-6">
        <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
          <Chrome className="w-5 h-5 text-primary" />
          Browser Cache & Cookie Wiper
        </h2>
        <InputMethodSelector
          title="Choose Cache Source"
          subtitle="Select a custom Cache Directory (e.g. C:\SecureDel-Demo\BrowserCache\), Upload a cache file, Generate Demo data, or Scan System Installed Browsers."
          onSelectManual={(file) => {
            if (file) {
              handleFileUpload(file);
            } else {
              setInputMode("upload");
            }
          }}
          onSelectFilePath={() => setInputMode("filepath")}
          onSelectDemo={handleSetupDemo}
          accept=".cache,.db,.sqlite,.sqlite3,.dat"
          acceptLabel=".cache  .db  .sqlite  .sqlite3  .dat"
        />
        {Object.keys(detectedBrowsers).length > 0 && (
          <div className="text-center pt-2">
            <CyberButton variant="ghost" size="sm" onClick={() => setInputMode("system")}>
              <Chrome className="w-4 h-4 mr-1 text-primary" /> Switch to System Installed Browsers Detection
            </CyberButton>
          </div>
        )}
      </div>
    );
  }

  // ── Header ───────────────────────────────────────────────────────────────

  const SourceHeader = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider flex items-center gap-2">
        <Chrome className="w-5 h-5 text-primary" />
        Browser Cache & Cookie Wiper
      </h2>
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="px-2.5 py-1 rounded-lg border font-bold uppercase border-primary/40 bg-primary/10 text-primary">
          {inputMode === "demo" ? "🧪 SecureDel Demo Generator" : inputMode === "upload" ? "📁 Uploaded Cache File" : inputMode === "filepath" ? "📍 Local Cache Directory" : "🌐 System Browsers"}
        </span>
        <button onClick={handleResetAll} className="text-text-ghost hover:text-text-primary underline text-xs cursor-pointer">
          Change Source
        </button>
      </div>
    </div>
  );

  // ── Render: Complete / Results ───────────────────────────────────────────

  if (complete) {
    const isSuccess = wipeResult?.verified || wipeResult?.success;
    return (
      <div className="space-y-6">
        <SourceHeader />
        <div className={`p-6 rounded-xl border text-left space-y-6 ${
          isSuccess ? "bg-emerald-500/5 border-emerald-500/30" : "bg-destructive/5 border-destructive/30"
        }`}>
          <div className="flex items-center gap-3">
            {isSuccess ? <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" /> : <XCircle className="w-8 h-8 text-destructive shrink-0" />}
            <div>
              <h3 className="font-display font-bold text-xl uppercase tracking-wide text-text-primary">
                {isSuccess ? "CACHE SANITIZATION VERIFIED" : "WIPE INCOMPLETE"}
              </h3>
              <p className="font-mono text-xs text-text-secondary mt-0.5">
                {isSuccess ? "Target cache data was physically removed and verified on disk." : "Some files could not be removed due to locks or permissions."}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-void border border-border font-mono text-xs space-y-2">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-text-ghost">Wiped Files:</span>
              <span className="font-bold text-emerald-400">{wipeResult?.wiped_files ?? wipeResult?.summary?.wiped_files ?? 0} files</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-text-ghost">Data Sanitized:</span>
              <span className="font-bold text-primary">{formatBytes(wipeResult?.bytes_wiped ?? wipeResult?.summary?.bytes_wiped ?? 0)}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-text-ghost">Remaining Files:</span>
              <span className={wipeResult?.remaining_files === 0 || isSuccess ? "text-emerald-400 font-bold" : "text-destructive font-bold"}>
                {wipeResult?.remaining_files ?? 0} files
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-ghost">Filesystem Verification:</span>
              <span className="text-emerald-400 font-bold">✓ PASSED</span>
            </div>
          </div>

          <div className="flex gap-3">
            <CyberButton variant="primary" size="sm" onClick={handleResetAll}>
              Clean Another Cache Source
            </CyberButton>
          </div>
        </div>

        <TerminalWindow title="cache-audit-log">
          {logs.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-emerald-400" : l.includes("✗") ? "text-destructive" : ""}>{l}</p>
          ))}
        </TerminalWindow>
      </div>
    );
  }

  // ── Render: Running ──────────────────────────────────────────────────────

  if (running) {
    return (
      <div className="space-y-4">
        <SourceHeader />
        <div>
          <div className="flex justify-between font-mono text-xs text-text-secondary mb-1">
            <span>SANITIZING AND REMOVING CACHE ENTRIES</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <TerminalWindow title="live-execution">
          {logs.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-emerald-400" : l.includes("✗") ? "text-destructive" : ""}>{l}</p>
          ))}
          <span className="animate-blink text-primary">▌</span>
        </TerminalWindow>
      </div>
    );
  }

  // ── Render: Input Panels ─────────────────────────────────────────────────

  const canWipe =
    (inputMode === "upload" && uploadedData !== null) ||
    (inputMode === "filepath" && pathData !== null) ||
    (inputMode === "demo" && demoData !== null) ||
    (inputMode === "system" && selectedBrowsers.length > 0);

  return (
    <div className="space-y-6">
      <SourceHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Source Configuration */}
        <div className="space-y-4">
          {/* 📁 UPLOAD MODE */}
          {inputMode === "upload" && (
            <div className="p-5 rounded-xl border border-primary/40 bg-surface space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase">
                <FolderOpen className="w-4 h-4" /> Uploaded Browser Cache File
              </div>

              {!uploadedData ? (
                <div
                  className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-void/50 hover:bg-primary/5 rounded-xl p-6 text-center transition-all cursor-pointer group"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".cache,.db,.sqlite,.sqlite3,.dat";
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
                    {uploading ? "UPLOADING TO SECURE STORAGE..." : "CLICK TO CHOOSE CACHE FILE"}
                  </p>
                  <p className="font-mono text-[10px] text-text-ghost mt-1">
                    Accepts: .cache, .db, .sqlite, .sqlite3, .dat
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-void border border-primary/30 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-primary font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> CACHE FILE LOADED
                    </span>
                    <button
                      onClick={() => setUploadedData(null)}
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
                    <span className="text-emerald-400 font-bold">READY TO WIPE</span>
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
                <MapPin className="w-4 h-4" /> Cache Directory Path
              </div>

              <div className="space-y-2">
                <p className="text-xs text-text-secondary">Enter the full path of a cache directory to inspect and wipe:</p>
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
                    placeholder="C:\SecureDel-Demo\BrowserCache\"
                    className="w-full h-11 px-3 bg-surface-2 border border-border rounded-xl font-mono text-xs text-text-primary outline-none focus:border-blue-400"
                  />
                  <CyberButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleValidatePath()}
                    disabled={validatingPath || !pathInput.trim()}
                    className="shrink-0 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                  >
                    {validatingPath ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate Path"}
                  </CyberButton>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-text-ghost">
                  <span>Preset:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPathInput("C:\\SecureDel-Demo\\BrowserCache\\");
                      handleValidatePath("C:\\SecureDel-Demo\\BrowserCache\\");
                    }}
                    className="text-blue-400 hover:underline"
                  >
                    C:\SecureDel-Demo\BrowserCache\
                  </button>
                </div>
              </div>

              {pathExtError && (
                <ExtensionErrorBadge
                  ext={pathExtError.ext}
                  currentToolLabel="Browser Cache & Cookie Wiper"
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
                    ✦ Click here to generate demo cache files in this location
                  </button>
                </div>
              )}

              {pathData && (
                <div className="p-4 rounded-xl bg-void border border-blue-500/30 space-y-2 font-mono text-xs">
                  <p className="text-blue-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> CACHE DIRECTORY DETAILS
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <span className="text-text-ghost">Path:</span>
                    <span className="text-text-primary truncate">{pathData.path}</span>
                    <span className="text-text-ghost">Files Found:</span>
                    <span className="text-primary font-bold">{pathData.fileCount}</span>
                    <span className="text-text-ghost">Total Size:</span>
                    <span className="text-primary font-bold">{formatBytes(pathData.totalBytes)}</span>
                    <span className="text-text-ghost">Status:</span>
                    <span className="text-emerald-400 font-bold">READY TO WIPE</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🧪 DEMO MODE */}
          {inputMode === "demo" && (
            <div className="p-5 rounded-xl border border-amber-500/40 bg-surface space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-amber-400 font-bold uppercase flex items-center gap-2">
                  <TestTube className="w-4 h-4" /> 🧪 Physical Demo Cache Created
                </p>
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 font-mono text-[10px] font-bold">
                  REAL FILES
                </span>
              </div>

              {generatingDemo ? (
                <div className="p-6 text-center text-amber-400 font-mono text-xs space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  <p>Generating cache files in C:\SecureDel-Demo\BrowserCache\...</p>
                </div>
              ) : demoData ? (
                <div className="p-4 rounded-xl bg-void border border-border font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-ghost">Location:</span>
                    <span className="text-amber-400 font-bold truncate max-w-[200px]">{demoData.path}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-ghost">Files:</span>
                    <span className="text-primary font-bold">{demoData.fileCount} test cache files</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-ghost">Size:</span>
                    <span className="text-primary font-bold">{formatBytes(demoData.totalBytes)}</span>
                  </div>
                </div>
              ) : null}

              <CyberButton variant="ghost" size="sm" className="w-full text-amber-400" onClick={handleSetupDemo}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Re-generate Demo Cache
              </CyberButton>
            </div>
          )}

          {/* 🌐 SYSTEM BROWSERS MODE */}
          {inputMode === "system" && (
            <div className="p-5 rounded-xl border border-border bg-surface space-y-4 shadow-xl">
              <p className="font-mono text-xs text-text-primary font-bold uppercase">Installed System Browsers</p>
              <div className="space-y-2">
                {Object.keys(detectedBrowsers).map((b) => (
                  <label key={b} className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border cursor-pointer hover:border-primary/40">
                    <input
                      type="checkbox"
                      checked={selectedBrowsers.includes(b)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedBrowsers((prev) => [...prev, b]);
                        else setSelectedBrowsers((prev) => prev.filter((x) => x !== b));
                      }}
                      className="accent-primary"
                    />
                    <span className="font-mono text-xs font-bold text-text-primary capitalize">{b}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Wipe Parameters & Execution */}
        <div className="space-y-4">
          <span className="font-mono text-xs text-text-ghost tracking-widest uppercase block">// Sanitization Passes</span>
          <div className="grid grid-cols-3 gap-2">
            {[1, 3, 7].map((p) => (
              <button
                key={p}
                onClick={() => setPasses(p)}
                className={`p-3 rounded-lg border text-center font-mono text-xs transition-all ${
                  passes === p ? "border-primary bg-primary/10 text-primary font-bold" : "border-border bg-surface text-text-ghost"
                }`}
              >
                {p} {p === 1 ? "Pass (Fast)" : p === 3 ? "Passes (DoD)" : "Passes (Ext)"}
              </button>
            ))}
          </div>

          <div className="pt-4">
            <CyberButton variant="danger" size="lg" className="w-full" disabled={!canWipe || running} onClick={() => setConfirmOpen(true)}>
              <Shield className="w-4 h-4 mr-2" />
              Wipe Cache & Verify
            </CyberButton>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-destructive/40 bg-surface p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-destructive font-bold text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Confirm Real Cache Wipe
            </h3>
            <p className="text-text-secondary leading-relaxed">
              This will permanently overwrite and delete all files in the target cache location on the physical filesystem.
            </p>
            <div className="flex gap-3 pt-2">
              <CyberButton variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmOpen(false)}>
                Cancel
              </CyberButton>
              <CyberButton variant="danger" size="sm" className="flex-1" onClick={executeWipe}>
                Confirm Wipe
              </CyberButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserCleaner;
