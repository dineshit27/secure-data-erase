import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  ExternalLink,
  Flame,
  Megaphone,
  MessageSquare,
  Newspaper,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CyberButton } from "@/components/ui/CyberButton";
import {
  CommunityAnnouncement,
  CommunityDiscussion,
  CommunityNewsItem,
  CommunityOverview,
  CommunityTopic,
  fetchCommunityOverview,
  logClientRun,
} from "@/lib/api";

const riskClassMap: Record<string, string> = {
  low: "text-primary border-primary/30 bg-primary/10",
  medium: "text-[hsl(43_100%_50%)] border-[hsl(43_100%_50%/0.3)] bg-[hsl(43_100%_50%/0.08)]",
  high: "text-[hsl(0_100%_61%)] border-[hsl(0_100%_61%/0.3)] bg-[hsl(0_100%_61%/0.08)]",
  critical: "text-[hsl(0_100%_61%)] border-[hsl(0_100%_61%/0.45)] bg-[hsl(0_100%_61%/0.16)]",
};

const announcementTone: Record<string, string> = {
  security: "border-[hsl(0_100%_61%/0.25)]",
  feature: "border-primary/25",
  product: "border-border",
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const Community = () => {
  const [data, setData] = useState<CommunityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>("all");

  const loadOverview = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await fetchCommunityOverview(10);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load community feed");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    logClientRun({ toolId: "community", action: "view-community-page", status: "success" });

    const timer = window.setInterval(() => {
      loadOverview(true);
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const filteredDiscussions = useMemo(() => {
    const discussions = data?.most_discussed ?? [];
    if (activeTopic === "all") return discussions;
    const normalized = activeTopic.replace("#", "").toLowerCase();
    const selected = discussions.filter((d) => d.title.toLowerCase().includes(normalized));
    return selected.length > 0 ? selected : discussions;
  }, [data?.most_discussed, activeTopic]);

  const alertsBySeverity = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const alert of data?.threat_alerts ?? []) {
      if (alert.severity in counts) {
        counts[alert.severity as keyof typeof counts] += 1;
      }
    }
    return counts;
  }, [data?.threat_alerts]);

  return (
    <PageWrapper>
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="font-mono text-xs tracking-[4px] uppercase text-primary mb-2">Community Intelligence Hub</p>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase text-text-primary">SecureDel Community</h1>
              <p className="text-sm text-text-secondary mt-3 max-w-2xl">
                Live announcements, active threat intelligence, trending cyber topics, and security conversations from the
                SecureDel ecosystem.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[250px]">
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="text-xs font-mono text-text-ghost uppercase tracking-[2px]">Active Members</div>
                <div className="text-lg font-semibold text-text-primary">{data?.meta.active_members ?? "--"}</div>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="text-xs font-mono text-text-ghost uppercase tracking-[2px]">Online Now</div>
                <div className="text-lg font-semibold text-primary">{data?.meta.online_now ?? "--"}</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-[hsl(0_100%_61%/0.25)] bg-[hsl(0_100%_61%/0.08)] px-4 py-3 text-sm text-[hsl(0_100%_75%)]">
            Failed to load live community data: {error}
          </div>
        )}

        {loading && !data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-36 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <section className="xl:col-span-2 rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-xl uppercase text-text-primary">Announcements</h2>
                </div>
                <div className="space-y-3">
                  {(data?.announcements ?? []).map((announcement: CommunityAnnouncement) => (
                    <article
                      key={announcement.id}
                      className={`rounded-lg border ${announcementTone[announcement.type] ?? "border-border"} bg-void/35 p-4`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">{announcement.title}</h3>
                          <p className="text-sm text-text-secondary mt-1">{announcement.summary}</p>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[2px] text-text-ghost">{announcement.type}</span>
                      </div>
                      <p className="font-mono text-[11px] text-text-ghost mt-2">{formatTime(announcement.published_at)}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-xl uppercase text-text-primary">Security Tip</h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{data?.tip_of_the_day?.text}</p>
                <p className="font-mono text-[11px] text-text-ghost mt-3">Rotates daily to keep practices fresh.</p>
                <Link to="/try-now" className="inline-block mt-4">
                  <CyberButton variant="secondary" size="sm">Try Tools</CyberButton>
                </Link>
              </section>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <section className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-xl uppercase text-text-primary">Trending Topics</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTopic("all")}
                    className={`px-2.5 py-1 rounded-md border text-xs font-mono ${
                      activeTopic === "all" ? "border-primary text-primary" : "border-border text-text-secondary"
                    }`}
                  >
                    #All
                  </button>
                  {(data?.trending_topics ?? []).map((topic: CommunityTopic) => (
                    <button
                      key={topic.tag}
                      onClick={() => setActiveTopic(topic.tag)}
                      className={`px-2.5 py-1 rounded-md border text-xs font-mono transition-colors ${
                        activeTopic === topic.tag
                          ? "border-primary text-primary"
                          : riskClassMap[topic.risk] ?? "border-border text-text-secondary"
                      }`}
                    >
                      {topic.tag} ({topic.mentions})
                    </button>
                  ))}
                </div>
              </section>

              <section className="xl:col-span-2 rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-xl uppercase text-text-primary">Most Discussed</h2>
                </div>
                <div className="space-y-3">
                  {filteredDiscussions.map((thread: CommunityDiscussion) => (
                    <article key={thread.id} className="rounded-lg border border-border bg-void/35 p-4">
                      <h3 className="text-sm font-semibold text-text-primary">{thread.title}</h3>
                      <div className="mt-2 text-xs text-text-secondary flex flex-wrap gap-x-4 gap-y-1 font-mono">
                        <span>by {thread.author}</span>
                        <span>{thread.replies} replies</span>
                        <span>{thread.views} views</span>
                        <span>updated {formatTime(thread.last_activity)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <section className="xl:col-span-2 rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-xl uppercase text-text-primary">Security News Feed</h2>
                </div>
                <div className="space-y-3">
                  {(data?.security_news ?? []).map((news: CommunityNewsItem) => (
                    <article key={`${news.source}-${news.url}`} className="rounded-lg border border-border bg-void/35 p-4">
                      <a href={news.url} target="_blank" rel="noreferrer" className="group">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                              {news.title}
                            </h3>
                            <p className="font-mono text-xs text-text-ghost mt-2">
                              {news.source} • {formatTime(news.published_at)}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-text-ghost group-hover:text-primary transition-colors" />
                        </div>
                      </a>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-[hsl(0_100%_61%)]" />
                  <h2 className="font-display text-xl uppercase text-text-primary">Threat Alerts</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.entries(alertsBySeverity).map(([level, count]) => (
                    <span key={level} className={`px-2 py-1 rounded border text-xs font-mono ${riskClassMap[level] ?? "border-border"}`}>
                      {level}: {count}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  {(data?.threat_alerts ?? []).map((alert) => (
                    <article key={alert.id} className="rounded-lg border border-border bg-void/35 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-text-primary">{alert.title}</h3>
                        <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-mono ${riskClassMap[alert.severity] ?? "border-border"}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{alert.description}</p>
                      <p className="font-mono text-[11px] text-text-ghost mt-2">{alert.scope} • {formatTime(alert.published_at)}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-primary" />
                <h2 className="font-display text-xl uppercase text-text-primary">Promoted Security Tools</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(data?.promoted ?? []).map((ad) => (
                  <article key={ad.id} className="rounded-lg border border-border bg-void/35 p-4">
                    <p className="text-sm font-semibold text-text-primary">{ad.name}</p>
                    <p className="font-mono text-[11px] text-primary uppercase tracking-[1px] mt-1">{ad.category}</p>
                    <p className="text-xs text-text-secondary mt-2">{ad.blurb}</p>
                    <a
                      href={ad.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary mt-3 hover:underline"
                    >
                      Visit <ExternalLink className="w-3 h-3" />
                    </a>
                  </article>
                ))}
              </div>
            </section>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Users className="w-4 h-4 text-primary" />
                Last refreshed: {formatTime(data?.meta.generated_at ?? new Date().toISOString())}
              </div>
              <div className="flex items-center gap-3">
                <Link to="/try-now">
                  <CyberButton variant="secondary" size="sm">Explore Tools</CyberButton>
                </Link>
                <Link to="/app/runs-history">
                  <CyberButton variant="primary" size="sm">View Activity</CyberButton>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </PageWrapper>
  );
};

export default Community;
