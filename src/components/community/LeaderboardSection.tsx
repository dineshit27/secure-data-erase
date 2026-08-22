import React, { useState } from "react";
import { Trophy, Award, ShieldCheck, Star, Users, Building2, Flame, ExternalLink, UserPlus } from "lucide-react";
import { useCommunityStore, CommunityUser } from "@/lib/communityStore";
import { CyberButton } from "@/components/ui/CyberButton";

const categories = [
  "Top Contributors",
  "Top Developers",
  "Top Security Experts",
  "Top Project Creators",
  "Featured Companies"
];

const availableBadges = [
  { name: "Security Explorer", desc: "Published 5+ threat analysis posts", icon: "🛡️" },
  { name: "Privacy Defender", desc: "Contributed memory wipe algorithms", icon: "🔐" },
  { name: "Code Contributor", desc: "Merged code in open-source projects", icon: "⚡" },
  { name: "Community Builder", desc: "Top 5% accepted answers in Q&A", icon: "🌐" },
  { name: "Project Creator", desc: "Published a project with 100+ stars", icon: "🚀" },
  { name: "Security Expert", desc: "Verified security research background", icon: "👑" },
  { name: "Verified Developer", desc: "Verified identity & code history", icon: "✓" },
  { name: "Verified Company", desc: "Official product showcase partner", icon: "🏢" }
];

export const LeaderboardSection: React.FC = () => {
  const { users, setSelectedUserProfile, toggleFollowUser, followedUserIds } = useCommunityStore();
  const [selectedCategory, setSelectedCategory] = useState("Top Contributors");

  const sortedUsers = [...users].sort((a, b) => b.reputation - a.reputation);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="font-mono text-sm font-bold text-text-ghost">#{rank}</span>;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl uppercase tracking-wide text-text-primary flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Community Reputation & Hall of Fame</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Recognizing top security architects, code contributors, project creators, and verified tech partners.
          </p>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-amber-400 text-void font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-amber-400/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Leaderboard Podium (Top 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {sortedUsers.slice(0, 3).map((user, idx) => {
          const rank = idx + 1;
          const isFollowed = followedUserIds.includes(user.id);
          return (
            <div
              key={user.id}
              className={`rounded-2xl border p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden shadow-2xl ${
                rank === 1
                  ? "border-amber-400/60 bg-gradient-to-b from-amber-400/15 via-surface to-surface shadow-[0_0_40px_rgba(251,191,36,0.15)] order-first md:order-2"
                  : rank === 2
                  ? "border-slate-400/50 bg-gradient-to-b from-slate-400/10 via-surface to-surface order-2 md:order-1"
                  : "border-amber-700/50 bg-gradient-to-b from-amber-700/10 via-surface to-surface order-3"
              }`}
            >
              <div className="absolute top-3 right-3 font-mono text-xs">{getRankBadge(rank)}</div>

              <img
                src={user.avatar}
                alt={user.name}
                onClick={() => setSelectedUserProfile(user)}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/40 cursor-pointer shadow-lg hover:scale-105 transition-transform"
              />

              <div className="space-y-1">
                <h3
                  onClick={() => setSelectedUserProfile(user)}
                  className="font-bold text-lg text-text-primary flex items-center justify-center gap-1 cursor-pointer hover:text-primary"
                >
                  <span>{user.name}</span>
                  {user.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
                </h3>
                <p className="font-mono text-xs text-text-ghost">{user.username}</p>
                <p className="text-xs text-text-secondary">{user.role}</p>
              </div>

              <div className="px-4 py-2 rounded-xl border border-border bg-void font-mono text-sm text-amber-400 font-extrabold">
                {user.reputation} REP
              </div>

              {/* Badges Preview */}
              <div className="flex flex-wrap justify-center gap-1">
                {user.badges.map((badge) => (
                  <span key={badge} className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-mono text-primary uppercase">
                    {badge}
                  </span>
                ))}
              </div>

              <CyberButton
                variant={isFollowed ? "secondary" : "primary"}
                size="sm"
                className="w-full mt-2"
                onClick={() => toggleFollowUser(user.id)}
              >
                {isFollowed ? "✓ Following" : "+ Follow"}
              </CyberButton>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border bg-void/50 font-display font-bold text-sm uppercase tracking-wide text-text-primary">
          Rankings & Reputation Standings
        </div>

        <div className="divide-y divide-border">
          {sortedUsers.map((user, idx) => {
            const isFollowed = followedUserIds.includes(user.id);
            return (
              <div
                key={user.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-void/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-base font-bold text-text-ghost w-8 text-center">
                    #{idx + 1}
                  </span>

                  <img
                    src={user.avatar}
                    alt={user.name}
                    onClick={() => setSelectedUserProfile(user)}
                    className="w-10 h-10 rounded-full object-cover cursor-pointer border border-border"
                  />

                  <div>
                    <div
                      onClick={() => setSelectedUserProfile(user)}
                      className="font-bold text-sm text-text-primary cursor-pointer hover:text-primary flex items-center gap-1.5"
                    >
                      <span>{user.name}</span>
                      {user.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="font-mono text-xs text-text-ghost">{user.username} • {user.role}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 font-mono text-xs">
                  <div className="text-right">
                    <div className="font-bold text-amber-400">{user.reputation} REP</div>
                    <div className="text-[10px] text-text-ghost">{user.stats.answers} answers • {user.stats.projects} projects</div>
                  </div>

                  <CyberButton
                    variant={isFollowed ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => toggleFollowUser(user.id)}
                  >
                    {isFollowed ? "Following" : "Follow"}
                  </CyberButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Legend Showcase */}
      <section className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <h3 className="font-display font-bold text-base uppercase tracking-wide text-text-primary flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Community Achievement Badges</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {availableBadges.map((b) => (
            <div key={b.name} className="p-3.5 rounded-xl border border-border bg-void/50 space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary">
                <span>{b.icon}</span>
                <span>{b.name}</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
