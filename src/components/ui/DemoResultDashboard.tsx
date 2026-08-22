import React from "react";
import { TestTube, CheckCircle2, RefreshCw, Plus, ShieldCheck } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";

interface DemoResultDashboardProps {
  toolName: string;
  filesProcessed: number;
  dataProcessed: string;
  findingsCount?: number;
  successfulOps?: number;
  onGenerateAnother: () => void;
  onResetDemo: () => void;
  customSummaryLines?: string[];
}

export const DemoResultDashboard: React.FC<DemoResultDashboardProps> = ({
  toolName,
  filesProcessed,
  dataProcessed,
  findingsCount = 0,
  successfulOps = 1,
  onGenerateAnother,
  onResetDemo,
  customSummaryLines
}) => {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-surface p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <TestTube className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-lg uppercase tracking-wide text-text-primary">
              🧪 DEMO RESULT — {toolName}
            </h3>
            <p className="font-mono text-xs text-text-ghost">SecureDel Sandbox Demonstration</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 font-mono text-xs font-bold text-emerald-400 uppercase">
          ✓ VERIFICATION PASSED
        </span>
      </div>

      {/* Metrics Table */}
      <div className="divide-y divide-border/60 font-mono text-xs text-text-secondary bg-void/50 rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between pt-1">
          <span className="text-text-ghost uppercase">Files / Items Processed</span>
          <span className="font-bold text-text-primary">{filesProcessed}</span>
        </div>

        <div className="flex items-center justify-between pt-3">
          <span className="text-text-ghost uppercase">Data Volume Processed</span>
          <span className="font-bold text-primary">{dataProcessed}</span>
        </div>

        <div className="flex items-center justify-between pt-3">
          <span className="text-text-ghost uppercase">Potential Findings Detected</span>
          <span className="font-bold text-amber-400">{findingsCount}</span>
        </div>

        <div className="flex items-center justify-between pt-3">
          <span className="text-text-ghost uppercase">Successful Operations</span>
          <span className="font-bold text-emerald-400">{successfulOps}</span>
        </div>
      </div>

      {/* Custom Summary Lines if provided */}
      {customSummaryLines && customSummaryLines.length > 0 && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-1 font-mono text-xs text-primary">
          {customSummaryLines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      )}

      {/* Status Badges */}
      <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Operation Completed</span>
        </div>
        <span className="text-text-ghost">•</span>
        <div className="flex items-center gap-1.5 text-primary">
          <ShieldCheck className="w-4 h-4" />
          <span>Verification Passed</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
        <CyberButton variant="primary" size="md" className="w-full sm:flex-1 bg-amber-400 text-void hover:bg-amber-300" onClick={onGenerateAnother}>
          <Plus className="w-4 h-4 mr-1 inline" />
          Generate Another Demo
        </CyberButton>

        <CyberButton variant="secondary" size="md" className="w-full sm:flex-1" onClick={onResetDemo}>
          <RefreshCw className="w-4 h-4 mr-1 inline" />
          Reset Demo
        </CyberButton>
      </div>
    </div>
  );
};
