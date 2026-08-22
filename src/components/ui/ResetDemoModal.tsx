import React from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CyberButton } from "@/components/ui/CyberButton";

interface ResetDemoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border bg-surface text-text-primary z-50">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest">
            <AlertTriangle className="w-4 h-4" />
            <span>Reset Confirmation</span>
          </div>
          <DialogTitle className="font-display font-bold text-lg uppercase tracking-wide">
            Reset Demo Environment?
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-text-ghost">
            This will remove only SecureDel-generated demo data and clear demo results. Real user files are never touched.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <CyberButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </CyberButton>

          <CyberButton
            variant="danger"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Reset Demo
          </CyberButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
