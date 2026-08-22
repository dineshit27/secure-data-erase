import React, { useRef } from "react";
import { FolderOpen, MapPin, TestTube } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";

interface InputMethodSelectorProps {
  onSelectManual: (file?: File) => void;
  onSelectFilePath: () => void;
  onSelectDemo: () => void;
  title?: string;
  subtitle?: string;
  /** HTML accept attribute string for the file picker, e.g. ".log,.txt" */
  accept?: string;
  /** Human-readable label shown as a hint under the upload card */
  acceptLabel?: string;
}

export const InputMethodSelector: React.FC<InputMethodSelectorProps> = ({
  onSelectManual,
  onSelectFilePath,
  onSelectDemo,
  title = "Choose Data Source",
  subtitle = "Select how you want to provide data to this tool.",
  accept,
  acceptLabel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadCardClick = () => {
    if (accept) {
      // Trigger the hidden file input so the browser enforces the accept filter
      fileInputRef.current?.click();
    } else {
      onSelectManual();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelectManual(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 space-y-6 max-w-4xl mx-auto shadow-2xl">
      <div className="text-center space-y-2">
        <h3 className="font-display font-extrabold text-xl sm:text-2xl uppercase tracking-wide text-text-primary">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Hidden native file input — enforces accept filter at OS level */}
      {accept && (
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* 3-column grid — stacks to 1 col on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-2">

        {/* ── Option 1: Manual Upload ────────────────────────────────── */}
        <div
          onClick={handleUploadCardClick}
          className="rounded-xl border border-border bg-void/60 hover:border-primary/50 hover:bg-primary/5 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all group shadow-lg"
        >
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-text-ghost uppercase tracking-widest">
                Option 1
              </span>
              <h4 className="font-display font-bold text-base text-text-primary uppercase tracking-wide group-hover:text-primary transition-colors mt-0.5">
                📁 Upload File
              </h4>
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                Upload a file directly from your device using the browser file
                picker.
              </p>
              {acceptLabel && (
                <p className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/25 font-mono text-[10px] text-primary font-semibold">
                  ✦ Accepted: {acceptLabel}
                </p>
              )}
            </div>
          </div>
          <CyberButton variant="secondary" size="sm" className="w-full">
            Upload File
          </CyberButton>
        </div>

        {/* ── Option 2: File Path ────────────────────────────────────── */}
        <div
          onClick={onSelectFilePath}
          className="rounded-xl border border-blue-500/40 bg-blue-500/5 hover:border-blue-400 hover:bg-blue-500/10 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all group shadow-xl relative"
        >
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-blue-400/70 uppercase tracking-widest">
                Option 2
              </span>
              <h4 className="font-display font-bold text-base text-text-primary uppercase tracking-wide group-hover:text-blue-400 transition-colors mt-0.5">
                📍 File Path
              </h4>
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                Browse and select a local file or folder using the OS native
                file picker. SecureDel only accesses what you explicitly
                choose.
              </p>
            </div>
          </div>
          <CyberButton
            variant="secondary"
            size="sm"
            className="w-full border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
          >
            Browse Path
          </CyberButton>
        </div>

        {/* ── Option 3: Generate Demo ────────────────────────────────── */}
        <div
          onClick={onSelectDemo}
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 hover:border-amber-400 hover:bg-amber-500/10 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all group shadow-xl relative"
        >
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-amber-400 text-void font-mono text-[9px] font-extrabold uppercase">
            DEMO
          </div>
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TestTube className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-amber-400/80 uppercase tracking-widest">
                Option 3
              </span>
              <h4 className="font-display font-bold text-base text-text-primary uppercase tracking-wide group-hover:text-amber-400 transition-colors mt-0.5">
                🧪 Generate Demo
              </h4>
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                Instantly generate safe, fictional sandbox data to evaluate
                this tool — no real files needed.
              </p>
            </div>
          </div>
          <CyberButton
            variant="primary"
            size="sm"
            className="w-full bg-amber-400 text-void hover:bg-amber-300"
          >
            Generate Demo Data
          </CyberButton>
        </div>
      </div>
    </div>
  );
};
