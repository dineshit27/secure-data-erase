import { Shield } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-border bg-void py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-text-primary">
            Secure<span className="text-primary">Del</span>
          </span>
        </div>
        <p className="font-mono text-xs text-text-ghost tracking-widest uppercase">
          // No file survives. No trace remains.
        </p>
        <p className="font-mono text-xs text-text-ghost">
          © {new Date().getFullYear()} SecureDel
        </p>
      </div>
    </div>
  </footer>
);
