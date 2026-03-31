import { useState } from "react";
import { Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";

const tempCategories = [
  { id: "office", label: "Office Temp Files", count: 234, size: "450 MB", sensitive: false },
  { id: "browser", label: "Browser Temp", count: 412, size: "1.2 GB", sensitive: true },
  { id: "ide", label: "IDE Cache", count: 89, size: "340 MB", sensitive: false },
  { id: "media", label: "Media Processing", count: 56, size: "290 MB", sensitive: true },
  { id: "system", label: "System Temp", count: 56, size: "45 MB", sensitive: false },
];

const TempFileCleaner = () => {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const scan = async () => {
    setScanning(true);
    setLogs([]);
    const addLog = (msg: string) => setLogs((p) => [...p, msg]);
    addLog("> Scanning temp directories...");
    for (const cat of tempCategories) {
      await new Promise((r) => setTimeout(r, 400));
      addLog(`> Found: ${cat.label} — ${cat.count} files (${cat.size})`);
    }
    addLog("> ✓ 847 temp files found — 2.3 GB total");
    setScanning(false);
    setScanned(true);
    setSelected(tempCategories.map((c) => c.id));
  };

  const wipe = async () => {
    setLogs([]);
    const addLog = (msg: string) => setLogs((p) => [...p, msg]);
    for (const id of selected) {
      const cat = tempCategories.find((c) => c.id === id)!;
      addLog(`> Wiping ${cat.label} (${cat.count} files)...`);
      await new Promise((r) => setTimeout(r, 500));
      addLog(`> ✓ ${cat.label} destroyed — ${cat.size} freed`);
    }
    addLog("> ✓ TEMP FILES ELIMINATED");
    setComplete(true);
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <Trash2 className="inline w-5 h-5 text-primary mr-2" />
        Temp File Eliminator
      </h2>

      {complete ? (
        <div>
          <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-text-primary uppercase">Temp Files Destroyed</h3>
          </div>
          <TerminalWindow title="wipe-log">
            {logs.map((l, i) => <p key={i} className={l.includes("✓") ? "text-primary" : ""}>{l}</p>)}
          </TerminalWindow>
        </div>
      ) : !scanned ? (
        <div className="text-center py-12">
          {scanning ? (
            <TerminalWindow title="scanning-temp">
              {logs.map((l, i) => <p key={i} className={l.includes("✓") ? "text-primary" : ""}>{l}</p>)}
              <span className="animate-blink text-primary">▌</span>
            </TerminalWindow>
          ) : (
            <>
              <p className="text-text-secondary mb-6 font-mono text-sm">Scan system temp directories for sensitive leftover files</p>
              <CyberButton onClick={scan}>Scan Temp Directories</CyberButton>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="font-mono text-xs text-warning">847 temp files — 2.3 GB total</span>
          </div>
          <div className="space-y-2 mb-6">
            {tempCategories.map((cat) => (
              <label key={cat.id} className={`flex items-center justify-between p-3 rounded-lg bg-surface border ${cat.sensitive ? "border-warning/20" : "border-border"}`} data-interactive>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selected.includes(cat.id)} onChange={() => setSelected((p) => p.includes(cat.id) ? p.filter((x) => x !== cat.id) : [...p, cat.id])} className="w-4 h-4 rounded accent-primary" />
                  <span className="text-sm text-text-primary">{cat.label}</span>
                  {cat.sensitive && <span className="text-[10px] font-mono text-warning bg-warning/10 px-1.5 py-0.5 rounded">POSSIBLY SENSITIVE</span>}
                </div>
                <div className="text-right font-mono text-xs text-text-ghost">
                  {cat.count} files • {cat.size}
                </div>
              </label>
            ))}
          </div>
          <CyberButton variant="danger" size="lg" className="w-full" onClick={wipe}>
            Wipe Selected Files
          </CyberButton>
        </>
      )}
    </div>
  );
};

export default TempFileCleaner;
