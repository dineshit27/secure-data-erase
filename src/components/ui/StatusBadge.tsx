import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "wiping" | "complete" | "error" | "online";
  className?: string;
}

const config = {
  active: { label: "ACTIVE", color: "bg-primary/20 text-primary border-primary/30" },
  wiping: { label: "WIPING", color: "bg-warning/20 text-warning border-warning/30" },
  complete: { label: "COMPLETE", color: "bg-primary/20 text-primary border-primary/30" },
  error: { label: "ERROR", color: "bg-destructive/20 text-destructive border-destructive/30" },
  online: { label: "ONLINE", color: "bg-primary/20 text-primary border-primary/30" },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const { label, color } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono tracking-widest border rounded", color, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {label}
    </span>
  );
};
