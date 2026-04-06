import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "default" | "lg" | "sm";
}

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant = "primary", size = "default", children, ...props }, ref) => {
    const base = "font-mono uppercase tracking-wider font-semibold transition-all duration-300 relative overflow-hidden group";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(157_100%_50%/0.3)] active:scale-95",
      secondary: "bg-transparent border border-primary text-primary hover:bg-primary/10",
      danger: "bg-destructive text-destructive-foreground hover:shadow-[0_0_30px_hsl(0_100%_61%/0.3)] active:scale-95",
      ghost: "bg-transparent text-text-secondary hover:text-primary hover:bg-primary/5",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      default: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], "rounded-lg", className)}
        {...props}
      >
        {children}
        {(variant === "primary" || variant === "danger") && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        )}
      </button>
    );
  }
);
CyberButton.displayName = "CyberButton";
