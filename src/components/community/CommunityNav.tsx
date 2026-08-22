import React, { useState } from "react";
import {
  Home,
  MessageSquare,
  FolderGit2,
  Sparkles,
  Wrench,
  HelpCircle,
  Calendar,
  Trophy,
  Plus,
  Search,
  X,
  ChevronDown
} from "lucide-react";
import { useCommunityStore } from "@/lib/communityStore";
import { NotificationsPopover } from "./NotificationsPopover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CyberButton } from "@/components/ui/CyberButton";

const navItems = [
  { id: "home", label: "Community Home", icon: Home },
  { id: "discussions", label: "Discussions", icon: MessageSquare },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "showcase", label: "Tech Showcase", icon: Sparkles },
  { id: "tools", label: "IT Tools", icon: Wrench },
  { id: "questions", label: "Questions & Answers", icon: HelpCircle },
  { id: "events", label: "Events", icon: Calendar },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy }
] as const;

export const CommunityNav: React.FC = () => {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery, setOpenCreateModalType } = useCommunityStore();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <div className="w-full border-b border-border bg-void/80 sticky top-16 z-40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">
        {/* Top Controls Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-text-ghost absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SecureDel Community..."
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-border bg-surface/90 text-sm font-mono text-text-primary placeholder:text-text-ghost focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-text-ghost hover:text-text-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Area: Notifications + Global Create Dropdown */}
          <div className="flex items-center gap-3">
            <NotificationsPopover />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-void font-display font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Create</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1.5 border-border bg-surface shadow-2xl z-50">
                <DropdownMenuItem
                  onClick={() => setOpenCreateModalType("discussion")}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-text-primary hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Start Discussion
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setOpenCreateModalType("question")}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-text-primary hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  Ask Question
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setOpenCreateModalType("project")}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-text-primary hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer"
                >
                  <FolderGit2 className="w-4 h-4 text-emerald-400" />
                  Share Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setOpenCreateModalType("tool")}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-text-primary hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-amber-400" />
                  Submit Tool
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setOpenCreateModalType("showcase")}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-text-primary hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Create Showcase
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setOpenCreateModalType("event")}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-text-primary hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-pink-400" />
                  Create Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Primary Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 border-t border-border/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30 font-bold shadow-[0_0_15px_hsl(var(--primary)/0.15)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-text-ghost"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
