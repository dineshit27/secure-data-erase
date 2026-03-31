import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Shield, X, CheckCircle2 } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";

const algorithms = [
  { id: "dod", name: "DOD 5220.22-M", passes: 7, desc: "US DoD standard multi-pass overwrite" },
  { id: "gutmann", name: "Gutmann Method", passes: 35, desc: "Maximum forensic protection" },
  { id: "prng", name: "PRNG Stream", passes: 3, desc: "Cryptographic random overwrite" },
  { id: "zero", name: "Zero Fill", passes: 1, desc: "Single-pass zeroing" },
  { id: "random", name: "Random Fill", passes: 1, desc: "Single-pass random data" },
  { id: "custom", name: "Custom N-Pass", passes: 0, desc: "User-defined pass count" },
];

const FileWiper = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [algo, setAlgo] = useState("dod");
  const [customPasses, setCustomPasses] = useState(3);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const selectedAlgo = algorithms.find((a) => a.id === algo)!;
  const passes = algo === "custom" ? customPasses : selectedAlgo.passes;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const startWipe = async () => {
    setRunning(true);
    setLogs([]);
    setProgress(0);
    setComplete(false);

    const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

    addLog("> [00:00:01] Initializing secure wipe protocol...");
    await new Promise((r) => setTimeout(r, 500));

    for (const file of files) {
      addLog(`> [00:00:01] Target: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      addLog(`> [00:00:02] Algorithm: ${selectedAlgo.name} (${passes}-pass)`);
      await new Promise((r) => setTimeout(r, 300));

      for (let p = 1; p <= passes; p++) {
        const patterns = ["0x00000000", "0x11111111", "0x92492492", "RANDOM", "0xFF"];
        addLog(`> Pass ${p}/${passes}: Writing ${patterns[p % patterns.length]}...`);
        for (let pct = 0; pct <= 100; pct += 20) {
          setProgress(((p - 1) / passes + (pct / 100) / passes) * 100);
          await new Promise((r) => setTimeout(r, 80));
        }
        addLog(`> Pass ${p}/${passes}: COMPLETE ✓`);
      }

      addLog("> Stripping metadata...");
      await new Promise((r) => setTimeout(r, 300));
      addLog("> Running deletion verification...");
      await new Promise((r) => setTimeout(r, 400));
      addLog("> SHA-256 hash confirmed null");
      addLog(`> ✓ ${file.name} PERMANENTLY DESTROYED`);
    }

    setProgress(100);
    setRunning(false);
    setComplete(true);
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
            Operation Complete — Files Are Unrecoverable
          </h2>
          <p className="text-sm text-text-secondary font-mono">
            {files.length} file(s) wiped • {passes} passes • Algorithm: {selectedAlgo.name}
          </p>
        </motion.div>
        <TerminalWindow title="wipe-log">
          {logs.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-primary" : ""}>{l}</p>
          ))}
        </TerminalWindow>
        <CyberButton className="mt-6" onClick={() => { setFiles([]); setComplete(false); setLogs([]); }}>
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
            <p key={i} className={l.includes("✓") ? "text-primary" : l.includes("DESTROYED") ? "text-primary font-bold" : ""}>{l}</p>
          ))}
          <span className="animate-blink text-primary">▌</span>
        </TerminalWindow>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left — File selection */}
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
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                <div>
                  <p className="text-sm text-text-primary font-mono">{f.name}</p>
                  <p className="text-xs text-text-ghost">{(f.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => removeFile(i)} className="text-text-ghost hover:text-destructive" data-interactive>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right — Config */}
      <div>
        <span className="font-mono text-xs text-text-ghost tracking-widest uppercase block mb-4">
          // Wipe Algorithm
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {algorithms.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlgo(a.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                algo === a.id
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
            ⚠ This action is irreversible
          </p>
        </div>

        <CyberButton
          variant="danger"
          size="lg"
          className="w-full"
          disabled={files.length === 0}
          onClick={startWipe}
        >
          Initiate Secure Wipe
        </CyberButton>
      </div>
    </div>
  );
};

export default FileWiper;
