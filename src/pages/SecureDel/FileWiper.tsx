import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Shield,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  TestTube,
  FileText,
  RotateCcw,
  Loader2,
  Info,
} from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { InputMethodSelector } from "@/components/ui/InputMethodSelector";
import { FilePathSelector } from "@/components/ui/FilePathSelector";
import {
  validateFilePath,
  generateDemoFile,
  uploadSecureFile,
  deleteFilePath,
  wipeFiles,
  formatBytes,
  ValidatePathResult,
  GenerateDemoResult,
  UploadFileResult,
  FileResult,
  subscribeRunEvents,
  ToolProgressEvent,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type InputMode = "select" | "upload" | "filepath" | "demo";

// ─── Algorithms ───────────────────────────────────────────────────────────────

const algorithms = [
  { id: "dod",     name: "DOD 5220.22-M",  passes: 3,  desc: "US DoD standard 3-pass overwrite" },
  { id: "dod_ext", name: "DOD 5220.22-M Extended", passes: 7, desc: "7-pass high assurance overwrite" },
  { id: "gutmann", name: "Gutmann Method", passes: 35, desc: "Maximum 35-pass forensic protection" },
  { id: "zero",    name: "Zero Fill",      passes: 1,  desc: "Single-pass zeroing" },
  { id: "custom",  name: "Custom N-Pass",  passes: 0,  desc: "User-defined pass count" },
];

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

const ConfirmDeleteDialog: React.FC<{
  targetName: string;
  targetPath: string;
  isRealPath: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ targetName, targetPath, isRealPath, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm p-4">
    <div className="rounded-2xl border border-destructive/40 bg-surface p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
      <div className="flex items-center gap-3 text-destructive">
        <AlertTriangle className="w-6 h-6 shrink-0" />
        <h3 className="font-display font-bold text-lg uppercase tracking-wide">
          Confirm Real Secure Deletion
        </h3>
      </div>
      <div className="space-y-3 font-mono text-xs text-text-secondary">
        <p>You are about to permanently sanitize and delete:</p>
        <div className="p-3 rounded-lg bg-void border border-border space-y-1">
          <p className="text-text-primary font-bold">{targetName}</p>
          <p className="text-text-ghost text-[11px] break-all">{targetPath}</p>
        </div>
        {isRealPath ? (
          <p className="text-destructive font-bold">
            ⚠️ CAUTION: This will delete the actual file on your local filesystem. This action cannot be undone.
          </p>
        ) : (
          <p className="text-text-ghost">
            SecureDel will delete the uploaded copy from controlled storage.
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <CyberButton variant="ghost" size="sm" className="flex-1" onClick={onCancel}>
          Cancel
        </CyberButton>
        <CyberButton variant="danger" size="sm" className="flex-1" onClick={onConfirm}>
          Confirm Secure Delete
        </CyberButton>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const FileWiper = () => {
  const [inputMode, setInputMode] = useState<InputMode>("select");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Algorithm settings
  const [algo, setAlgo] = useState("dod");
  const [customPasses, setCustomPasses] = useState(3);
  const selectedAlgo = algorithms.find((a) => a.id === algo)!;
  const passes = algo === "custom" ? customPasses : selectedAlgo.passes;

  // 1. Upload Mode State
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [uploadedInfo, setUploadedInfo] = useState<UploadFileResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 2. File Path Mode State
  const [validatedPath, setValidatedPath] = useState<ValidatePathResult | null>(null);

  // 3. Demo Mode State
  const [demoData, setDemoData] = useState<GenerateDemoResult | null>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  // Operation State
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [deletionResult, setDeletionResult] = useState<FileResult | null>(null);
  const [opError, setOpError] = useState<string | null>(null);

  // Real-time progress subscription
  useEffect(() => {
    const unsubscribe = subscribeRunEvents({
      onProgress: (evt: ToolProgressEvent) => {
        if (evt.tool_id !== "file-wiper") return;
        const ts = new Date().toISOString().slice(11, 19);
        if (evt.stage === "pass_start") {
          const pass = evt.details?.pass_index ?? "?";
          const total = evt.details?.passes_total ?? passes;
          const pat = evt.details?.pattern ?? "RANDOM";
          setLogs((p) => [...p, `> [${ts}] Pass ${pass}/${total}: Pattern ${pat}`]);
        } else if (evt.stage === "pass_complete") {
          const pct = Number(evt.details?.percent ?? 0);
          setProgress(pct);
        } else if (evt.stage === "file_complete") {
          setLogs((p) => [
            ...p,
            `> [${ts}] ✓ Multi-pass sanitization complete`,
            `> [${ts}] ✓ Physical file removed from disk`,
            `> [${ts}] ✓ Filesystem post-deletion verification: PASSED (file exists = false)`,
          ]);
        } else if (evt.stage === "file_error") {
          setLogs((p) => [
            ...p,
            `> [${ts}] ✗ ERROR: ${evt.details?.error || "Deletion failed"}`,
          ]);
        }
      },
    });
    return () => unsubscribe();
  }, [passes]);

  // ── Source badge ─────────────────────────────────────────────────────────

  const sourceBadge = () => {
    if (inputMode === "demo") return "🧪 SecureDel Demo Generator";
    if (inputMode === "filepath") return "📍 Local File Path";
    return "📁 File Upload";
  };

  // ── Handlers for switching modes ─────────────────────────────────────────

  const handleResetAll = () => {
    setUploadFileObj(null);
    setUploadedInfo(null);
    setValidatedPath(null);
    setDemoData(null);
    setDeletionResult(null);
    setLogs([]);
    setProgress(0);
    setRunning(false);
    setComplete(false);
    setOpError(null);
    setInputMode("select");
  };

  // Setup Demo Mode
  const setupDemoMode = async () => {
    setInputMode("demo");
    setIsGeneratingDemo(true);
    setDemoError(null);
    setLogs([]);
    try {
      const res = await generateDemoFile();
      setDemoData(res);
    } catch (err: any) {
      setDemoError(err.message || "Failed to generate demo file on filesystem.");
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (file: File) => {
    setUploadFileObj(file);
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadSecureFile(file);
      setUploadedInfo(res);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file to SecureDel controlled storage.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Drag/Drop for upload
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  // ── Perform Secure Delete (Real Backend Call) ─────────────────────────────

  const executeSecureDelete = async () => {
    setConfirmOpen(false);
    setRunning(true);
    setComplete(false);
    setProgress(5);
    setLogs([]);
    setOpError(null);

    const ts = () => new Date().toISOString().slice(11, 19);
    const addLog = (m: string) => setLogs((p) => [...p, m]);

    let targetPath = "";
    let targetName = "";

    if (inputMode === "upload" && uploadedInfo) {
      targetPath = uploadedInfo.path;
      targetName = uploadedInfo.name;
    } else if (inputMode === "filepath" && validatedPath) {
      targetPath = validatedPath.path || "";
      targetName = validatedPath.name || "";
    } else if (inputMode === "demo" && demoData) {
      targetPath = demoData.path;
      targetName = demoData.name;
    }

    if (!targetPath) {
      setOpError("No target file path available for deletion.");
      setRunning(false);
      return;
    }

    addLog(`> [${ts()}] Initiating SecureDel Real Filesystem Wipe Protocol`);
    addLog(`> [${ts()}] Mode: ${sourceBadge()}`);
    addLog(`> [${ts()}] Target File: ${targetName}`);
    addLog(`> [${ts()}] Physical Path: ${targetPath}`);
    addLog(`> [${ts()}] Overwrite Algorithm: ${selectedAlgo.name} (${passes} passes)`);
    addLog(`> [${ts()}] Sending request to SecureDel Python backend...`);

    try {
      const result = await deleteFilePath(targetPath, passes, true, true);
      setDeletionResult(result);
      setProgress(100);

      if (result.success && result.deleted && result.verified) {
        addLog(`> [${ts()}] Status: 200 OK`);
        addLog(`> [${ts()}] Passes Completed: ${result.passes_done}/${passes}`);
        addLog(`> [${ts()}] Execution Time: ${result.time_taken}s`);
        addLog(`> [${ts()}] ✓ SECURE DELETION COMPLETED`);
        addLog(`> [${ts()}] ✓ Filesystem verification: FILE DOES NOT EXIST`);
        addLog(`> [${ts()}] ✓ Verification Status: PASSED`);
        setComplete(true);
      } else {
        const errorMsg = result.error || "Filesystem verification failed. The file may still exist.";
        addLog(`> [${ts()}] ✗ FAILED: ${errorMsg}`);
        setOpError(errorMsg);
        setComplete(true);
      }
    } catch (err: any) {
      const errMsg = err.message || "Failed to execute secure deletion on backend.";
      addLog(`> [${ts()}] ✗ Backend Error: ${errMsg}`);
      setOpError(errMsg);
      setComplete(true);
    } finally {
      setRunning(false);
    }
  };

  // ── Render: Mode Selection Screen ────────────────────────────────────────

  if (inputMode === "select") {
    return (
      <div className="space-y-6">
        <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Secure File Deletion
        </h2>
        <InputMethodSelector
          title="Choose File Source"
          subtitle="Select genuine File Upload (storage copy), File Path (direct local filesystem deletion), or Generate Demo."
          onSelectManual={(file) => {
            setInputMode("upload");
            if (file) handleFileUpload(file);
          }}
          onSelectFilePath={() => setInputMode("filepath")}
          onSelectDemo={setupDemoMode}
          accept="*/*"
          acceptLabel="Any file format (.pdf, .docx, .txt, .zip, .dat, etc.)"
        />
      </div>
    );
  }

  // ── Source Header (for all active modes) ──────────────────────────────────

  const SourceHeader = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        Secure File Deletion
      </h2>
      <div className="flex items-center gap-2 font-mono text-xs">
        <span
          className={`px-2.5 py-1 rounded-lg border font-bold uppercase ${
            inputMode === "demo"
              ? "border-amber-400/40 bg-amber-500/10 text-amber-400"
              : inputMode === "filepath"
              ? "border-blue-400/40 bg-blue-500/10 text-blue-400"
              : "border-primary/40 bg-primary/10 text-primary"
          }`}
        >
          {sourceBadge()}
        </span>
        <button
          onClick={handleResetAll}
          className="text-text-ghost hover:text-text-primary underline text-xs cursor-pointer"
        >
          Change Source
        </button>
      </div>
    </div>
  );

  // ── Render: Complete / Results Screen ────────────────────────────────────

  if (complete) {
    const isSuccess = deletionResult?.success && deletionResult?.verified && !deletionResult?.exists_after;
    const targetName =
      (inputMode === "upload" && uploadedInfo?.name) ||
      (inputMode === "filepath" && validatedPath?.name) ||
      (inputMode === "demo" && demoData?.name) ||
      "File";
    const targetPath =
      (inputMode === "upload" && uploadedInfo?.path) ||
      (inputMode === "filepath" && validatedPath?.path) ||
      (inputMode === "demo" && demoData?.path) ||
      "";

    return (
      <div className="space-y-6">
        <SourceHeader />

        <div className={`p-6 rounded-xl border text-left space-y-6 ${
          isSuccess
            ? "bg-emerald-500/5 border-emerald-500/30"
            : "bg-destructive/5 border-destructive/30"
        }`}>
          <div className="flex items-center gap-3">
            {isSuccess ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-destructive shrink-0" />
            )}
            <div>
              <h3 className="font-display font-bold text-xl uppercase tracking-wide text-text-primary">
                {isSuccess ? "SECURE DELETION RESULT" : "DELETION VERIFICATION FAILED"}
              </h3>
              <p className="font-mono text-xs text-text-secondary mt-0.5">
                {isSuccess
                  ? "The file was physically sanitized and confirmed deleted on the filesystem."
                  : opError || "The file still exists or the operation could not be completed."}
              </p>
            </div>
          </div>

          {/* Detailed Verification Card */}
          <div className="p-4 rounded-xl bg-void border border-border font-mono text-xs space-y-2.5">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-text-ghost">File:</span>
              <span className="font-bold text-text-primary">{targetName}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-text-ghost">Path:</span>
              <span className="text-text-secondary text-[11px] max-w-md truncate" title={targetPath}>
                {targetPath}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-text-ghost">Deletion:</span>
              <span className={isSuccess ? "text-emerald-400 font-bold" : "text-destructive font-bold"}>
                {isSuccess ? "✓ Completed" : "✗ Incomplete"}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-text-ghost">File exists:</span>
              <span className={isSuccess ? "text-emerald-400 font-bold" : "text-destructive font-bold"}>
                {isSuccess ? "✗ No (Confirmed Gone)" : "✓ Yes (File Still Present)"}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="text-text-ghost">Verification:</span>
              <span className={isSuccess ? "text-emerald-400 font-bold" : "text-destructive font-bold"}>
                {isSuccess ? "✓ PASSED" : "✗ FAILED"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-ghost">Status:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isSuccess
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-destructive/20 text-destructive"
              }`}>
                {isSuccess ? "DELETED" : "FAILED"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <CyberButton variant="primary" size="sm" onClick={handleResetAll}>
              Delete Another File
            </CyberButton>
            {inputMode === "demo" && (
              <CyberButton variant="secondary" size="sm" onClick={setupDemoMode}>
                Generate Another Demo File
              </CyberButton>
            )}
          </div>
        </div>

        <TerminalWindow title="secure-deletion-audit-log">
          {logs.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-emerald-400" : l.includes("✗") ? "text-destructive" : ""}>
              {l}
            </p>
          ))}
        </TerminalWindow>
      </div>
    );
  }

  // ── Render: Running State ────────────────────────────────────────────────

  if (running) {
    return (
      <div className="space-y-4">
        <SourceHeader />
        <div>
          <div className="flex justify-between font-mono text-xs text-text-secondary mb-1">
            <span>PERFORMING MULTI-PASS OVERWRITE & FILESYSTEM VERIFICATION</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>
        <TerminalWindow title="live-execution-stream">
          {logs.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-emerald-400" : l.includes("✗") ? "text-destructive" : ""}>
              {l}
            </p>
          ))}
          <span className="animate-blink text-primary">▌</span>
        </TerminalWindow>
      </div>
    );
  }

  // ── Render: Active Mode Input Panels ─────────────────────────────────────

  const canInitiate =
    (inputMode === "upload" && uploadedInfo !== null) ||
    (inputMode === "filepath" && validatedPath !== null && validatedPath.success) ||
    (inputMode === "demo" && demoData !== null && demoData.success);

  const getTargetName = () => {
    if (inputMode === "upload") return uploadedInfo?.name ?? "Uploaded File";
    if (inputMode === "filepath") return validatedPath?.name ?? "Local File";
    if (inputMode === "demo") return demoData?.name ?? "demo_secret.txt";
    return "Target File";
  };

  const getTargetPath = () => {
    if (inputMode === "upload") return uploadedInfo?.path ?? "";
    if (inputMode === "filepath") return validatedPath?.path ?? "";
    if (inputMode === "demo") return demoData?.path ?? "";
    return "";
  };

  return (
    <div className="space-y-6">
      <SourceHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left Column: Mode Input ──────────────────────────────────────── */}
        <div className="space-y-4">

          {/* 📁 MODE 1: FILE UPLOAD */}
          {inputMode === "upload" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs font-mono space-y-1">
                  <p className="font-bold text-text-primary uppercase tracking-wide">
                    UPLOAD MODE
                  </p>
                  <p className="text-text-secondary leading-relaxed">
                    SecureDel will receive the file and store a copy in its controlled storage. Clicking Secure Delete will physically delete the uploaded copy, not the original file on your computer.
                  </p>
                </div>
              </div>

              {!uploadedInfo ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-void/50 hover:bg-primary/5 rounded-xl p-8 text-center transition-all cursor-pointer group"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.onchange = (e: any) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-8 h-8 text-primary/60 group-hover:text-primary group-hover:scale-110 transition-all mx-auto mb-3" />
                  <p className="font-mono text-sm text-text-primary font-bold tracking-wide">
                    {isUploading ? "UPLOADING TO SECURE STORAGE..." : "DROP FILE HERE or CLICK TO UPLOAD"}
                  </p>
                  <p className="font-mono text-xs text-text-ghost mt-1">
                    Select a copy of any file to test secure sanitization
                  </p>
                  {isUploading && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-primary font-mono text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to SecureDel storage...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-void border border-primary/30 space-y-3 font-mono text-xs shadow-inner">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> FILE UPLOADED TO STORAGE
                    </span>
                    <button
                      onClick={() => { setUploadedInfo(null); setUploadFileObj(null); }}
                      className="text-text-ghost hover:text-destructive text-xs"
                      title="Remove and pick another"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <span className="text-text-ghost">Filename:</span>
                    <span className="text-text-primary font-bold truncate">{uploadedInfo.name}</span>
                    <span className="text-text-ghost">Size:</span>
                    <span className="text-primary">{formatBytes(uploadedInfo.size)}</span>
                    <span className="text-text-ghost">Upload ID:</span>
                    <span className="text-text-secondary truncate">{uploadedInfo.upload_id}</span>
                    <span className="text-text-ghost">Status:</span>
                    <span className="text-emerald-400 font-bold">READY FOR DELETION</span>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* 📍 MODE 2: FILE PATH */}
          {inputMode === "filepath" && (
            <div className="p-5 rounded-xl border border-blue-500/40 bg-surface space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-bold uppercase">
                <MapPin className="w-4 h-4" /> Local Filesystem Path
              </div>

              <FilePathSelector
                label="Enter the full path of an existing file:"
                helper="SecureDel will check existence and execute the deletion directly on that physical path."
                placeholder="C:\SecureDel\demo-files\demo_secret.txt"
                defaultPath="C:\SecureDel\demo-files\demo_secret.txt"
                toolId="file-wiper"
                onPathValidated={(res) => setValidatedPath(res)}
                onClear={() => setValidatedPath(null)}
              />
            </div>
          )}

          {/* 🧪 MODE 3: GENERATE DEMO */}
          {inputMode === "demo" && (
            <div className="p-5 rounded-xl border border-amber-500/40 bg-surface space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-amber-400 font-bold uppercase flex items-center gap-2">
                  <TestTube className="w-4 h-4" /> 🧪 Physical Demo File Queued
                </p>
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 font-mono text-[10px] font-bold">
                  REAL FILE
                </span>
              </div>

              {isGeneratingDemo ? (
                <div className="p-6 text-center space-y-2 font-mono text-xs text-amber-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                  <p>Writing demo_secret.txt to physical disk...</p>
                </div>
              ) : demoData ? (
                <div className="p-3 rounded-lg bg-void border border-border font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-ghost">Filename:</span>
                    <span className="font-bold text-text-primary">{demoData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-ghost">Size:</span>
                    <span className="text-primary">{demoData.size} bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-ghost">Path:</span>
                    <span className="text-amber-400 text-[11px] truncate max-w-[200px]" title={demoData.path}>
                      {demoData.path}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-ghost">Status:</span>
                    <span className="text-emerald-400 font-bold">{demoData.status}</span>
                  </div>
                </div>
              ) : (
                demoError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono">
                    {demoError}
                  </div>
                )
              )}

              <CyberButton
                variant="ghost"
                size="sm"
                className="w-full text-amber-400 hover:bg-amber-500/10 text-xs font-mono"
                onClick={setupDemoMode}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Re-generate Demo File
              </CyberButton>
            </div>
          )}
        </div>

        {/* ── Right Column: Algorithm Selection & Actions ───────────────────── */}
        <div className="space-y-4">
          <span className="font-mono text-xs text-text-ghost tracking-widest uppercase block">
            // Sanitization Algorithm
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {algorithms.map((a) => (
              <button
                key={a.id}
                onClick={() => setAlgo(a.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  algo === a.id
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-surface hover:border-border/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-text-primary">{a.name}</span>
                  {a.passes > 0 && (
                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {a.passes}x
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-ghost mt-1">{a.desc}</p>
              </button>
            ))}
          </div>

          {algo === "custom" && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-text-ghost">Passes:</span>
              <input
                type="number"
                min={1}
                max={35}
                value={customPasses}
                onChange={(e) => setCustomPasses(Math.max(1, Math.min(35, +e.target.value)))}
                className="w-20 h-9 px-3 bg-surface-2 border border-border rounded-lg font-mono text-sm text-text-primary focus:border-primary/40 outline-none"
              />
            </div>
          )}

          <div className="pt-2">
            <CyberButton
              variant="danger"
              size="lg"
              className="w-full"
              disabled={!canInitiate || running}
              onClick={() => setConfirmOpen(true)}
            >
              <Shield className="w-4 h-4 mr-2" />
              Secure Delete
            </CyberButton>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <ConfirmDeleteDialog
          targetName={getTargetName()}
          targetPath={getTargetPath()}
          isRealPath={inputMode === "filepath" || inputMode === "demo"}
          onConfirm={executeSecureDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
};

export default FileWiper;