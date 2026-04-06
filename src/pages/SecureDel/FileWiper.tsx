import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Shield, X, CheckCircle2, Download } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { API_BASE, apiPost, logClientRun, subscribeRunEvents, ToolProgressEvent } from "@/lib/api";

const algorithms = [
  { id: "dod", name: "DOD 5220.22-M", passes: 7, desc: "US DoD standard multi-pass overwrite" },
  { id: "gutmann", name: "Gutmann Method", passes: 35, desc: "Maximum forensic protection" },
  { id: "prng", name: "PRNG Stream", passes: 3, desc: "Cryptographic random overwrite" },
  { id: "zero", name: "Zero Fill", passes: 1, desc: "Single-pass zeroing" },
  { id: "random", name: "Random Fill", passes: 1, desc: "Single-pass random data" },
  { id: "custom", name: "Custom N-Pass", passes: 0, desc: "User-defined pass count" },
];

async function sha256hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getPassPattern(pass: number, algoId: string): { label: string; fill: (buf: Uint8Array) => void } {
  if (algoId === "zero") return { label: "0x00 (zero fill)", fill: (b) => b.fill(0x00) };
  if (algoId === "random" || algoId === "prng")
    return { label: "RANDOM (CSPRNG)", fill: (b) => crypto.getRandomValues(b) };

  const gutmannPatterns: Array<{ label: string; fill: (b: Uint8Array) => void }> = [
    { label: "0x55 (alternating)", fill: (b) => b.fill(0x55) },
    { label: "0xAA (alternating)", fill: (b) => b.fill(0xaa) },
    { label: "0x92 0x49 0x24", fill: (b) => { for (let i = 0; i < b.length; i++) b[i] = [0x92, 0x49, 0x24][i % 3]; } },
    { label: "0x49 0x24 0x92", fill: (b) => { for (let i = 0; i < b.length; i++) b[i] = [0x49, 0x24, 0x92][i % 3]; } },
    { label: "0x24 0x92 0x49", fill: (b) => { for (let i = 0; i < b.length; i++) b[i] = [0x24, 0x92, 0x49][i % 3]; } },
    { label: "0x00 (zero)", fill: (b) => b.fill(0x00) },
    { label: "0x11 pattern", fill: (b) => b.fill(0x11) },
    { label: "0x22 pattern", fill: (b) => b.fill(0x22) },
    { label: "0x33 pattern", fill: (b) => b.fill(0x33) },
    { label: "0x44 pattern", fill: (b) => b.fill(0x44) },
    { label: "0x55 pattern", fill: (b) => b.fill(0x55) },
    { label: "0x66 pattern", fill: (b) => b.fill(0x66) },
    { label: "0x77 pattern", fill: (b) => b.fill(0x77) },
    { label: "0x88 pattern", fill: (b) => b.fill(0x88) },
    { label: "0x99 pattern", fill: (b) => b.fill(0x99) },
    { label: "0xAA pattern", fill: (b) => b.fill(0xaa) },
    { label: "0xBB pattern", fill: (b) => b.fill(0xbb) },
    { label: "0xCC pattern", fill: (b) => b.fill(0xcc) },
    { label: "0xDD pattern", fill: (b) => b.fill(0xdd) },
    { label: "0xEE pattern", fill: (b) => b.fill(0xee) },
    { label: "0xFF pattern", fill: (b) => b.fill(0xff) },
    { label: "RANDOM", fill: (b) => crypto.getRandomValues(b) },
    { label: "RANDOM", fill: (b) => crypto.getRandomValues(b) },
    { label: "RANDOM", fill: (b) => crypto.getRandomValues(b) },
    { label: "RANDOM", fill: (b) => crypto.getRandomValues(b) },
    { label: "0x92 0x49 0x24", fill: (b) => { for (let i = 0; i < b.length; i++) b[i] = [0x92, 0x49, 0x24][i % 3]; } },
    { label: "0x49 0x24 0x92", fill: (b) => { for (let i = 0; i < b.length; i++) b[i] = [0x49, 0x24, 0x92][i % 3]; } },
    { label: "0x24 0x92 0x49", fill: (b) => { for (let i = 0; i < b.length; i++) b[i] = [0x24, 0x92, 0x49][i % 3]; } },
    { label: "0x6D 0xB6 0xDB", fill: (b) => { for (let i = 0; i < b.length; i++) b[i] = [0x6d, 0xb6, 0xdb][i % 3]; } },
    { label: "0xB6 0xDB 0x6D", fill: (b) => { for (let i = 0; i < b.length; i++) b[i] = [0xb6, 0xdb, 0x6d][i % 3]; } },
    { label: "0xDB 0x6D 0xB6", fill: (b) => { for (let i = 0; i < b.length; i++) b[i] = [0xdb, 0x6d, 0xb6][i % 3]; } },
    { label: "0x00 (final zero)", fill: (b) => b.fill(0x00) },
    { label: "0xFF (final)", fill: (b) => b.fill(0xff) },
    { label: "RANDOM (final)", fill: (b) => crypto.getRandomValues(b) },
  ];

  if (algoId === "gutmann") return gutmannPatterns[(pass - 1) % gutmannPatterns.length];

  const dodPatterns = [
    { label: "0x00 (zero pass)", fill: (b: Uint8Array) => b.fill(0x00) },
    { label: "0xFF (ones pass)", fill: (b: Uint8Array) => b.fill(0xff) },
    { label: "RANDOM (CSPRNG)", fill: (b: Uint8Array) => crypto.getRandomValues(b) },
    { label: "0x00 (zero pass)", fill: (b: Uint8Array) => b.fill(0x00) },
    { label: "0xFF (ones pass)", fill: (b: Uint8Array) => b.fill(0xff) },
    { label: "RANDOM (CSPRNG)", fill: (b: Uint8Array) => crypto.getRandomValues(b) },
    { label: "RANDOM (final verify)", fill: (b: Uint8Array) => crypto.getRandomValues(b) },
  ];
  return dodPatterns[(pass - 1) % dodPatterns.length];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface WipedFile {
  name: string;
  size: number;
  originalHash: string;
  finalHash: string;
  blob: Blob;
  backendResult?: any; // stores response from FastAPI backend
}

const FileWiper = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [algo, setAlgo] = useState("dod");
  const [customPasses, setCustomPasses] = useState(3);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [wipedFiles, setWipedFiles] = useState<WipedFile[]>([]);
  const [backendEnabled, setBackendEnabled] = useState(false); // toggle backend wipe
  const [filePath, setFilePath] = useState(""); // manual path for backend wipe

  const selectedAlgo = algorithms.find((a) => a.id === algo)!;
  const passes = algo === "custom" ? customPasses : selectedAlgo.passes;
  const isLocalFastApi = /^http:\/\/(localhost|127\.0\.0\.1):8000$/i.test(API_BASE);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  }, []);

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  // Map algo id to pass count for backend
  const getBackendPasses = () => {
    if (algo === "gutmann") return 35;
    if (algo === "dod") return 7;
    if (algo === "custom") return customPasses;
    return passes;
  };

  const startWipe = async () => {
    setRunning(true);
    setLogs([]);
    setProgress(0);
    setComplete(false);
    setWipedFiles([]);

    const results: WipedFile[] = [];
    const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);
    const ts = () => new Date().toISOString().slice(11, 23);

    addLog(`> [${ts()}] Initializing secure wipe protocol...`);
    addLog(`> [${ts()}] Algorithm: ${selectedAlgo.name} (${passes}-pass)`);
    addLog(`> [${ts()}] Files queued: ${files.length}`);

    // ── Backend path wipe (real OS-level deletion via FastAPI) ──
    if (backendEnabled && filePath.trim() && isLocalFastApi) {
      const requestId = crypto.randomUUID();
      const onProgress = (progress: ToolProgressEvent) => {
        if (progress.tool_id !== "file-wiper") return;
        if (progress.request_id !== requestId) return;

        const details = progress.details as Record<string, any>;
        if (progress.stage === "run_start") {
          addLog(`> [${ts()}] Backend run started: ${details.files_total ?? 0} file(s), ${details.passes ?? 0} pass(es)`);
        } else if (progress.stage === "file_start") {
          addLog(`> [${ts()}] Backend file start: ${details.path}`);
        } else if (progress.stage === "pass_start") {
          addLog(`> [${ts()}] Backend pass ${details.pass_index}/${details.passes_total} — pattern ${details.pattern}`);
        } else if (progress.stage === "pass_complete") {
          addLog(`> [${ts()}] Backend pass ${details.pass_index}/${details.passes_total} complete (${details.percent}%)`);
        } else if (progress.stage === "file_complete") {
          addLog(`> [${ts()}] Backend file complete: ${details.path}`);
        } else if (progress.stage === "file_error") {
          addLog(`> [${ts()}] ✗ Backend file error: ${details.error}`);
        } else if (progress.stage === "run_complete") {
          addLog(`> [${ts()}] Backend run complete: ${details.succeeded}/${details.files_total} succeeded`);
        }
      };

      const unsubscribeProgress = subscribeRunEvents({ onProgress });

      addLog(`> [${ts()}] Sending to backend for OS-level secure deletion...`);
      addLog(`> [${ts()}] Target path: ${filePath.trim()}`);
      try {
        const backendResult = await apiPost("/api/delete/wipe", {
          paths: [filePath.trim()],
          passes: getBackendPasses(),
          verify: true,
          remove_metadata: true,
          request_id: requestId,
        });
        addLog(`> [${ts()}] Backend response received`);
        const r = backendResult?.results?.[0];
        if (r?.success) {
          addLog(`> [${ts()}] ✓ OS-level wipe succeeded`);
          addLog(`> [${ts()}] Passes done: ${r.passes_done}`);
          addLog(`> [${ts()}] Original size: ${r.original_size} bytes`);
          if (r.sha256_before) addLog(`> [${ts()}] SHA-256 before: ${r.sha256_before.slice(0, 32)}...`);
          if (r.sha256_after) addLog(`> [${ts()}] SHA-256 after:  ${r.sha256_after.slice(0, 32)}...`);
        } else {
          addLog(`> [${ts()}] ✗ Backend wipe failed: ${r?.error ?? "unknown error"}`);
        }
      } catch (err: any) {
        addLog(`> [${ts()}] ✗ Backend unreachable: ${err?.message ?? err}`);
        addLog(`> [${ts()}] Continuing with browser-side wipe only...`);
      } finally {
        unsubscribeProgress();
      }
    } else if (backendEnabled && filePath.trim() && !isLocalFastApi) {
      addLog(`> [${ts()}] Skipping OS-level path wipe in hosted mode.`);
      addLog(`> [${ts()}] API target is ${API_BASE}`);
      addLog(`> [${ts()}] Hosted backend cannot access files on your local disk path.`);
      addLog(`> [${ts()}] Continuing with browser-side wipe only...`);
    }

    // ── Browser-side wipe (works on uploaded File objects) ──
    for (let fi = 0; fi < files.length; fi++) {
      const file = files[fi];
      addLog(`>`);
      addLog(`> ── FILE ${fi + 1}/${files.length}: ${file.name} ──`);
      addLog(`> [${ts()}] Size: ${formatSize(file.size)}`);
      addLog(`> [${ts()}] Type: ${file.type || "application/octet-stream"}`);

      const originalBuffer = await file.arrayBuffer();
      const originalHash = await sha256hex(originalBuffer);
      addLog(`> [${ts()}] SHA-256 (original): ${originalHash.slice(0, 32)}...`);

      const workingBuffer = originalBuffer.slice(0);
      const workingView = new Uint8Array(workingBuffer);

      for (let p = 1; p <= passes; p++) {
        const pattern = getPassPattern(p, algo);
        addLog(`> [${ts()}] Pass ${p}/${passes}: ${pattern.label}`);

        const chunkSize = Math.max(65536, Math.ceil(workingView.length / 20));
        let processed = 0;
        while (processed < workingView.length) {
          const chunk = workingView.subarray(processed, Math.min(processed + chunkSize, workingView.length));
          pattern.fill(chunk);
          processed += chunk.length;
          const fileProgress = (fi / files.length + (((p - 1) / passes + (processed / workingView.length) / passes) / files.length));
          setProgress(fileProgress * 100);
          await new Promise((r) => setTimeout(r, 8));
        }

        const passHash = await sha256hex(workingBuffer);
        addLog(`> [${ts()}] Pass ${p} SHA-256: ${passHash.slice(0, 32)}... ✓`);
      }

      const finalHash = await sha256hex(workingBuffer);
      addLog(`> [${ts()}] Final SHA-256: ${finalHash.slice(0, 32)}...`);
      addLog(`> [${ts()}] Original: ${originalHash.slice(0, 16)}...`);
      addLog(`> [${ts()}] Hashes differ: ${originalHash !== finalHash ? "YES — data overwritten ✓" : "NO — same content"}`);
      addLog(`> [${ts()}] ✓ ${file.name} — OVERWRITE COMPLETE`);

      const finalBlob = new Blob([workingBuffer], { type: "application/octet-stream" });
      results.push({ name: file.name, size: file.size, originalHash, finalHash, blob: finalBlob });
    }

    setProgress(100);
    addLog(`>`);
    addLog(`> ══════════════════════════════`);
    addLog(`> ✓ ALL ${files.length} FILE(S) OVERWRITTEN`);
    addLog(`> Overwritten copies ready for download.`);
    addLog(`> Replace your originals with these to complete the wipe.`);
    logClientRun({
      toolId: "file-wiper",
      action: "browser_wipe_complete",
      status: "success",
      details: {
        files: files.length,
        passes,
        algorithm: selectedAlgo.id,
        backendEnabled,
      },
    });
    setWipedFiles(results);
    setRunning(false);
    setComplete(true);
  };

  const downloadFile = (wf: WipedFile) => {
    const url = URL.createObjectURL(wf.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wiped_${wf.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (complete) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl text-text-primary uppercase mb-2">
            Overwrite Complete
          </h2>
          <p className="text-sm text-text-secondary font-mono">
            {files.length} file(s) overwritten • {passes} passes • {selectedAlgo.name}
          </p>
          <p className="text-xs text-text-ghost font-mono mt-1">
            Download the wiped copies below and replace your originals to complete destruction.
          </p>
        </motion.div>

        <div className="space-y-2 mb-6">
          {wipedFiles.map((wf, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-primary/20">
              <div>
                <p className="font-mono text-sm text-text-primary">{wf.name}</p>
                <p className="font-mono text-xs text-text-ghost">
                  {formatSize(wf.size)} • SHA-256: {wf.finalHash.slice(0, 24)}...
                </p>
              </div>
              <button
                onClick={() => downloadFile(wf)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs hover:bg-primary/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Wiped
              </button>
            </div>
          ))}
        </div>

        <TerminalWindow title="wipe-log">
          {logs.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-primary" : l.includes("OVERWRITTEN") ? "text-primary font-bold" : ""}>{l}</p>
          ))}
        </TerminalWindow>
        <CyberButton className="mt-6" onClick={() => { setFiles([]); setComplete(false); setLogs([]); setWipedFiles([]); setFilePath(""); }}>
          Wipe Another File
        </CyberButton>
      </div>
    );
  }

  if (running) {
    return (
      <div>
        <div className="mb-4">
          <div className="flex justify-between font-mono text-xs text-text-secondary mb-1">
            <span>WIPING IN PROGRESS</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <TerminalWindow title="live-output">
          {logs.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-primary" : l.includes("OVERWRITTEN") ? "text-primary font-bold" : ""}>{l}</p>
          ))}
          <span className="animate-blink text-primary">▌</span>
        </TerminalWindow>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
          <Shield className="inline w-5 h-5 text-primary mr-2" />
          Secure File Wiper
        </h2>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-primary/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files) setFiles((prev) => [...prev, ...Array.from(target.files!)]);
            };
            input.click();
          }}
          data-interactive
        >
          <Upload className="w-8 h-8 text-primary/50 mx-auto mb-3" />
          <p className="font-mono text-sm text-text-secondary">DROP FILES HERE or CLICK TO BROWSE</p>
          <p className="font-mono text-xs text-text-ghost mt-2">Real multi-pass overwrite using CSPRNG & fixed patterns</p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                <div>
                  <p className="text-sm text-text-primary font-mono">{f.name}</p>
                  <p className="text-xs text-text-ghost">{formatSize(f.size)} • {f.type || "octet-stream"}</p>
                </div>
                <button onClick={() => removeFile(i)} className="text-text-ghost hover:text-destructive" data-interactive>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Backend OS-level wipe section ── */}
        <div className="mt-6 p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-text-ghost uppercase tracking-widest">
              // OS-Level Backend Wipe
            </span>
            <button
              onClick={() => setBackendEnabled((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${backendEnabled ? "bg-primary" : "bg-surface-2 border border-border"}`}
              data-interactive
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${backendEnabled ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          {backendEnabled && (
            <>
              <p className="font-mono text-xs text-text-ghost mb-2">
                Enter the full file path on your machine for real OS-level deletion via the backend.
              </p>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="e.g. C:\Users\dinesh\secret.txt or /home/user/secret.txt"
                className="w-full h-10 px-3 bg-surface-2 border border-border rounded-lg font-mono text-xs text-text-primary focus:border-primary/40 outline-none placeholder:text-text-ghost"
              />
              {isLocalFastApi ? (
                <p className="font-mono text-xs text-destructive mt-2">
                  ⚠ FastAPI local mode detected ({API_BASE}). This permanently deletes the file from disk.
                </p>
              ) : (
                <p className="font-mono text-xs text-amber-400 mt-2">
                  ⚠ Hosted mode detected ({API_BASE}). Local disk path deletion is unavailable from hosted backend.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <span className="font-mono text-xs text-text-ghost tracking-widest uppercase block mb-4">
          // Wipe Algorithm
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {algorithms.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlgo(a.id)}
              className={`p-3 rounded-lg border text-left transition-all ${algo === a.id
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-surface hover:border-border/60"
                }`}
              data-interactive
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
          <div className="mb-6">
            <label className="font-mono text-xs text-text-ghost uppercase tracking-widest block mb-2">Custom Passes</label>
            <input
              type="number"
              min={1}
              max={99}
              value={customPasses}
              onChange={(e) => setCustomPasses(Number(e.target.value))}
              className="w-24 h-10 px-3 bg-surface border border-border rounded-lg font-mono text-sm text-text-primary focus:border-primary/40 outline-none"
            />
          </div>
        )}

        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 mb-6">
          <p className="font-mono text-xs text-destructive uppercase tracking-widest">
            ⚠ Overwrites file bytes with real patterns. Download the wiped copy to replace your original.
          </p>
        </div>

        <CyberButton
          variant="danger"
          size="lg"
          className="w-full"
          disabled={files.length === 0 && !(backendEnabled && filePath.trim())}
          onClick={startWipe}
        >
          Initiate Secure Wipe
        </CyberButton>
      </div>
    </div>
  );
};

export default FileWiper;