import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TerminalWindowProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export const TerminalWindow = ({ title = "terminal", children, className }: TerminalWindowProps) => (
  <div className={cn("rounded-lg border border-border overflow-hidden bg-void", className)}>
    <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-border">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
      </div>
      <span className="text-[11px] font-mono text-text-ghost ml-2">{title}</span>
    </div>
    <div className="p-4 font-mono text-sm text-text-secondary overflow-auto max-h-96">
      {children}
    </div>
  </div>
);
