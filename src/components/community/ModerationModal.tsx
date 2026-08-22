import React, { useState } from "react";
import { Flag, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useCommunityStore } from "@/lib/communityStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CyberButton } from "@/components/ui/CyberButton";
import toast from "react-hot-toast";

const reportReasons = [
  "Spam or unrequested commercial promotion",
  "Harassment or offensive behavior",
  "Scam or phish attempt",
  "Malicious code or dangerous exploit link",
  "Misleading or false security information",
  "Copyright or IP violation",
  "Other reason"
];

export const ModerationModal: React.FC = () => {
  const { reportingItem, setReportingItem, reportContent } = useCommunityStore();
  const [selectedReason, setSelectedReason] = useState(reportReasons[0]);
  const [detailsText, setDetailsText] = useState("");

  if (!reportingItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportContent(reportingItem.type, reportingItem.id, selectedReason);
    toast.success("Thank you. Content reported to community moderators.");
    setReportingItem(null);
  };

  return (
    <Dialog open={!!reportingItem} onOpenChange={() => setReportingItem(null)}>
      <DialogContent className="max-w-md border-border bg-surface text-text-primary z-50">
        <DialogHeader>
          <div className="flex items-center gap-2 text-danger font-mono text-xs uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4" />
            <span>Community Safety & Moderation</span>
          </div>
          <DialogTitle className="font-display font-bold text-lg uppercase tracking-wide">
            Report {reportingItem.type}: {reportingItem.title.slice(0, 40)}...
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-text-ghost">
            Select the primary reason for reporting this content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            {reportReasons.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer font-mono text-xs transition-colors ${
                  selectedReason === reason
                    ? "border-danger/60 bg-danger/10 text-text-primary"
                    : "border-border bg-void/50 text-text-secondary hover:text-text-primary"
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="text-danger focus:ring-danger"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div className="space-y-1">
            <label className="font-mono text-xs text-text-ghost uppercase">Additional details (Optional)</label>
            <textarea
              rows={2}
              value={detailsText}
              onChange={(e) => setDetailsText(e.target.value)}
              placeholder="Provide relevant context for moderators..."
              className="w-full p-2.5 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-danger"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <CyberButton variant="ghost" size="sm" type="button" onClick={() => setReportingItem(null)}>
              Cancel
            </CyberButton>

            <CyberButton variant="danger" size="sm" type="submit">
              Submit Report
            </CyberButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
