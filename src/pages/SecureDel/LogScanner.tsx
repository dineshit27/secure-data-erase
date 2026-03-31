import { useState, useCallback } from "react";
import { FileText, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";

interface Finding {
  line: number;
  content: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

const mockFindings: Record<string, Finding[]> = {
  "app.log": [
    { line: 145, content: 'User login: admin password=████████████', type: "Password", severity: "CRITICAL" },
    { line: 892, content: 'API call with token=sk-proj-████████', type: "API Key", severity: "CRITICAL" },
    { line: 1204, content: 'Email sent to user@████████.com', type: "Email", severity: "MEDIUM" },
  ],
  "access.log": [
    { line: 34, content: 'Bearer eyJhbG████████████████', type: "JWT Token", severity: "HIGH" },
    { line: 567, content: 'Connection from 192.168.1.████', type: "IP Address", severity: "MEDIUM" },
  ],
};

const severityColor = {
  CRITICAL: "text-destructive bg-destructive/10 border-destructive/30",
  HIGH: "text-warning bg-warning/10 border-warning/30",
  MEDIUM: "text-text-secondary bg-surface-2 border-border",
};

const LogScanner = () => {
  const [file, setFile] = useState<File | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [findings, setFindings] = useState<Record<string, Finding[]>>({});

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  }, []);

  const scan = async () => {
    setScanning(true);
    await new Promise((r) => setTimeout(r, 2000));
    setFindings(mockFindings);
    setScanning(false);
    setScanned(true);
  };

  const totalFindings = Object.values(findings).reduce((a, b) => a + b.length, 0);

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-6">
        <FileText className="inline w-5 h-5 text-primary mr-2" />
        Sensitive Log Detector
      </h2>

      {!scanned && !scanning && (
        <div className="space-y-6">
          <div
            className="border-2 border-dashed border-primary/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById("log-input")?.click()}
            data-interactive
          >
            <FileText className="w-8 h-8 text-primary/50 mx-auto mb-3" />
            <p className="font-mono text-sm text-text-secondary">Drop a log file or click to browse</p>
            <p className="font-mono text-xs text-text-ghost mt-1">Supported: .log, .txt, .json</p>
            <input id="log-input" type="file" accept=".log,.txt,.json" className="hidden" onChange={handleFile} />
          </div>
          {file && <p className="font-mono text-sm text-text-primary">Selected: {file.name}</p>}
          <CyberButton onClick={scan} disabled={!file}>Scan for Sensitive Data</CyberButton>
        </div>
      )}

      {scanning && (
        <TerminalWindow title="scanning">
          <p className="text-text-secondary">&gt; Analyzing log file patterns...</p>
          <p className="text-text-secondary">&gt; Checking for passwords, API keys, PII...</p>
          <span className="animate-blink text-primary">▌</span>
        </TerminalWindow>
      )}

      {scanned && (
        <div>
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span className="font-mono text-sm text-destructive">
              {totalFindings} SENSITIVE MATCHES FOUND IN {Object.keys(findings).length} FILES
            </span>
          </div>

          {Object.entries(findings).map(([filename, items]) => (
            <div key={filename} className="mb-6">
              <h3 className="font-mono text-sm text-text-primary mb-3">📄 {filename} — {items.length} matches</h3>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-border">
                    <span className="font-mono text-xs text-text-ghost min-w-[60px]">Line {item.line}</span>
                    <span className="font-mono text-xs text-text-secondary flex-1">{item.content}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${severityColor[item.severity]}`}>
                      {item.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3 mt-6">
            <CyberButton variant="danger">Redact All Sensitive Data</CyberButton>
            <CyberButton variant="secondary">Export Report</CyberButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogScanner;
