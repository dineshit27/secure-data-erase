import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  ExternalLink,
  MessageSquare,
  UserPlus,
  Share2,
  Award,
  Globe,
  Users,
  FolderGit2,
  CheckCircle2,
  Send
} from "lucide-react";
import { useCommunityStore, CommunityUser } from "@/lib/communityStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CyberButton } from "@/components/ui/CyberButton";
import toast from "react-hot-toast";

export const UserProfileDrawer: React.FC = () => {
  const { selectedUserProfile, setSelectedUserProfile, followedUserIds, toggleFollowUser } = useCommunityStore();
  const [activeTab, setActiveTab] = useState<"about" | "skills" | "message">("about");
  const [messageText, setMessageText] = useState("");

  if (!selectedUserProfile) return null;

  const isFollowed = followedUserIds.includes(selectedUserProfile.id);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    toast.success(`Message sent to ${selectedUserProfile.name}!`);
    setMessageText("");
    setActiveTab("about");
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success(`Copied profile link for ${selectedUserProfile.name}`);
  };

  return (
    <Dialog open={!!selectedUserProfile} onOpenChange={() => setSelectedUserProfile(null)}>
      <DialogContent className="max-w-xl border-border bg-surface text-text-primary max-h-[85vh] overflow-y-auto z-50">
        <DialogHeader className="space-y-4">
          {/* Header Cover Banner */}
          <div className="h-24 rounded-xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-surface-2 border border-border relative -mt-2">
            <div className="absolute -bottom-6 left-6 flex items-end gap-4">
              <img
                src={selectedUserProfile.avatar}
                alt={selectedUserProfile.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-surface shadow-2xl"
              />
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <DialogTitle className="font-display font-extrabold text-2xl uppercase tracking-wide text-text-primary flex items-center gap-2">
                <span>{selectedUserProfile.name}</span>
                {selectedUserProfile.isVerified && <ShieldCheck className="w-5 h-5 text-primary" />}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-text-ghost">
                {selectedUserProfile.username} • {selectedUserProfile.role}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <CyberButton
                variant={isFollowed ? "secondary" : "primary"}
                size="sm"
                onClick={() => toggleFollowUser(selectedUserProfile.id)}
              >
                {isFollowed ? "Following" : "+ Follow"}
              </CyberButton>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl border border-border bg-void text-text-ghost hover:text-text-primary"
                title="Share Profile"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Bio */}
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{selectedUserProfile.bio}</p>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-xl border border-border bg-void/60">
              <div className="text-sm font-bold text-amber-400">{selectedUserProfile.reputation}</div>
              <div className="text-[9px] text-text-ghost uppercase">Reputation</div>
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-void/60">
              <div className="text-sm font-bold text-primary">{selectedUserProfile.stats.projects}</div>
              <div className="text-[9px] text-text-ghost uppercase">Projects</div>
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-void/60">
              <div className="text-sm font-bold text-cyan-400">{selectedUserProfile.stats.answers}</div>
              <div className="text-[9px] text-text-ghost uppercase">Answers</div>
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-void/60">
              <div className="text-sm font-bold text-purple-400">{selectedUserProfile.stats.followers}</div>
              <div className="text-[9px] text-text-ghost uppercase">Followers</div>
            </div>
          </div>

          {/* Company Specific Information */}
          {selectedUserProfile.isCompany && selectedUserProfile.companyInfo && (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Company Verification & Profile</span>
              </h4>

              <p className="text-xs text-text-secondary">{selectedUserProfile.companyInfo.about}</p>

              <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs pt-2 border-t border-purple-500/20">
                <a
                  href={selectedUserProfile.companyInfo.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <span className="text-text-ghost">Team: {selectedUserProfile.companyInfo.teamSize}</span>
                <span className="text-text-ghost">Products: {selectedUserProfile.companyInfo.productsCount}</span>
              </div>
            </div>
          )}

          {/* Skills & Badges */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs text-primary uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Badges & Expertise</span>
            </h4>

            <div className="flex flex-wrap gap-1.5">
              {selectedUserProfile.badges.map((badge) => (
                <span
                  key={badge}
                  className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary font-mono text-xs"
                >
                  🏆 {badge}
                </span>
              ))}

              {selectedUserProfile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-lg border border-border bg-void text-text-secondary font-mono text-xs"
                >
                  #{skill}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Message Tab */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="font-mono text-xs text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Send Direct Message</span>
            </h4>

            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Send private message to ${selectedUserProfile.name}...`}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-cyan-400"
              />
              <CyberButton variant="primary" size="sm" onClick={handleSendMessage} className="flex items-center gap-1">
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </CyberButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
