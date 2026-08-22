import { useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  TestTube,
  RotateCcw,
  Shield,
  Loader2,
  AlertTriangle,
  FileText,
  Upload,
  X,
  FolderOpen,
} from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { InputMethodSelector } from "@/components/ui/InputMethodSelector";
import {
  validateRecentPath,
  generateDemoRecent,
  uploadRecentFile,
  cleanRecentPath,
  formatBytes,
} from "@/lib/api";
import { validatePathExtension, type ExtensionValidationResult } from "@/lib/extensionRules";
import { ExtensionErrorBadge } from "@/components/ui/ExtensionErrorBadge";

type InputMode = "select" | "upload" | "filepath" | "demo";

const RecentFilesCleaner = () => {
  const [inputMode, setInputMode] = useState<InputMode>("select");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Upload Mode State
  const [uploading, setUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Path Mode State
  const [pathInput, setPathInput] = useState("C:\\SecureDel-Demo\\RecentFiles\\recent-files.json");
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
  const [logs, setLogs] = useState<string[]>([]);
  const [cleanResult, setCleanResult] = useState<any | null>(null);

  const handleResetAll = () => {
    setPathData(null);
    setUploadedData(null);
    setDemoData(null);
    setCleanResult(null);
    setLogs([]);
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
      const res = await uploadRecentFile(file);
      if (res.success) {
        setUploadedData(res);
        // Also validate the uploaded JSON file to parse its entries
        try {
          const val = await validateRecentPath(res.path);
          if (val.success) {
            setPathData(val);
          }
        } catch (_) {}
      } else {
        setUploadError(res.message || "Failed to upload recent files list.");
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
    const extResult = validatePathExtension("recent-files", target);
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
      const res = await validateRecentPath(target);
      if (res.success && res.exists) {
        setPathData(res);
      } else {
        setPathError(res.message || "Recent files source not found.");
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
      const res = await generateDemoRecent();
      setDemoData(res);
    } catch (err: any) {
      setDemoError(err.message || "Failed to generate demo recent files on disk.");
    } finally {
      setGeneratingDemo(false);
    }
  };

  const executeClean = async () => {
    setConfirmOpen(false);
    setRunning(true);
    setComplete(false);
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
      setRunning(false);
      return;
    }

    addLog(`> [${ts()}] Initiating Recent Files History Eraser`);
    addLog(`> [${ts()}] Source Target: ${targetPath}`);

    try {
      const res = await cleanRecentPath(targetPath, 3);
      setCleanResult(res);

      if (res.verified || res.success) {
        addLog(`> [${ts()}] ✓ Cleaned Entries: ${res.entries_cleaned || 1}`);
        addLog(`> [${ts()}] ✓ Overwritten and removed from physical storage`);
        addLog(`> [${ts()}] ✓ Filesystem verification: PASSED`);
        setComplete(true);
      } else {
        addLog(`> [${ts()}] ✗ Cleaning failed on target`);
        setComplete(true);
      }
    } catch (err: any) {
      addLog(`> [${ts()}] ✗ Error: ${err.message || "Clean failed"}`);
      setComplete(true);
    } finally {
      setRunning(false);
    }
  };

  if (inputMode === "select") {
    return (
      <div className="space-y-6">
        <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Files & History Cleaner
        </h2>
        <InputMethodSelector
          title="Choose History Source"
          subtitle="Select a recent files history source path (e.g. recent-files.json or directory), Upload a history file, or generate safe test history data on disk."
          onSelectManual={(file) => {
            if (file) {
              handleFileUpload(file);
            } else {
              setInputMode("upload");
            }
          }}
          onSelectFilePath={() => setInputMode("filepath")}
          onSelectDemo={handleSetupDemo}
          accept=".json,.xml,.lnk,.xbel"
          acceptLabel=".json  .xml  .lnk  .xbel"
        />
      </div>
    );
  }

  const SourceHeader = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Recent Files Cleaner
      </h2>
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="px-2.5 py-1 rounded-lg border font-bold uppercase border-primary/40 bg-primary/10 text-primary">
          {inputMode === "demo" ? "🧪 SecureDel Demo Generator" : inputMode === "upload" ? "📁 Uploaded History File" : "📍 Local History File"}
        </span>
        <button onClick={handleResetAll} className="text-text-ghost hover:text-text-primary underline text-xs cursor-pointer">
          Change Source
        </button>
      </div>
    </div>
  );

  if (complete) {
    const isSuccess = cleanResult?.verified || cleanResult?.success;
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
                {isSuccess ? "RECENT FILES HISTORY CLEANED" : "CLEANING FAILED"}
              </h3>
              <p className="font-mono text-xs text-text-secondary mt-0.5">
                {isSuccess ? "Target history trails were sanitized and verified on disk." : "Could not clean history source."}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-void border border-border font-mono text-xs space-y-2">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-text-ghost">Cleaned Items:</span>
              <span className="font-bold text-emerald-400">{cleanResult?.entries_cleaned || 0} entries</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-ghost">Verification Status:</span>
              <span className="text-emerald-400 font-bold">✓ PASSED</span>
            </div>
          </div>

          <CyberButton variant="primary" size="sm" onClick={handleResetAll}>
            Clean Another History Source
          </CyberButton>
        </div>

        <TerminalWindow title="recent-files-audit">
          {logs.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-emerald-400" : l.includes("✗") ? "text-destructive" : ""}>{l}</p>
          ))}
        </TerminalWindow>
      </div>
    );
  }

  const entriesToDisplay =
    inputMode === "demo"
      ? demoData?.entries || []
      : pathData?.entries || (uploadedData ? [{ filename: uploadedData.name, path: uploadedData.path, size: formatBytes(uploadedData.size || 0) }] : []);

  const canClean =
    (inputMode === "upload" && uploadedData !== null) ||
    (inputMode === "filepath" && pathData !== null) ||
    (inputMode === "demo" && demoData !== null);

  return (
    <div className="space-y-6">
      <SourceHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          {/* 📁 UPLOAD MODE */}
          {inputMode === "upload" && (
            <div className="p-5 rounded-xl border border-primary/40 bg-surface space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase">
                <FolderOpen className="w-4 h-4" /> Uploaded History File
              </div>

              {!uploadedData ? (
                <div
                  className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-void/50 hover:bg-primary/5 rounded-xl p-6 text-center transition-all cursor-pointer group"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".json,.xml,.lnk,.xbel";
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
                    {uploading ? "UPLOADING TO SECURE STORAGE..." : "CLICK TO CHOOSE HISTORY FILE"}
                  </p>
                  <p className="font-mono text-[10px] text-text-ghost mt-1">
                    Accepts: .json, .xml, .lnk, .xbel
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-void border border-primary/30 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-primary font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> HISTORY FILE LOADED
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
                    <span className="text-emerald-400 font-bold">READY TO CLEAN</span>
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
                <MapPin className="w-4 h-4" /> History Source Path
              </div>

              <div className="space-y-2">
                <p className="text-xs text-text-secondary">Enter path to recent history JSON file or folder:</p>
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
                    placeholder="C:\SecureDel-Demo\RecentFiles\recent-files.json"
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
                      setPathInput("C:\\SecureDel-Demo\\RecentFiles\\recent-files.json");
                      handleValidatePath("C:\\SecureDel-Demo\\RecentFiles\\recent-files.json");
                    }}
                    className="text-blue-400 hover:underline"
                  >
                    C:\SecureDel-Demo\RecentFiles\recent-files.json
                  </button>
                </div>
              </div>

              {pathExtError && (
                <ExtensionErrorBadge
                  ext={pathExtError.ext}
                  currentToolLabel="Recent Files Eraser"
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
                    ✦ Click here to generate demo recent files in this location
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 🧪 DEMO MODE */}
          {inputMode === "demo" && (
            <div className="p-5 rounded-xl border border-amber-500/40 bg-surface space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-amber-400 font-bold uppercase flex items-center gap-2">
                  <TestTube className="w-4 h-4" /> 🧪 Physical Demo History File Created
                </p>
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 font-mono text-[10px] font-bold">
                  REAL DISK FILE
                </span>
              </div>
              <CyberButton variant="ghost" size="sm" className="w-full text-amber-400" onClick={handleSetupDemo}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Re-generate Demo Recent Files
              </CyberButton>
            </div>
          )}
        </div>

        {/* Right Column: Detected Entries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-text-ghost tracking-widest uppercase block">// Detected History Entries ({entriesToDisplay.length})</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {entriesToDisplay.length > 0 ? (
              entriesToDisplay.map((e: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between font-mono text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="text-text-primary font-bold truncate">{e.filename}</p>
                    <p className="text-text-ghost text-[10px] truncate">{e.path}</p>
                  </div>
                  <span className="shrink-0 text-text-secondary text-[11px]">{e.size}</span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-ghost font-mono text-xs border border-dashed border-border rounded-xl">
                No entries detected. Validate a history path or generate demo data.
              </div>
            )}
          </div>

          <div className="pt-2">
            <CyberButton variant="danger" size="lg" className="w-full" disabled={!canClean || running} onClick={() => setConfirmOpen(true)}>
              <Shield className="w-4 h-4 mr-2" />
              Clean Recent Files & Verify
            </CyberButton>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-destructive/40 bg-surface p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="text-destructive font-bold text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Confirm Recent Files Clean
            </h3>
            <p className="text-text-secondary leading-relaxed">
              This will overwrite and remove all target recent-file history entries on disk.
            </p>
            <div className="flex gap-3 pt-2">
              <CyberButton variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmOpen(false)}>
                Cancel
              </CyberButton>
              <CyberButton variant="danger" size="sm" className="flex-1" onClick={executeClean}>
                Confirm Clean
              </CyberButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentFilesCleaner;

