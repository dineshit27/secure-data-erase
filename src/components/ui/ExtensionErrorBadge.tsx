/**
 * ExtensionErrorBadge
 * Renders a rich "Invalid File Extension" error panel with:
 *  - The rejected extension
 *  - The tool name that rejected it
 *  - A list of supported extensions
 *  - An optional clickable suggested-tool link
 */
import React from "react";
import { Link } from "react-router-dom";
import { XCircle, ArrowRight } from "lucide-react";
import type { ToolMeta } from "@/lib/extensionRules";

interface ExtensionErrorBadgeProps {
  /** The extension that was entered, e.g. ".pdf" */
  ext: string;
  /** Name of the current tool rejecting the extension */
  currentToolLabel: string;
  /** Allowed extensions for the current tool */
  allowedExtensions: string[];
  /** Another tool that supports this extension, if any */
  suggestedTool?: ToolMeta;
}

export const ExtensionErrorBadge: React.FC<ExtensionErrorBadgeProps> = ({
  ext,
  currentToolLabel,
  allowedExtensions,
  suggestedTool,
}) => (
  <div className="p-4 rounded-xl bg-destructive/8 border border-destructive/30 space-y-3 font-mono text-xs">
    {/* Header */}
    <div className="flex items-start gap-2">
      <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-destructive font-bold tracking-wide uppercase">
          Invalid File Extension
        </p>
        <p className="text-text-secondary leading-relaxed">
          <span className="text-destructive font-bold">{ext || "(no extension)"}</span>
          {" "}cannot be processed by{" "}
          <span className="text-text-primary font-semibold">{currentToolLabel}</span>.
        </p>
      </div>
    </div>

    {/* Supported extensions */}
    <div className="pl-6 space-y-1">
      <p className="text-text-ghost uppercase tracking-widest text-[10px]">
        Supported extensions:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {allowedExtensions.map((e) => (
          <span
            key={e}
            className="px-2 py-0.5 rounded bg-surface-2 border border-border text-text-primary font-bold"
          >
            {e}
          </span>
        ))}
      </div>
    </div>

    {/* Suggested tool */}
    {suggestedTool && (
      <div className="pl-6 pt-1 border-t border-destructive/15">
        <p className="text-amber-400 font-bold text-[10px] uppercase tracking-widest mb-1.5">
          💡 Suggested Tool:
        </p>
        <Link
          to={suggestedTool.route}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-400/30 bg-amber-400/5 text-amber-400 font-bold hover:bg-amber-400/15 hover:border-amber-400/50 transition-all group"
        >
          <span>{suggestedTool.emoji} {suggestedTool.label}</span>
          <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <p className="text-text-ghost text-[10px] mt-1.5">
          supports <span className="font-bold text-amber-400">{ext}</span> files
        </p>
      </div>
    )}
  </div>
);

export default ExtensionErrorBadge;
