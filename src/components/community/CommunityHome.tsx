import React from "react";
import {
  MessageSquare,
  Sparkles,
  FolderGit2,
  HelpCircle,
  Calendar,
  Wrench,
  Users,
  ShieldCheck,
  Building2,
  TrendingUp,
  ArrowRight,
  Plus,
  Flame,
  Star,
  CheckCircle2,
  ExternalLink,
  Tag,
  ShieldAlert
} from "lucide-react";
import { useCommunityStore, CommunityUser } from "@/lib/communityStore";
import { CyberButton } from "@/components/ui/CyberButton";

export const CommunityHome: React.FC = () => {
  const {
    discussions,
    questions,
    projects,
    showcases,
    tools,
    events,
    users,
    setActiveTab,
    setOpenCreateModalType,
    setSelectedUserProfile,
    toggleUpvoteDiscussion,
    toggleStarProject,
    toggleRegisterEvent
  } = useCommunityStore();

  const trendingTopics = [
    { tag: "#Cybersecurity", count: "1.4k posts", risk: "high" },
    { tag: "#AI", count: "980 posts", risk: "medium" },
    { tag: "#React", count: "820 posts", risk: "low" },
    { tag: "#DevOps", count: "750 posts", risk: "medium" },
    { tag: "#CloudSecurity", count: "690 posts", risk: "high" },
    { tag: "#OpenSource", count: "610 posts", risk: "low" },
    { tag: "#WebDevelopment", count: "540 posts", risk: "low" },
    { tag: "#DataPrivacy", count: "480 posts", risk: "high" }
  ];

  const topContributors = (users || []).filter((u) => !u.isCompany).slice(0, 3);
  const featuredCompanies = (users || []).filter((u) => u.isCompany).slice(0, 2);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface-2 p-8 md:p-10 shadow-[0_0_50px_hsl(var(--primary)/0.08)]">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-xs uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Developer & Security Ecosystem</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl uppercase tracking-tight text-text-primary">
            Secure<span className="text-primary">Del</span> Community
          </h1>

          <p className="font-mono text-base sm:text-lg text-primary font-semibold tracking-wide">
            Connect. Build. Share. Secure.
          </p>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            A community for developers, security enthusiasts, IT professionals, startups, and technology companies.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <CyberButton
              variant="primary"
              size="md"
              onClick={() => setOpenCreateModalType("discussion")}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Start a Discussion</span>
            </CyberButton>

            <CyberButton
              variant="secondary"
              size="md"
              onClick={() => setOpenCreateModalType("project")}
              className="flex items-center gap-2"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Share Your Project</span>
            </CyberButton>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left / Main Column (Col-span-2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Trending Discussions Widget */}
          <section className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-xl uppercase tracking-wide text-text-primary">
                  Trending Discussions
                </h2>
              </div>
              <button
                onClick={() => setActiveTab("discussions")}
                className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {(discussions || []).slice(0, 3).map((disc) => (
                <div
                  key={disc.id}
                  className="rounded-xl border border-border bg-void/40 p-4 hover:border-primary/40 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary font-mono text-[10px] uppercase mb-1.5">
                        {disc.category}
                      </span>
                      <h3
                        onClick={() => setActiveTab("discussions")}
                        className="font-semibold text-sm text-text-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        {disc.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary line-clamp-2">{disc.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs font-mono text-text-ghost">
                    <div
                      onClick={() => setSelectedUserProfile(disc.author as unknown as CommunityUser)}
                      className="flex items-center gap-2 cursor-pointer hover:text-text-primary"
                    >
                      <img src={disc.author.avatar} alt={disc.author.name} className="w-5 h-5 rounded-full object-cover" />
                      <span>{disc.author.name}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleUpvoteDiscussion(disc.id)}
                        className={`flex items-center gap-1 hover:text-primary transition-colors ${
                          disc.userUpvoted ? "text-primary font-bold" : ""
                        }`}
                      >
                        ▲ {disc.upvotes} upvotes
                      </button>
                      <span>💬 {disc.commentsCount} comments</span>
                      <span>👁 {disc.views} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Projects Widget */}
          <section className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-emerald-400" />
                <h2 className="font-display font-bold text-xl uppercase tracking-wide text-text-primary">
                  Featured Projects
                </h2>
              </div>
              <button
                onClick={() => setActiveTab("projects")}
                className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
              >
                Explore Projects <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(projects || []).slice(0, 2).map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-xl border border-border bg-void/40 p-4 hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img src={proj.logo} alt={proj.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                      <div>
                        <h3 className="font-bold text-sm text-text-primary">{proj.name}</h3>
                        <p className="text-[11px] font-mono text-text-ghost">{proj.creator.name}</p>
                      </div>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2">{proj.tagline}</p>

                    <div className="flex flex-wrap gap-1">
                      {proj.techStack.map((tech) => (
                        <span key={tech} className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-text-ghost">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-border/50 font-mono text-xs">
                    <button
                      onClick={() => toggleStarProject(proj.id)}
                      className={`flex items-center gap-1 text-xs ${proj.userStarred ? "text-amber-400 font-bold" : "text-text-secondary hover:text-amber-400"}`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{proj.stars}</span>
                    </button>

                    <a
                      href={proj.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <span>Live Demo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tech Showcase Widget */}
          <section className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="font-display font-bold text-xl uppercase tracking-wide text-text-primary">
                  Trending Tech Showcases
                </h2>
              </div>
              <button
                onClick={() => setActiveTab("showcase")}
                className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
              >
                View Showcase <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {(showcases || []).slice(0, 2).map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-void/40 p-4 space-y-3 hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={item.logo} alt={item.productName} className="w-10 h-10 rounded-lg object-cover border border-border" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-text-primary">{item.productName}</h3>
                          {item.badgeText && (
                            <span className="px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 font-mono text-[9px] font-bold text-amber-400 uppercase">
                              {item.badgeText}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">{item.tagline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {item.highlights.map((hl) => (
                      <span key={hl} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-primary/20 bg-primary/5 font-mono text-[10px] text-primary">
                        <CheckCircle2 className="w-3 h-3" />
                        {hl}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Q&A & Events Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Latest Q&A */}
            <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-display font-bold text-base uppercase text-text-primary">Latest Q&A</h3>
                </div>
                <button onClick={() => setActiveTab("questions")} className="text-xs font-mono text-primary hover:underline">
                  All Q&A
                </button>
              </div>

              {(questions || []).slice(0, 2).map((q) => (
                <div key={q.id} className="p-3 rounded-lg border border-border bg-void/30 space-y-1">
                  {q.isResolved && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] uppercase">
                      ✓ Resolved
                    </span>
                  )}
                  <h4 onClick={() => setActiveTab("questions")} className="text-xs font-semibold text-text-primary hover:text-primary cursor-pointer">
                    {q.title}
                  </h4>
                  <p className="font-mono text-[10px] text-text-ghost">
                    {q.votes} votes • {q.answersCount} answers
                  </p>
                </div>
              ))}
            </section>

            {/* Upcoming Events */}
            <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  <h3 className="font-display font-bold text-base uppercase text-text-primary">Upcoming Events</h3>
                </div>
                <button onClick={() => setActiveTab("events")} className="text-xs font-mono text-primary hover:underline">
                  All Events
                </button>
              </div>

              {(events || []).slice(0, 2).map((evt) => (
                <div key={evt.id} className="p-3 rounded-lg border border-border bg-void/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-pink-400 uppercase tracking-widest">{evt.date}</span>
                    <span className="font-mono text-[10px] text-text-ghost">{evt.format}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-text-primary">{evt.title}</h4>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-text-ghost">{evt.attendeesCount} attending</span>
                    <button
                      onClick={() => toggleRegisterEvent(evt.id)}
                      className={`text-[10px] font-mono font-bold hover:underline ${evt.isRegistered ? "text-emerald-400" : "text-primary"}`}
                    >
                      {evt.isRegistered ? "✓ Registered" : "Register →"}
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* Right / Sidebar Column (Col-span-1) */}
        <div className="space-y-6">
          {/* Community Stats Box */}
          <section className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-surface p-6 space-y-4">
            <h3 className="font-display font-bold text-sm uppercase tracking-widest text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Community Stats</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="font-mono text-[10px] text-text-ghost uppercase">Members</div>
                <div className="text-xl font-bold font-mono text-text-primary">12.8K</div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="font-mono text-[10px] text-text-ghost uppercase">Discussions</div>
                <div className="text-xl font-bold font-mono text-primary">2.4K</div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="font-mono text-[10px] text-text-ghost uppercase">Projects</div>
                <div className="text-xl font-bold font-mono text-emerald-400">846</div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="font-mono text-[10px] text-text-ghost uppercase">Companies</div>
                <div className="text-xl font-bold font-mono text-purple-400">320</div>
              </div>
            </div>
          </section>

          {/* Trending Topics */}
          <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wide text-text-primary flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <span>Trending Topics</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic) => (
                <button
                  key={topic.tag}
                  onClick={() => setActiveTab("discussions")}
                  className="px-2.5 py-1 rounded-lg border border-border bg-void/50 text-xs font-mono text-text-secondary hover:border-primary/40 hover:text-primary transition-all flex items-center gap-1.5"
                >
                  <span>{topic.tag}</span>
                  <span className="text-[10px] text-text-ghost">({topic.count})</span>
                </button>
              ))}
            </div>
          </section>

          {/* Top Contributors */}
          <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-text-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Top Contributors</span>
              </h3>
              <button onClick={() => setActiveTab("leaderboard")} className="text-xs font-mono text-primary hover:underline">
                Leaderboard
              </button>
            </div>

            <div className="space-y-3">
              {topContributors.map((user, idx) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserProfile(user)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-void/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-amber-400">#{idx + 1}</span>
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-text-primary">{user.name}</p>
                      <p className="text-[10px] font-mono text-text-ghost">{user.role}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-primary font-bold">{user.reputation} rep</span>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Companies */}
          <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wide text-text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Featured Companies</span>
            </h3>

            <div className="space-y-3">
              {featuredCompanies.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => setSelectedUserProfile(comp)}
                  className="p-3 rounded-lg border border-border bg-void/30 hover:border-primary/40 cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <img src={comp.avatar} alt={comp.name} className="w-8 h-8 rounded-lg object-cover border border-border" />
                    <div>
                      <p className="text-xs font-bold text-text-primary flex items-center gap-1">
                        <span>{comp.name}</span>
                        <ShieldCheck className="w-3 h-3 text-primary" />
                      </p>
                      <p className="text-[10px] font-mono text-text-ghost">{comp.role}</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2">{comp.bio}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Community Guidelines Card */}
          <section className="rounded-xl border border-border bg-void/60 p-5 space-y-3 text-xs">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-text-primary">
              Community Guidelines
            </h3>
            <ul className="space-y-1.5 font-mono text-text-ghost list-disc list-inside">
              <li>Be respectful and constructive</li>
              <li>No spam or misleading promo listings</li>
              <li>Verify security claims before publishing</li>
              <li>Protect secrets & zero-day disclosures</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
