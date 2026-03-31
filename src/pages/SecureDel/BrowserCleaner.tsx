import { useState, useEffect } from "react";
import { Chrome, Globe, Shield, CheckCircle2, RefreshCw } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";

interface StorageInfo {
  localStorageKeys: number;
  localStorageBytes: number;
  sessionStorageKeys: number;
  sessionStorageBytes: number;
  indexedDBNames: string[];
  cacheNames: string[];
  cookieCount: number;
  estimatedUsage: number;
  estimatedQuota: number;
}

async function measureStorage(): Promise<StorageInfo> {
  let localStorageKeys = 0;
  let localStorageBytes = 0;
  try {
    localStorageKeys = localStorage.length;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? "";
      const val = localStorage.getItem(key) ?? "";
      localStorageBytes += key.length + val.length;
    }
  } catch {}

  let sessionStorageKeys = 0;
  let sessionStorageBytes = 0;
  try {
    sessionStorageKeys = sessionStorage.length;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i) ?? "";
      const val = sessionStorage.getItem(key) ?? "";
      sessionStorageBytes += key.length + val.length;
    }
  } catch {}

  let indexedDBNames: string[] = [];
  try {
    const dbs = await indexedDB.databases();
    indexedDBNames = dbs.map((d) => d.name ?? "unknown").filter(Boolean);
  } catch {}

  let cacheNames: string[] = [];
  try {
    cacheNames = await caches.keys();
  } catch {}

  let cookieCount = 0;
  try {
    cookieCount = document.cookie ? document.cookie.split(";").filter((c) => c.trim()).length : 0;
  } catch {}

  let estimatedUsage = 0;
  let estimatedQuota = 0;
  try {
    const estimate = await navigator.storage.estimate();
    estimatedUsage = estimate.usage ?? 0;
    estimatedQuota = estimate.quota ?? 0;
  } catch {}

  return {
    localStorageKeys,
    localStorageBytes,
    sessionStorageKeys,
    sessionStorageBytes,
    indexedDBNames,
    cacheNames,
    cookieCount,
    estimatedUsage,
    estimatedQuota,
  };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const TARGET_IDS = ["localstorage", "sessionstorage", "indexeddb", "cache", "cookies"] as const;
type TargetId = typeof TARGET_IDS[number];

interface Target {
  id: TargetId;
  label: string;
  detail: string;
  available: boolean;
}

const BrowserCleaner = () => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<TargetId[]>([]);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const measure = async () => {
    setMeasuring(true);
    const info = await measureStorage();
    setStorageInfo(info);
    setMeasuring(false);
    const defaults: TargetId[] = [];
    if (info.localStorageKeys > 0) defaults.push("localstorage");
    if (info.sessionStorageKeys > 0) defaults.push("sessionstorage");
    if (info.indexedDBNames.length > 0) defaults.push("indexeddb");
    if (info.cacheNames.length > 0) defaults.push("cache");
    if (info.cookieCount > 0) defaults.push("cookies");
    setSelectedTargets(defaults);
  };

  useEffect(() => { measure(); }, []);

  const buildTargets = (): Target[] => {
    if (!storageInfo) return [];
    return [
      {
        id: "localstorage",
        label: "Local Storage",
        detail: `${storageInfo.localStorageKeys} keys — ${formatBytes(storageInfo.localStorageBytes * 2)}`,
        available: storageInfo.localStorageKeys > 0,
      },
      {
        id: "sessionstorage",
        label: "Session Storage",
        detail: `${storageInfo.sessionStorageKeys} keys — ${formatBytes(storageInfo.sessionStorageBytes * 2)}`,
        available: storageInfo.sessionStorageKeys > 0,
      },
      {
        id: "indexeddb",
        label: "IndexedDB Databases",
        detail: storageInfo.indexedDBNames.length > 0
          ? `${storageInfo.indexedDBNames.length} database(s): ${storageInfo.indexedDBNames.slice(0, 3).join(", ")}${storageInfo.indexedDBNames.length > 3 ? "..." : ""}`
          : "0 databases",
        available: storageInfo.indexedDBNames.length > 0,
      },
      {
        id: "cache",
        label: "Cache API / Service Worker Caches",
        detail: storageInfo.cacheNames.length > 0
          ? `${storageInfo.cacheNames.length} cache(s): ${storageInfo.cacheNames.slice(0, 3).join(", ")}${storageInfo.cacheNames.length > 3 ? "..." : ""}`
          : "0 caches",
        available: storageInfo.cacheNames.length > 0,
      },
      {
        id: "cookies",
        label: "Cookies (this domain)",
        detail: `${storageInfo.cookieCount} cookie(s) for ${window.location.hostname}`,
        available: storageInfo.cookieCount > 0,
      },
    ];
  };

  const toggleTarget = (id: TargetId) =>
    setSelectedTargets((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);

  const startWipe = async () => {
    setRunning(true);
    setLogs([]);
    const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);
    const ts = () => new Date().toISOString().slice(11, 19);

    addLog(`> [${ts()}] SecureDel Browser Storage Wiper`);
    addLog(`> [${ts()}] Targets selected: ${selectedTargets.length}`);
    addLog(`>`);

    for (const targetId of selectedTargets) {
      addLog(`> [${ts()}] Processing: ${targetId.toUpperCase()}...`);
      try {
        if (targetId === "localstorage") {
          const count = localStorage.length;
          localStorage.clear();
          addLog(`> [${ts()}] ✓ localStorage — ${count} key(s) cleared`);
        } else if (targetId === "sessionstorage") {
          const count = sessionStorage.length;
          sessionStorage.clear();
          addLog(`> [${ts()}] ✓ sessionStorage — ${count} key(s) cleared`);
        } else if (targetId === "indexeddb") {
          const dbs = await indexedDB.databases();
          for (const db of dbs) {
            if (db.name) {
              await new Promise<void>((resolve, reject) => {
                const req = indexedDB.deleteDatabase(db.name!);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
                req.onblocked = () => resolve();
              });
              addLog(`> [${ts()}]   Deleted DB: ${db.name}`);
            }
          }
          addLog(`> [${ts()}] ✓ IndexedDB — ${dbs.length} database(s) deleted`);
        } else if (targetId === "cache") {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
            addLog(`> [${ts()}]   Deleted cache: ${key}`);
          }
          addLog(`> [${ts()}] ✓ Cache API — ${keys.length} cache(s) deleted`);
        } else if (targetId === "cookies") {
          const cookies = document.cookie.split(";");
          let cleared = 0;
          for (const cookie of cookies) {
            const name = cookie.split("=")[0].trim();
            if (!name) continue;
            const domain = window.location.hostname;
            const paths = ["/", window.location.pathname, ""];
            for (const path of paths) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            }
            cleared++;
          }
          addLog(`> [${ts()}] ✓ Cookies — ${cleared} cookie(s) expired`);
        }
      } catch (err) {
        addLog(`> [${ts()}] ERROR on ${targetId}: ${err}`);
      }
    }

    const after = await measureStorage();
    addLog(`>`);
    addLog(`> [${ts()}] ══ Post-wipe verification ══`);
    addLog(`> [${ts()}] localStorage: ${after.localStorageKeys} keys remaining`);
    addLog(`> [${ts()}] sessionStorage: ${after.sessionStorageKeys} keys remaining`);
    addLog(`> [${ts()}] IndexedDB: ${after.indexedDBNames.length} databases remaining`);
    addLog(`> [${ts()}] Caches: ${after.cacheNames.length} remaining`);
    addLog(`> [${ts()}] Cookies: ${after.cookieCount} remaining`);
    addLog(`> [${ts()}] Storage used: ${formatBytes(after.estimatedUsage)}`);
    addLog(`>`);
    addLog(`> [${ts()}] ✓ BROWSER STORAGE WIPE COMPLETE`);

    setStorageInfo(after);
    setRunning(false);
    setComplete(true);
  };

  const targets = buildTargets();

  if (complete) {
    return (
      <div>
        <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display font-bold text-lg text-text-primary uppercase">Browser Storage Wiped</h2>
          <p className="font-mono text-xs text-text-ghost mt-1">Real browser APIs — verified post-wipe</p>
        </div>
        <TerminalWindow title="wipe-log">
          {logs.map((l, i) => <p key={i} className={l.includes("✓") ? "text-primary" : l.includes("ERROR") ? "text-destructive" : ""}>{l}</p>)}
        </TerminalWindow>
        <CyberButton className="mt-4" onClick={() => { setComplete(false); setLogs([]); measure(); }}>
          Run Again
        </CyberButton>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <Chrome className="inline w-5 h-5 text-primary mr-2" />
        Browser Storage Cleaner
      </h2>

      {measuring ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-primary/50 mx-auto mb-3 animate-spin" />
          <p className="font-mono text-sm text-text-secondary">Measuring browser storage...</p>
        </div>
      ) : running ? (
        <TerminalWindow title="wiping">
          {logs.map((l, i) => (
            <p key={i} className={l.includes("✓") ? "text-primary" : l.includes("ERROR") ? "text-destructive" : ""}>{l}</p>
          ))}
          <span className="animate-blink text-primary">▌</span>
        </TerminalWindow>
      ) : (
        <>
          {storageInfo && (
            <div className="p-3 rounded-lg bg-surface-2 border border-border mb-6 font-mono text-xs text-text-secondary">
              <span className="text-text-ghost">Storage used: </span>
              <span className="text-primary">{formatBytes(storageInfo.estimatedUsage)}</span>
              <span className="text-text-ghost"> / quota: </span>
              <span>{formatBytes(storageInfo.estimatedQuota)}</span>
              <button onClick={measure} className="ml-3 text-primary/60 hover:text-primary inline-flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> refresh
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-primary/60" />
            <span className="font-mono text-xs text-text-ghost">
              Cleaning storage for: <span className="text-text-secondary">{window.location.hostname}</span>
            </span>
          </div>

          <span className="font-mono text-xs text-text-ghost tracking-widest uppercase block mb-3">
            // Storage Targets (live measurements)
          </span>
          <div className="space-y-2 mb-8">
            {targets.map((t) => (
              <label
                key={t.id}
                className={`flex items-center justify-between p-3 rounded-lg bg-surface border cursor-pointer transition-all ${
                  t.available ? "border-border hover:border-border/60" : "border-border/30 opacity-50"
                }`}
                data-interactive
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTargets.includes(t.id)}
                    onChange={() => t.available && toggleTarget(t.id)}
                    disabled={!t.available}
                    className="w-4 h-4 rounded border-border bg-void accent-primary"
                  />
                  <div>
                    <span className="text-sm text-text-primary">{t.label}</span>
                    {!t.available && (
                      <span className="ml-2 text-[10px] font-mono text-text-ghost">(empty)</span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-mono text-text-ghost text-right max-w-[200px] truncate">{t.detail}</span>
              </label>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 mb-6">
            <p className="font-mono text-xs text-warning">
              ⚠ This clears real browser storage for <strong>{window.location.hostname}</strong>. Clearing localStorage may log you out.
            </p>
          </div>

          <CyberButton
            variant="danger"
            size="lg"
            className="w-full"
            disabled={selectedTargets.length === 0}
            onClick={startWipe}
          >
            Wipe Selected Storage
          </CyberButton>
        </>
      )}
    </div>
  );
};

export default BrowserCleaner;
