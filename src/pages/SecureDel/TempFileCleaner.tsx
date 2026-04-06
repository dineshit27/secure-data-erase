import { useState, useEffect } from "react";
import { Trash2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { logClientProgress, logClientRun } from "@/lib/api";

interface StorageCategory {
  id: string;
  label: string;
  description: string;
  count: number;
  sizeBytes: number;
  sensitive: boolean;
  items: string[];
  clearFn: () => Promise<number>;
}

function formatBytes(n: number): string {
  if (n <= 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function measureLocalStorage(): { count: number; bytes: number; keys: string[] } {
  try {
    const keys: string[] = [];
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? "";
      const val = localStorage.getItem(key) ?? "";
      bytes += (key.length + val.length) * 2;
      keys.push(key);
    }
    return { count: localStorage.length, bytes, keys };
  } catch {
    return { count: 0, bytes: 0, keys: [] };
  }
}

function measureSessionStorage(): { count: number; bytes: number; keys: string[] } {
  try {
    const keys: string[] = [];
    let bytes = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i) ?? "";
      const val = sessionStorage.getItem(key) ?? "";
      bytes += (key.length + val.length) * 2;
      keys.push(key);
    }
    return { count: sessionStorage.length, bytes, keys };
  } catch {
    return { count: 0, bytes: 0, keys: [] };
  }
}

async function measureCaches(): Promise<{ count: number; names: string[] }> {
  try {
    const names = await caches.keys();
    return { count: names.length, names };
  } catch {
    return { count: 0, names: [] };
  }
}

async function measureIndexedDB(): Promise<{ count: number; names: string[] }> {
  try {
    const dbs = await indexedDB.databases();
    const names = dbs.map((d) => d.name ?? "unknown").filter(Boolean);
    return { count: names.length, names };
  } catch {
    return { count: 0, names: [] };
  }
}

async function buildCategories(): Promise<StorageCategory[]> {
  const ls = measureLocalStorage();
  const ss = measureSessionStorage();
  const cacheInfo = await measureCaches();
  const idbInfo = await measureIndexedDB();

  let estimatedUsage = 0;
  try {
    const est = await navigator.storage.estimate();
    estimatedUsage = est.usage ?? 0;
  } catch { }

  const cacheBytes = Math.max(0, estimatedUsage - ls.bytes - ss.bytes);

  return [
    {
      id: "localstorage",
      label: "Local Storage",
      description: "Persistent key-value data stored in browser",
      count: ls.count,
      sizeBytes: ls.bytes,
      sensitive: true,
      items: ls.keys.slice(0, 5),
      clearFn: async () => {
        const n = localStorage.length;
        localStorage.clear();
        return n;
      },
    },
    {
      id: "sessionstorage",
      label: "Session Storage",
      description: "Tab-scoped temporary session data",
      count: ss.count,
      sizeBytes: ss.bytes,
      sensitive: true,
      items: ss.keys.slice(0, 5),
      clearFn: async () => {
        const n = sessionStorage.length;
        sessionStorage.clear();
        return n;
      },
    },
    {
      id: "cacheapi",
      label: "Cache API / Service Worker Caches",
      description: "Offline/PWA cached responses",
      count: cacheInfo.count,
      sizeBytes: cacheInfo.count > 0 ? cacheBytes : 0,
      sensitive: false,
      items: cacheInfo.names.slice(0, 5),
      clearFn: async () => {
        const keys = await caches.keys();
        for (const k of keys) await caches.delete(k);
        return keys.length;
      },
    },
    {
      id: "indexeddb",
      label: "IndexedDB Databases",
      description: "Structured browser-side databases",
      count: idbInfo.count,
      sizeBytes: 0,
      sensitive: true,
      items: idbInfo.names.slice(0, 5),
      clearFn: async () => {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) {
            await new Promise<void>((resolve) => {
              const req = indexedDB.deleteDatabase(db.name!);
              req.onsuccess = () => resolve();
              req.onerror = () => resolve();
              req.onblocked = () => resolve();
            });
          }
        }
        return dbs.length;
      },
    },
    {
      id: "cookies",
      label: "Cookies (this domain)",
      description: `All cookies for ${window.location.hostname}`,
      count: document.cookie ? document.cookie.split(";").filter((c) => c.trim()).length : 0,
      sizeBytes: document.cookie.length * 2,
      sensitive: true,
      items: document.cookie
        ? document.cookie.split(";").map((c) => c.split("=")[0].trim()).slice(0, 5)
        : [],
      clearFn: async () => {
        const cookies = document.cookie.split(";");
        let n = 0;
        for (const cookie of cookies) {
          const name = cookie.split("=")[0].trim();
          if (!name) continue;
          const domain = window.location.hostname;
          for (const path of ["/", window.location.pathname, ""]) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
          }
          n++;
        }
        return n;
      },
    },
  ];
}

const TempFileCleaner = () => {
  const [categories, setCategories] = useState<StorageCategory[]>([]);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const scan = async () => {
    setScanning(true);
    setLogs([]);
    const addLog = (msg: string) => setLogs((p) => [...p, msg]);
    const ts = () => new Date().toISOString().slice(11, 19);

    addLog(`> [${ts()}] Scanning browser storage...`);
    addLog(`> [${ts()}] Origin: ${window.location.origin}`);

    const cats = await buildCategories();
    setCategories(cats);

    let totalItems = 0;
    let totalBytes = 0;
    for (const cat of cats) {
      if (cat.count > 0) {
        addLog(`> [${ts()}] Found: ${cat.label} — ${cat.count} item(s)${cat.sizeBytes > 0 ? ` (${formatBytes(cat.sizeBytes)})` : ""}`);
        if (cat.items.length > 0) {
          addLog(`>          Keys: ${cat.items.join(", ")}${cat.count > 5 ? ` +${cat.count - 5} more` : ""}`);
        }
        totalItems += cat.count;
        totalBytes += cat.sizeBytes;
      } else {
        addLog(`> [${ts()}] Clean: ${cat.label} — empty`);
      }
    }

    addLog(`>`);
    addLog(`> [${ts()}] ✓ Scan complete — ${totalItems} item(s) across ${cats.filter((c) => c.count > 0).length} categories`);
    if (totalBytes > 0) addLog(`> [${ts()}] Total size: ${formatBytes(totalBytes)}`);

    setScanning(false);
    setScanned(true);
    setSelected(cats.filter((c) => c.count > 0).map((c) => c.id));
  };

  useEffect(() => { scan(); }, []);

  const wipe = async () => {
    setLogs([]);
    const addLog = (msg: string) => setLogs((p) => [...p, msg]);
    const ts = () => new Date().toISOString().slice(11, 19);
    const requestId = crypto.randomUUID();
    logClientProgress({
      toolId: "temp-cleaner",
      stage: "run_start",
      endpoint: "client:browser_storage_wipe",
      requestId,
      details: { selected },
    });
    addLog(`> [${ts()}] Initiating secure wipe...`);

    for (const id of selected) {
      const cat = categories.find((c) => c.id === id);
      if (!cat || cat.count === 0) continue;
      logClientProgress({
        toolId: "temp-cleaner",
        stage: "category_start",
        endpoint: "client:browser_storage_wipe",
        requestId,
        details: { category: cat.label, id },
      });
      addLog(`> [${ts()}] Wiping: ${cat.label}...`);
      try {
        const cleared = await cat.clearFn();
        addLog(`> [${ts()}] ✓ ${cat.label} — ${cleared} item(s) destroyed`);
        logClientProgress({
          toolId: "temp-cleaner",
          stage: "category_complete",
          endpoint: "client:browser_storage_wipe",
          requestId,
          details: { category: cat.label, id, wiped: cleared },
        });
      } catch (err) {
        addLog(`> [${ts()}] ERROR: ${cat.label} — ${err}`);
        logClientProgress({
          toolId: "temp-cleaner",
          stage: "category_complete",
          endpoint: "client:browser_storage_wipe",
          requestId,
          status: "error",
          details: { category: cat.label, id, error: String(err) },
        });
      }
    }

    addLog(`>`);
    addLog(`> [${ts()}] ✓ WIPE COMPLETE`);
    logClientProgress({
      toolId: "temp-cleaner",
      stage: "run_complete",
      endpoint: "client:browser_storage_wipe",
      requestId,
      status: "success",
      details: { selected },
    });
    logClientRun({
      toolId: "temp-cleaner",
      action: "browser_storage_wipe",
      status: "success",
      details: {
        selectedCategories: selected,
      },
    });
    setComplete(true);
  };

  const totalItems = categories.reduce((s, c) => s + c.count, 0);
  const totalBytes = categories.reduce((s, c) => s + c.sizeBytes, 0);

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <Trash2 className="inline w-5 h-5 text-primary mr-2" />
        Browser Storage Eliminator
      </h2>

      {complete ? (
        <div>
          <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-text-primary uppercase">Storage Destroyed</h3>
            <p className="font-mono text-xs text-text-ghost mt-1">All selected browser storage wiped</p>
          </div>
          <TerminalWindow title="wipe-log">
            {logs.map((l, i) => <p key={i} className={l.includes("✓") ? "text-primary" : l.includes("ERROR") ? "text-destructive" : ""}>{l}</p>)}
          </TerminalWindow>
          <CyberButton className="mt-4" onClick={() => { setComplete(false); setScanned(false); scan(); }}>
            Scan Again
          </CyberButton>
        </div>
      ) : !scanned ? (
        <div className="text-center py-12">
          {scanning ? (
            <TerminalWindow title="scanning-storage">
              {logs.map((l, i) => <p key={i} className={l.includes("✓") ? "text-primary" : ""}>{l}</p>)}
              <span className="animate-blink text-primary">▌</span>
            </TerminalWindow>
          ) : (
            <>
              <RefreshCw className="w-8 h-8 text-primary/50 mx-auto mb-3 animate-spin" />
              <p className="text-text-secondary mb-6 font-mono text-sm">Scanning browser storage...</p>
            </>
          )}
        </div>
      ) : (
        <>
          {totalItems > 0 ? (
            <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="font-mono text-xs text-warning">
                {totalItems} items found{totalBytes > 0 ? ` — ${formatBytes(totalBytes)}` : ""}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-primary">Browser storage is already clean</span>
            </div>
          )}

          <div className="space-y-2 mb-6">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className={`flex items-start justify-between p-3 rounded-lg bg-surface border transition-all ${cat.sensitive ? "border-warning/20" : "border-border"
                  } ${cat.count === 0 ? "opacity-50" : "cursor-pointer"}`}
                data-interactive
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(cat.id)}
                    onChange={() => cat.count > 0 && setSelected((p) =>
                      p.includes(cat.id) ? p.filter((x) => x !== cat.id) : [...p, cat.id]
                    )}
                    disabled={cat.count === 0}
                    className="w-4 h-4 mt-0.5 rounded accent-primary"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary">{cat.label}</span>
                      {cat.sensitive && cat.count > 0 && (
                        <span className="text-[10px] font-mono text-warning bg-warning/10 px-1.5 py-0.5 rounded">SENSITIVE</span>
                      )}
                    </div>
                    <p className="text-xs text-text-ghost">{cat.description}</p>
                    {cat.items.length > 0 && (
                      <p className="text-[10px] font-mono text-text-ghost mt-0.5 truncate max-w-[250px]">
                        {cat.items.join(", ")}{cat.count > 5 ? ` +${cat.count - 5} more` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-text-ghost whitespace-nowrap ml-3">
                  <div>{cat.count} item(s)</div>
                  {cat.sizeBytes > 0 && <div>{formatBytes(cat.sizeBytes)}</div>}
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <CyberButton
              variant="danger"
              size="lg"
              className="flex-1"
              disabled={selected.length === 0 || totalItems === 0}
              onClick={wipe}
            >
              Wipe Selected Storage
            </CyberButton>
            <CyberButton variant="secondary" onClick={scan}>
              <RefreshCw className="w-4 h-4" />
            </CyberButton>
          </div>
        </>
      )}
    </div>
  );
};

export default TempFileCleaner;
