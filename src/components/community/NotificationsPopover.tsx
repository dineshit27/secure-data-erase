import React from "react";
import { Bell, CheckCheck, Sparkles, Heart, MessageSquare, Award, ExternalLink } from "lucide-react";
import { useCommunityStore } from "@/lib/communityStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CyberButton } from "@/components/ui/CyberButton";

export const NotificationsPopover: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useCommunityStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "upvote":
        return <Heart className="w-4 h-4 text-primary" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case "badge":
        return <Award className="w-4 h-4 text-amber-400" />;
      case "answer":
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-2.5 rounded-xl border border-border bg-surface/80 hover:bg-surface hover:border-primary/40 transition-all group"
          title="Community Notifications"
        >
          <Bell className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-void shadow-[0_0_8px_hsl(var(--primary))]">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 border-border bg-surface shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50">
        <div className="flex items-center justify-between p-4 border-b border-border bg-void/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm text-text-primary uppercase tracking-wide">
              Notifications ({unreadCount})
            </h3>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-text-ghost font-mono text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-4 transition-colors cursor-pointer flex items-start gap-3 ${
                  !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-void/40"
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-surface border border-border">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-xs text-text-primary">{n.title}</p>
                    <span className="font-mono text-[10px] text-text-ghost">{n.createdAt}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{n.message}</p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1" />}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
