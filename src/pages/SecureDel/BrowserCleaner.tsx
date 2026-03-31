import { useState } from "react";
import { motion } from "framer-motion";
import { Chrome, Globe, Shield, CheckCircle2 } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";

const browsers = [
  { id: "chrome", name: "Google Chrome", icon: Chrome, path: "~/.config/google-chrome/" },
  { id: "firefox", name: "Firefox", icon: Globe, path: "~/.mozilla/firefox/" },
  { id: "edge", name: "Microsoft Edge", icon: Globe, path: "~/.config/microsoft-edge/" },
  { id: "brave", name: "Brave", icon: Shield, path: "~/.config/BraveSoftware/" },
];

const targets = [
  { id: "cache", label: "Browser Cache", size: "~340 MB", checked: true },
  { id: "cookies", label: "Cookies & Session Storage", size: "~12 MB", checked: true },
  { id: "sessions", label: "Login Sessions", size: "~2 MB", checked: false },
  { id: "history", label: "Browsing History Database", size: "~45 MB", checked: true },
  { id: "autofill", label: "Autofill Data", size: "~1 MB", checked: false },
  { id: "passwords", label: "Saved Passwords (local)", size: "~200 KB", checked: false },
  { id: "downloads", label: "Download History", size: "~800 KB", checked: true },
  { id: "thumbnails", label: "Thumbnails & Favicons", size: "~28 MB", checked: true },
];

const BrowserCleaner = () => {
  const [selectedBrowser, setSelectedBrowser] = useState("chrome");
  const [selectedTargets, setSelectedTargets] = useState(
    targets.filter((t) => t.checked).map((t) => t.id)
  );
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const toggleTarget = (id: string) =>
    setSelectedTargets((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const startWipe = async () => {
    setRunning(true);
    setLogs([]);
    const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

    const browser = browsers.find((b) => b.id === selectedBrowser)!;
    addLog(`> Targeting: ${browser.name}`);
    addLog(`> Path: ${browser.path}`);

    for (const targetId of selectedTargets) {
      const target = targets.find((t) => t.id === targetId)!;
      addLog(`> Wiping ${target.label} (${target.size})...`);
      await new Promise((r) => setTimeout(r, 600));
      addLog(`> ✓ ${target.label} destroyed`);
    }

    addLog("> ✓ BROWSER DATA SECURELY WIPED");
    setRunning(false);
    setComplete(true);
  };

  if (complete) {
    return (
      <div>
        <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display font-bold text-lg text-text-primary uppercase">Browser Data Wiped</h2>
        </div>
        <TerminalWindow title="wipe-log">
          {logs.map((l, i) => <p key={i} className={l.includes("✓") ? "text-primary" : ""}>{l}</p>)}
        </TerminalWindow>
        <CyberButton className="mt-4" onClick={() => { setComplete(false); setLogs([]); }}>Run Again</CyberButton>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <Chrome className="inline w-5 h-5 text-primary mr-2" />
        Browser Cache Cleaner
      </h2>

      {running ? (
        <TerminalWindow title="wiping">
          {logs.map((l, i) => <p key={i} className={l.includes("✓") ? "text-primary" : ""}>{l}</p>)}
          <span className="animate-blink text-primary">▌</span>
        </TerminalWindow>
      ) : (
        <>
          <span className="font-mono text-xs text-text-ghost tracking-widest uppercase block mb-3">// Select Browser</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
            {browsers.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBrowser(b.id)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  selectedBrowser === b.id ? "border-primary/40 bg-primary/5" : "border-border bg-surface"
                }`}
                data-interactive
              >
                <b.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                <span className="text-xs font-mono text-text-primary">{b.name}</span>
              </button>
            ))}
          </div>

          <span className="font-mono text-xs text-text-ghost tracking-widest uppercase block mb-3">// Targets</span>
          <div className="space-y-2 mb-8">
            {targets.map((t) => (
              <label
                key={t.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border hover:border-border/60 cursor-pointer"
                data-interactive
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTargets.includes(t.id)}
                    onChange={() => toggleTarget(t.id)}
                    className="w-4 h-4 rounded border-border bg-void accent-primary"
                  />
                  <span className="text-sm text-text-primary">{t.label}</span>
                </div>
                <span className="text-xs font-mono text-text-ghost">{t.size}</span>
              </label>
            ))}
          </div>

          <CyberButton variant="danger" size="lg" className="w-full" disabled={selectedTargets.length === 0} onClick={startWipe}>
            Secure Wipe Browser Data
          </CyberButton>
        </>
      )}
    </div>
  );
};

export default BrowserCleaner;
