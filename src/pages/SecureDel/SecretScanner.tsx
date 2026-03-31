import { useState } from "react";
import { Key, AlertTriangle, FolderOpen } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";

interface SecretFinding {
  file: string;
  line: number;
  type: string;
  value: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

const mockSecrets: SecretFinding[] = [
  { file: "src/config.js", line: 12, type: "AWS Key", value: "AKIA████████████████", confidence: "HIGH" },
  { file: "src/config.js", line: 34, type: "Password", value: "MySecret████████", confidence: "HIGH" },
  { file: ".env", line: 3, type: "API Key", value: "sk-proj-████████████", confidence: "HIGH" },
  { file: ".env", line: 7, type: "Database URL", value: "postgres://████:████@", confidence: "HIGH" },
  { file: "utils/auth.ts", line: 89, type: "GitHub Token", value: "ghp_████████████████", confidence: "MEDIUM" },
  { file: "scripts/deploy.sh", line: 14, type: "SSH Key", value: "-----BEGIN RSA████", confidence: "HIGH" },
];

const SecretScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [findings, setFindings] = useState<SecretFinding[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const startScan = async () => {
    setScanning(true);
    setLogs([]);
    const addLog = (msg: string) => setLogs((p) => [...p, msg]);

    addLog("> Initializing codebase scanner...");
    await new Promise((r) => setTimeout(r, 500));
    addLog("> Scanning file tree...");
    await new Promise((r) => setTimeout(r, 700));
    addLog("> Checking entropy patterns...");
    await new Promise((r) => setTimeout(r, 600));
    addLog("> Running regex patterns: AWS, GitHub, OpenAI, Stripe...");
    await new Promise((r) => setTimeout(r, 800));
    addLog(`> ✓ Found ${mockSecrets.length} secrets in ${new Set(mockSecrets.map((s) => s.file)).size} files`);

    setFindings(mockSecrets);
    setScanning(false);
    setScanned(true);
  };

  const criticalCount = findings.filter((f) => f.confidence === "HIGH").length;

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <Key className="inline w-5 h-5 text-primary mr-2" />
        Hardcoded Secret Detector
      </h2>

      {!scanned && !scanning && (
        <div className="text-center py-12">
          <div
            className="border-2 border-dashed border-primary/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer mb-6"
            onClick={startScan}
            data-interactive
          >
            <FolderOpen className="w-8 h-8 text-primary/50 mx-auto mb-3" />
            <p className="font-mono text-sm text-text-secondary">Click to scan a project folder</p>
            <p className="font-mono text-xs text-text-ghost mt-1">Uses Directory Picker API or demo mode</p>
          </div>
          <CyberButton onClick={startScan}>Run Demo Scan</CyberButton>
        </div>
      )}

      {scanning && (
        <TerminalWindow title="secret-scanner">
          {logs.map((l, i) => <p key={i} className={l.includes("✓") ? "text-primary" : ""}>{l}</p>)}
          <span className="animate-blink text-primary">▌</span>
        </TerminalWindow>
      )}

      {scanned && (
        <div>
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span className="font-mono text-sm text-destructive uppercase tracking-wider">
              Risk Level: Critical — {criticalCount} high-confidence secrets found
            </span>
          </div>

          <div className="space-y-2 mb-6">
            {findings.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-border">
                <span className="font-mono text-xs text-primary min-w-[120px]">📄 {f.file}</span>
                <span className="font-mono text-xs text-text-ghost min-w-[50px]">L{f.line}</span>
                <span className="font-mono text-xs text-text-secondary flex-1">{f.value}</span>
                <span className="text-[10px] font-mono text-warning bg-warning/10 px-1.5 py-0.5 rounded">{f.type}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  f.confidence === "HIGH" ? "text-destructive bg-destructive/10" : "text-text-ghost bg-surface-2"
                }`}>
                  {f.confidence}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <CyberButton variant="danger">Redact All Secrets</CyberButton>
            <CyberButton variant="secondary">Generate .gitignore</CyberButton>
            <CyberButton variant="secondary">Export Report</CyberButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretScanner;
