import React from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";

interface FilePathBannerProps {
  name?: string;
  onSwitchMode?: () => void;
  onReset?: () => void;
}

export const FilePathBanner: React.FC<FilePathBannerProps> = ({
  name,
  onSwitchMode,
  onReset,
}) => {
  return (
    <div className="rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-500/10 via-surface to-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40 shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-400 text-void font-mono text-[10px] font-extrabold uppercase tracking-wider">
              📍 LOCAL FILE PATH
            </span>
            {name && (
              <span className="font-mono text-xs text-text-ghost truncate max-w-[200px]">
                {name}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            SecureDel is processing a user-selected filesystem resource. No
            arbitrary path access — only what you explicitly selected.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onReset && (
          <CyberButton
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-blue-400 hover:bg-blue-500/10"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1 inline" />
            Reset
          </CyberButton>
        )}
        {onSwitchMode && (
          <CyberButton
            variant="secondary"
            size="sm"
            onClick={onSwitchMode}
            className="text-xs"
          >
            Change Source
          </CyberButton>
        )}
      </div>
    </div>
  );
};
