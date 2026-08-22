import React from "react";
import { TestTube, ShieldCheck, RefreshCw } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";

interface DemoModeBannerProps {
  onSwitchMode?: () => void;
  onResetDemo?: () => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ onSwitchMode, onResetDemo }) => {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-surface to-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
          <TestTube className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-400 text-void font-mono text-[10px] font-extrabold uppercase tracking-wider">
              🧪 DEMO MODE ACTIVE
            </span>
            <span className="font-mono text-xs text-text-ghost">SecureDel Sandbox</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            You are working with safe fictional data generated for demonstration. No real system data is modified.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onResetDemo && (
          <CyberButton variant="ghost" size="sm" onClick={onResetDemo} className="text-xs text-amber-400 hover:bg-amber-500/10">
            <RefreshCw className="w-3.5 h-3.5 mr-1 inline" />
            Reset Demo
          </CyberButton>
        )}
        {onSwitchMode && (
          <CyberButton variant="secondary" size="sm" onClick={onSwitchMode} className="text-xs">
            Switch to Manual Upload
          </CyberButton>
        )}
      </div>
    </div>
  );
};
