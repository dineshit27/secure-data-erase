import { useState, useEffect } from "react";
import { Clock, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { logClientProgress, logClientRun } from "@/lib/api";

interface ActivityCategory {
  id: string;
  label: string;
  path: string;
  count: number;
  size: string;
  keys: string[];
  sensitive: boolean;
  clearFn: () => Promise<number>;
}

const HISTORY_PATTERNS = [
  /visit/i, /history/i, /recent/i, /last[_-]?view/i, /last[_-]?page/i, /last[_-]?url/i,
  /navigation/i, /route/i, /breadcrumb/i, /trail/i, /activity/i, /session/i,
];

const AUTH_PATTERNS = [
  /auth/i, /token/i, /jwt/i, /refresh[_-]?token/i, /access[_-]?token/i,
  /credential/i, /user[_-]?id/i, /user[_-]?data/i, /profile/i, /login/i,
];

const PREF_PATTERNS = [
  /prefs?/i, /settings?/i, /config/i, /theme/i, /lang/i, /locale/i,
  /sidebar/i, /layout/i, /zoom/i, /font/i,
];

const FORM_PATTERNS = [
  /form/i, /draft/i, /input/i, /search[_-]?history/i, /query/i, /search[_-]?term/i,
  /autocomplete/i, /autofill/i,
];

function categorizeLocalStorageKeys(): ActivityCategory[] {
  const allKeys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) allKeys.push(k);
    }
  } catch { }

  const historyKeys = allKeys.filter((k) => HISTORY_PATTERNS.some((p) => p.test(k)));
  const authKeys = allKeys.filter((k) => AUTH_PATTERNS.some((p) => p.test(k)));
  const prefKeys = allKeys.filter((k) =>
    !HISTORY_PATTERNS.some((p) => p.test(k)) &&
    !AUTH_PATTERNS.some((p) => p.test(k)) &&
    PREF_PATTERNS.some((p) => p.test(k))
  );
  const formKeys = allKeys.filter((k) =>
    !HISTORY_PATTERNS.some((p) => p.test(k)) &&
    !AUTH_PATTERNS.some((p) => p.test(k)) &&
    !PREF_PATTERNS.some((p) => p.test(k)) &&
    FORM_PATTERNS.some((p) => p.test(k))
  );
  const otherKeys = allKeys.filter(
    (k) =>
      !HISTORY_PATTERNS.some((p) => p.test(k)) &&
      !AUTH_PATTERNS.some((p) => p.test(k)) &&
      !PREF_PATTERNS.some((p) => p.test(k)) &&
      !FORM_PATTERNS.some((p) => p.test(k))
  );

  const measure = (keys: string[]) => {
    let bytes = 0;
    for (const k of keys) {
      try {
        bytes += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2;
      } catch { }
    }
    return bytes;
  };

  const fmt = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  return [
    {
      id: "history",
      label: "Navigation History",
      path: "localStorage / history keys",
      count: historyKeys.length,
      size: fmt(measure(historyKeys)),
      keys: historyKeys.slice(0, 6),
      sensitive: true,
      clearFn: async () => {
        for (const k of historyKeys) localStorage.removeItem(k);
        return historyKeys.length;
      },
    },
    {
      id: "auth",
      label: "Auth Tokens & Credentials",
      path: "localStorage / auth keys",
      count: authKeys.length,
      size: fmt(measure(authKeys)),
      keys: authKeys.slice(0, 6),
      sensitive: true,
      clearFn: async () => {
        for (const k of authKeys) localStorage.removeItem(k);
        return authKeys.length;
      },
    },
    {
      id: "forms",
      label: "Form Data & Search History",
      path: "localStorage / form keys",
      count: formKeys.length,
      size: fmt(measure(formKeys)),
      keys: formKeys.slice(0, 6),
      sensitive: true,
      clearFn: async () => {
        for (const k of formKeys) localStorage.removeItem(k);
        return formKeys.length;
      },
    },
    {
      id: "prefs",
      label: "User Preferences",
      path: "localStorage / prefs keys",
      count: prefKeys.length,
      size: fmt(measure(prefKeys)),
      keys: prefKeys.slice(0, 6),
      sensitive: false,
      clearFn: async () => {
        for (const k of prefKeys) localStorage.removeItem(k);
        return prefKeys.length;
      },
    },
    {
      id: "other",
      label: "Other localStorage Data",
      path: "localStorage / misc",
      count: otherKeys.length,
      size: fmt(measure(otherKeys)),
      keys: otherKeys.slice(0, 6),
      sensitive: false,
      clearFn: async () => {
        for (const k of otherKeys) localStorage.removeItem(k);
        return otherKeys.length;
      },
    },
  ];
}

async function buildCategories(): Promise<ActivityCategory[]> {
  const lsCats = categorizeLocalStorageKeys();

  let sessionKeys: string[] = [];
  let sessionBytes = 0;
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i) ?? "";
      sessionKeys.push(k);
      sessionBytes += (k.length + (sessionStorage.getItem(k)?.length ?? 0)) * 2;
    }
  } catch { }

  const fmt = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  const sessionCat: ActivityCategory = {
    id: "session",
    label: "Session Activity (current tab)",
    path: "sessionStorage",
    count: sessionKeys.length,
    size: fmt(sessionBytes),
    keys: sessionKeys.slice(0, 6),
    sensitive: true,
    clearFn: async () => {
      const n = sessionStorage.length;
      sessionStorage.clear();
      return n;
    },
  };

  return [...lsCats, sessionCat];
}

const RecentFilesCleaner = () => {
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const scan = async () => {
    setScanning(true);
    setLogs([]);
    setSelected([]);
    const addLog = (msg: string) => setLogs((p) => [...p, msg]);
    const ts = () => new Date().toISOString().slice(11, 19);

    addLog(`> [${ts()}] Scanning browser activity trails...`);
    addLog(`> [${ts()}] Origin: ${window.location.origin}`);

    const cats = await buildCategories();
    setCategories(cats);

    let total = 0;
    for (const cat of cats) {
      if (cat.count > 0) {
        addLog(`> [${ts()}] Found: ${cat.label} — ${cat.count} item(s)`);
        if (cat.keys.length > 0) {
          addLog(`>          Keys: ${cat.keys.join(", ")}${cat.count > 6 ? ` +${cat.count - 6} more` : ""}`);
        }
        total += cat.count;
      } else {
        addLog(`> [${ts()}] Clean: ${cat.label}`);
      }
    }

    addLog(`>`);
    addLog(`> [${ts()}] ✓ Scan complete — ${total} activity trail item(s) found`);
    setScanning(false);
    setScanned(true);
    setSelected(cats.filter((c) => c.count > 0 && c.sensitive).map((c) => c.id));
  };

  useEffect(() => { scan(); }, []);

  const wipe = async () => {
    setLogs([]);
    const addLog = (msg: string) => setLogs((p) => [...p, msg]);
    const ts = () => new Date().toISOString().slice(11, 19);
    const requestId = crypto.randomUUID();
    logClientProgress({
      toolId: "recent-files",
      stage: "run_start",
      endpoint: "client:activity_trails_wipe",
      requestId,
      details: { selected },
    });
    addLog(`> [${ts()}] Erasing activity trails...`);

    for (const id of selected) {
      const cat = categories.find((c) => c.id === id);
      if (!cat || cat.count === 0) continue;
      logClientProgress({
        toolId: "recent-files",
        stage: "category_start",
        endpoint: "client:activity_trails_wipe",
        requestId,
        details: { category: cat.label, id },
      });
      addLog(`> [${ts()}] Wiping: ${cat.label}...`);
      try {
        const n = await cat.clearFn();
        addLog(`> [${ts()}] ✓ ${cat.label} — ${n} item(s) destroyed`);
        logClientProgress({
          toolId: "recent-files",
          stage: "category_complete",
          endpoint: "client:activity_trails_wipe",
          requestId,
          details: { category: cat.label, id, wiped: n },
        });
      } catch (err) {
        addLog(`> [${ts()}] ERROR: ${cat.label} — ${err}`);
        logClientProgress({
          toolId: "recent-files",
          stage: "category_complete",
          endpoint: "client:activity_trails_wipe",
          requestId,
          status: "error",
          details: { category: cat.label, id, error: String(err) },
        });
      }
    }

    addLog(`>`);
    addLog(`> [${ts()}] ✓ ACTIVITY TRAILS ELIMINATED`);
    logClientProgress({
      toolId: "recent-files",
      stage: "run_complete",
      endpoint: "client:activity_trails_wipe",
      requestId,
      status: "success",
      details: { selected },
    });
    logClientRun({
      toolId: "recent-files",
      action: "activity_trails_wipe",
      status: "success",
      details: {
        selectedCategories: selected,
      },
    });
    setComplete(true);
  };

  const totalItems = categories.reduce((s, c) => s + c.count, 0);

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <Clock className="inline w-5 h-5 text-primary mr-2" />
        Activity Trail Eliminator
      </h2>

      {complete ? (
        <div>
          <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-text-primary uppercase">Trails Eliminated</h3>
            <p className="font-mono text-xs text-text-ghost mt-1">All selected activity data wiped from browser storage</p>
          </div>
          <TerminalWindow title="wipe-log" className="mt-4">
            {logs.map((l, i) => (
              <p key={i} className={l.includes("✓") ? "text-primary" : l.includes("ERROR") ? "text-destructive" : ""}>{l}</p>
            ))}
          </TerminalWindow>
          <CyberButton className="mt-4" onClick={() => { setComplete(false); setScanned(false); scan(); }}>
            Scan Again
          </CyberButton>
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
              <RefreshCw className="w-8 h-8 text-primary/50 mx-auto mb-3 animate-spin" />
              <p className="text-text-secondary mb-6 font-mono text-sm">Scanning browser activity trails...</p>
            </>
          )}
        </div>
      ) : (
        <>
          {totalItems > 0 ? (
            <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="font-mono text-xs text-warning">{totalItems} activity trail item(s) found in browser storage</span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-primary">No activity trails detected — storage is clean</span>
            </div>
          )}

          <div className="space-y-2 mb-6">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className={`flex items-start justify-between p-3 rounded-lg bg-surface border ${cat.count === 0 ? "opacity-50 border-border/30" : cat.sensitive ? "border-warning/20 cursor-pointer" : "border-border cursor-pointer"
                  }`}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-text-primary">{cat.label}</span>
                      <span className="text-xs text-text-ghost font-mono">{cat.path}</span>
                      {cat.sensitive && cat.count > 0 && (
                        <span className="text-[10px] font-mono text-warning bg-warning/10 px-1.5 py-0.5 rounded">SENSITIVE</span>
                      )}
                    </div>
                    {cat.keys.length > 0 && (
                      <p className="text-[10px] font-mono text-text-ghost mt-0.5 truncate max-w-[280px]">
                        {cat.keys.join(", ")}{cat.count > 6 ? ` +${cat.count - 6} more` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right ml-3 whitespace-nowrap">
                  <span className="text-xs font-mono text-text-secondary">{cat.count} items</span>
                  <span className="text-xs font-mono text-text-ghost ml-2">{cat.size}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <CyberButton
              variant="danger"
              size="lg"
              className="flex-1"
              onClick={wipe}
              disabled={selected.length === 0 || totalItems === 0}
            >
              Erase Selected Activity Trails
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

export default RecentFilesCleaner;
