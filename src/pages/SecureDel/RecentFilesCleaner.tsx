import { useState } from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { StatusBadge } from "@/components/ui/StatusBadge";

const categories = [
  { id: "recent", label: "Recent Documents", path: "~/.recently-used.xbel", count: 247, size: "1.2 MB" },
  { id: "jumplists", label: "Jump Lists", path: "AutomaticDestinations/", count: 189, size: "12.4 MB" },
  { id: "thumbnails", label: "Thumbnail Cache", path: "thumbcache_*.db", count: 4, size: "89 MB" },
  { id: "prefetch", label: "Prefetch Data", path: "C:\\Windows\\Prefetch\\", count: 156, size: "34 MB" },
];

const RecentFilesCleaner = () => {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const scan = async () => {
    setScanning(true);
    setLogs([]);
    const addLog = (msg: string) => setLogs((p) => [...p, msg]);
    addLog("> Detecting operating system...");
    await new Promise((r) => setTimeout(r, 500));
    addLog("> OS Detected: scanning activity trails...");
    for (const cat of categories) {
      await new Promise((r) => setTimeout(r, 400));
      addLog(`> Found: ${cat.label} — ${cat.count} files (${cat.size})`);
    }
    addLog("> ✓ Scan complete — 596 activity trail files found");
    setScanning(false);
    setScanned(true);
    setSelected(categories.map((c) => c.id));
  };

  const wipe = async () => {
    setLogs([]);
    const addLog = (msg: string) => setLogs((p) => [...p, msg]);
    for (const id of selected) {
      const cat = categories.find((c) => c.id === id)!;
      addLog(`> Wiping ${cat.label}...`);
      await new Promise((r) => setTimeout(r, 600));
      addLog(`> ✓ ${cat.count} files destroyed`);
    }
    addLog("> ✓ ALL ACTIVITY TRAILS ELIMINATED");
    setComplete(true);
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <Clock className="inline w-5 h-5 text-primary mr-2" />
        Activity Trail Eliminator
      </h2>

      {complete ? (
        <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg text-text-primary uppercase">Trails Eliminated</h3>
        </div>
      ) : !scanned ? (
        <div className="text-center py-12">
          {scanning ? (
            <TerminalWindow title="scanning">
              {logs.map((l, i) => <p key={i} className={l.includes("✓") ? "text-primary" : ""}>{l}</p>)}
              <span className="animate-blink text-primary">▌</span>
            </TerminalWindow>
          ) : (
            <>
              <p className="text-text-secondary mb-6 font-mono text-sm">Scan your system for recoverable activity trails</p>
              <CyberButton onClick={scan}>Scan for Activity Trails</CyberButton>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-6">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border" data-interactive>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selected.includes(cat.id)} onChange={() => setSelected((p) => p.includes(cat.id) ? p.filter((x) => x !== cat.id) : [...p, cat.id])} className="w-4 h-4 rounded accent-primary" />
                  <div>
                    <span className="text-sm text-text-primary">{cat.label}</span>
                    <span className="text-xs text-text-ghost ml-2 font-mono">{cat.path}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-text-secondary">{cat.count} files</span>
                  <span className="text-xs font-mono text-text-ghost ml-2">{cat.size}</span>
                </div>
              </label>
            ))}
          </div>
          <CyberButton variant="danger" size="lg" className="w-full" onClick={wipe} disabled={selected.length === 0}>
            Erase All Activity Trails
          </CyberButton>
        </>
      )}

      {complete && (
        <TerminalWindow title="wipe-log" className="mt-4">
          {logs.map((l, i) => <p key={i} className={l.includes("✓") ? "text-primary" : ""}>{l}</p>)}
        </TerminalWindow>
      )}
    </div>
  );
};

export default RecentFilesCleaner;
