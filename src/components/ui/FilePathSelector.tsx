/**
 * FilePathSelector — Direct Path Input with Backend Filesystem Validation
 * Supports entering local filesystem paths (e.g. C:\SecureDel\demo-files\demo_secret.txt),
 * validating them via the SecureDel Python backend, and viewing real file metadata.
 */
import React, { useState, useRef } from "react";
import {
  FolderOpen,
  FileSearch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  RotateCcw,
  MapPin,
  FileCheck,
} from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { validateFilePath, generateDemoFile, ValidatePathResult, formatBytes } from "@/lib/api";
import { validatePathExtension, getToolMeta, type ExtensionValidationResult } from "@/lib/extensionRules";
import { ExtensionErrorBadge } from "@/components/ui/ExtensionErrorBadge";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SelectedPathResult {
  name: string;
  files: File[];
  isDirectory: boolean;
  totalBytes: number;
  fileCount: number;
  path?: string;
  directoryHandle?: FileSystemDirectoryHandle;
}

type ValidationStatus =
  | "idle"
  | "loading"
  | "valid"
  | "cancelled"
  | "error"
  | "ext_error";

interface ValidationState {
  status: ValidationStatus;
  message?: string;
  detail?: string;
  pathData?: ValidatePathResult;
  extResult?: ExtensionValidationResult;
}

interface FilePathSelectorProps {
  mode?: "file" | "folder" | "both";
  accept?: string[];
  multiple?: boolean;
  label?: string;
  helper?: string;
  placeholder?: string;
  defaultPath?: string;
  /** Tool id used for extension whitelist enforcement (e.g. "file-wiper"). */
  toolId?: string;
  onSelected?: (result: SelectedPathResult) => void;
  onPathValidated?: (result: ValidatePathResult) => void;
  onClear?: () => void;
}

export const FilePathSelector: React.FC<FilePathSelectorProps> = ({
  mode = "file",
  accept,
  multiple = true,
  label = "Enter the full path of an existing file:",
  helper = "SecureDel will validate and process the file directly on the local filesystem.",
  placeholder = "C:\\SecureDel\\demo-files\\demo_secret.txt",
  defaultPath = "",
  toolId,
  onSelected,
  onPathValidated,
  onClear,
}) => {
  const toolMeta = toolId ? getToolMeta(toolId) : undefined;
  const [pathInput, setPathInput] = useState(defaultPath);
  const [validation, setValidation] = useState<ValidationState>({
    status: "idle",
  });
  const [validatedPathResult, setValidatedPathResult] = useState<ValidatePathResult | null>(null);
  const [creatingDemo, setCreatingDemo] = useState(false);

  const reset = () => {
    setValidation({ status: "idle" });
    setPathInput("");
    setValidatedPathResult(null);
    onClear?.();
  };

  const handleQuickCreateDemo = async () => {
    setCreatingDemo(true);
    try {
      const demo = await generateDemoFile();
      if (demo.success && demo.path) {
        setPathInput(demo.path);
        handleValidateDirectPath(demo.path);
      }
    } catch (_) {
    } finally {
      setCreatingDemo(false);
    }
  };

  // ── Direct backend path validation ───────────────────────────────────────

  const handleValidateDirectPath = async (customPath?: string) => {
    const rawToValidate = (customPath ?? pathInput).trim();
    const pathToValidate = rawToValidate.replace(/^["']+|["']+$/g, "").trim();
    if (!pathToValidate) {
      setValidation({
        status: "error",
        message: "Please enter a file path to validate.",
      });
      return;
    }

    // ── Extension whitelist check (before hitting the backend) ──────────────
    if (toolId) {
      const extResult = validatePathExtension(toolId, pathToValidate);
      if (!extResult.valid) {
        setValidation({ status: "ext_error", extResult });
        setValidatedPathResult(null);
        return;
      }
    }

    setValidation({
      status: "loading",
      message: "Validating path with backend...",
    });

    try {
      const res = await validateFilePath(pathToValidate);

      if (res.success && res.exists && res.isFile) {
        setValidation({
          status: "valid",
          message: "File found and accessible",
          pathData: res,
        });
        setValidatedPathResult(res);
        onPathValidated?.(res);

        // Also notify onSelected if subscribed
        if (onSelected) {
          onSelected({
            name: res.name || "file",
            files: [],
            isDirectory: false,
            totalBytes: res.size || 0,
            fileCount: 1,
            path: res.path || pathToValidate,
          });
        }
      } else {
        const errMessage = res.message || (res.error === "FILE_NOT_FOUND" ? "File not found" : "Validation failed");
        setValidation({
          status: "error",
          message: errMessage,
          detail: res.error,
        });
        setValidatedPathResult(null);
      }
    } catch (err: any) {
      setValidation({
        status: "error",
        message: err.message || "Failed to communicate with SecureDel backend.",
      });
      setValidatedPathResult(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleValidateDirectPath();
    }
  };

  // ── Status Indicator ────────────────────────────────────────────────────

  const renderStatus = () => {
    switch (validation.status) {
      case "loading":
        return (
          <div className="flex items-center gap-2 font-mono text-xs text-text-ghost">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>{validation.message}</span>
          </div>
        );
      case "valid":
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ File Found</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ Path accessible & readable</span>
            </div>
          </div>
        );
      case "ext_error": {
        const er = validation.extResult!;
        return (
          <ExtensionErrorBadge
            ext={er.ext}
            currentToolLabel={toolMeta?.label ?? "this tool"}
            allowedExtensions={er.allowedExtensions}
            suggestedTool={er.suggestedTool}
          />
        );
      }
      case "error":
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-mono text-xs text-destructive font-bold">
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              <span>✗ {validation.message}</span>
            </div>
            <button
              type="button"
              onClick={handleQuickCreateDemo}
              disabled={creatingDemo}
              className="text-amber-400 hover:underline font-bold text-[11px] font-mono flex items-center gap-1 cursor-pointer pl-5"
            >
              {creatingDemo ? <Loader2 className="w-3 h-3 animate-spin" /> : "✦"} Click here to generate demo file on disk
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      {label && (
        <div>
          <p className="font-mono text-xs text-text-ghost uppercase tracking-widest mb-0.5 font-bold">
            {label}
          </p>
          {helper && (
            <p className="text-xs text-text-secondary leading-relaxed">
              {helper}
            </p>
          )}
        </div>
      )}

      {/* Path Input + Validate Button */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
            <input
              type="text"
              value={pathInput}
              onChange={(e) => {
                setPathInput(e.target.value);
                if (validation.status !== "idle") setValidation({ status: "idle" });
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full h-11 pl-10 pr-3 bg-surface-2 border border-border rounded-xl font-mono text-xs sm:text-sm text-text-primary placeholder:text-text-ghost focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 outline-none transition-all"
            />
          </div>

          <CyberButton
            variant="secondary"
            size="sm"
            onClick={() => handleValidateDirectPath()}
            disabled={validation.status === "loading" || !pathInput.trim()}
            className="shrink-0 flex items-center gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10 px-4"
          >
            {validation.status === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileCheck className="w-4 h-4" />
            )}
            Validate Path
          </CyberButton>

          {(pathInput || validatedPathResult) && (
            <CyberButton
              variant="ghost"
              size="sm"
              onClick={reset}
              className="shrink-0 text-text-ghost hover:text-text-primary"
              title="Clear input"
            >
              <RotateCcw className="w-4 h-4" />
            </CyberButton>
          )}
        </div>

        {/* Quick path suggestion */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-text-ghost">
          <span>Preset demo path:</span>
          <button
            type="button"
            onClick={() => {
              const preset = "C:\\SecureDel\\demo-files\\demo_secret.txt";
              setPathInput(preset);
              handleValidateDirectPath(preset);
            }}
            className="text-blue-400 hover:text-blue-300 underline font-mono cursor-pointer"
          >
            C:\SecureDel\demo-files\demo_secret.txt
          </button>
        </div>
      </div>

      {/* Validation Status Indicator */}
      <div className="min-h-[1.5rem]">{renderStatus()}</div>

      {/* Real Metadata Panel */}
      {validatedPathResult && validation.status === "valid" && (
        <div className="p-4 rounded-xl bg-void border border-blue-500/30 space-y-2 font-mono text-xs shadow-inner">
          <p className="text-blue-400 uppercase tracking-widest text-[10px] font-bold mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> FILE INFORMATION
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <span className="text-text-ghost">Name:</span>
            <span className="text-text-primary font-bold truncate">
              {validatedPathResult.name}
            </span>

            <span className="text-text-ghost">Type:</span>
            <span className="text-primary font-bold">
              {validatedPathResult.type}
            </span>

            <span className="text-text-ghost">Size:</span>
            <span className="text-primary font-bold">
              {formatBytes(validatedPathResult.size || 0)}
            </span>

            <span className="text-text-ghost">Path:</span>
            <span className="text-text-secondary truncate col-span-1" title={validatedPathResult.path}>
              {validatedPathResult.path}
            </span>

            <span className="text-text-ghost">Status:</span>
            <span className="text-emerald-400 font-bold">
              READY
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
