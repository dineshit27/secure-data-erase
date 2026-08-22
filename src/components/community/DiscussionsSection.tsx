import React, { useState } from "react";
import {
  MessageSquare,
  Bookmark,
  Share2,
  Flag,
  Flame,
  Search,
  Plus,
  Send,
  UserCheck,
  UserPlus,
  ThumbsUp,
  ThumbsDown,
  Eye,
  CornerDownRight
} from "lucide-react";
import { useCommunityStore, DiscussionItem, CommunityUser } from "@/lib/communityStore";
import { CyberButton } from "@/components/ui/CyberButton";
import toast from "react-hot-toast";

const categories = [
  "All",
  "Cybersecurity",
  "Web Development",
  "AI & ML",
  "DevOps",
  "Cloud",
  "Privacy",
  "Open Source",
  "Programming",
  "IT Infrastructure",
  "Developer Tools",
  "Career",
  "Startups"
];

export const DiscussionsSection: React.FC = () => {
  const {
    discussions,
    searchQuery,
    setOpenCreateModalType,
    setSelectedUserProfile,
    toggleUpvoteDiscussion,
    toggleBookmarkDiscussion,
    addDiscussionComment,
    setReportingItem
  } = useCommunityStore();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  const filteredDiscussions = discussions.filter((d) => {
    const matchesCat = selectedCategory === "All" || d.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCommentSubmit = (discussionId: string) => {
    const text = commentInput[discussionId]?.trim();
    if (!text) return;
    addDiscussionComment(discussionId, text);
    setCommentInput((prev) => ({ ...prev, [discussionId]: "" }));
    toast.success("Comment posted!");
  };

  const handleShare = (title: string) => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success(`Copied link to "${title}"`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl uppercase tracking-wide text-text-primary flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            <span>Community Discussions</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Exchange security techniques, code practices, architecture debates, and hardware privacy insights.
          </p>
        </div>

        <CyberButton
          variant="primary"
          size="sm"
          onClick={() => setOpenCreateModalType("discussion")}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion</span>
        </CyberButton>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-primary text-void font-bold shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Discussions Feed */}
      <div className="space-y-4">
        {filteredDiscussions.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-12 text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-text-ghost mx-auto" />
            <p className="font-mono text-sm text-text-secondary">No discussions found in this category.</p>
            <CyberButton variant="secondary" size="sm" onClick={() => setOpenCreateModalType("discussion")}>
              Be the first to post
            </CyberButton>
          </div>
        ) : (
          filteredDiscussions.map((disc) => {
            const isExpanded = expandedDiscussionId === disc.id;
            return (
              <article
                key={disc.id}
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? "border-primary/50 bg-surface shadow-[0_0_30px_hsl(var(--primary)/0.08)]"
                    : "border-border bg-surface hover:border-primary/30"
                } p-5 space-y-4`}
              >
                {/* Header Metadata */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={disc.author.avatar}
                      alt={disc.author.name}
                      onClick={() => setSelectedUserProfile(disc.author as unknown as CommunityUser)}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer border border-border hover:border-primary transition-colors"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => setSelectedUserProfile(disc.author as unknown as CommunityUser)}
                          className="font-semibold text-xs sm:text-sm text-text-primary cursor-pointer hover:text-primary transition-colors"
                        >
                          {disc.author.name}
                        </span>
                        <span className="font-mono text-[11px] text-text-ghost">{disc.author.username}</span>
                        {disc.author.badge && (
                          <span className="px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary font-mono text-[9px] font-bold uppercase">
                            {disc.author.badge}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-text-ghost mt-0.5">{disc.createdAt}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg border border-border bg-void/60 text-primary font-mono text-xs uppercase">
                      {disc.category}
                    </span>
                    <button
                      onClick={() => toggleBookmarkDiscussion(disc.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        disc.userBookmarked
                          ? "border-primary text-primary bg-primary/10"
                          : "border-border text-text-ghost hover:text-text-primary"
                      }`}
                      title="Bookmark"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShare(disc.title)}
                      className="p-1.5 rounded-lg border border-border text-text-ghost hover:text-text-primary transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setReportingItem({ type: "post", id: disc.id, title: disc.title })}
                      className="p-1.5 rounded-lg border border-border text-text-ghost hover:text-danger transition-colors"
                      title="Report"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3
                    onClick={() => setExpandedDiscussionId(isExpanded ? null : disc.id)}
                    className="font-bold text-base sm:text-lg text-text-primary hover:text-primary cursor-pointer transition-colors"
                  >
                    {disc.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{disc.description}</p>

                  {isExpanded && disc.content && (
                    <div className="mt-4 p-4 rounded-xl border border-border bg-void/60 text-xs sm:text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                      {disc.content}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {disc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-surface-2 border border-border text-[10px] font-mono text-text-ghost"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleUpvoteDiscussion(disc.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                        disc.userUpvoted
                          ? "border-primary text-primary bg-primary/10 font-bold"
                          : "border-border text-text-secondary hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{disc.upvotes}</span>
                    </button>

                    <button
                      onClick={() => setExpandedDiscussionId(isExpanded ? null : disc.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{disc.commentsCount} Comments</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-text-ghost">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {disc.views}
                    </span>
                    <button
                      onClick={() => setExpandedDiscussionId(isExpanded ? null : disc.id)}
                      className="text-primary hover:underline"
                    >
                      {isExpanded ? "Collapse ▲" : "Expand Thread ▼"}
                    </button>
                  </div>
                </div>

                {/* Expanded Comments Thread */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInput[disc.id] || ""}
                        onChange={(e) =>
                          setCommentInput((prev) => ({ ...prev, [disc.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit(disc.id)}
                        placeholder="Write a constructive response..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-void text-xs font-mono text-text-primary placeholder:text-text-ghost focus:outline-none focus:border-primary/60"
                      />
                      <CyberButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleCommentSubmit(disc.id)}
                        className="flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post</span>
                      </CyberButton>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {disc.comments.length === 0 ? (
                        <p className="font-mono text-xs text-text-ghost italic py-2">
                          No responses yet. Be the first to reply!
                        </p>
                      ) : (
                        disc.comments.map((c) => (
                          <div key={c.id} className="p-3 rounded-xl border border-border bg-void/30 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 font-mono">
                                <img src={c.author.avatar} alt={c.author.name} className="w-5 h-5 rounded-full object-cover" />
                                <span className="font-bold text-text-primary">{c.author.name}</span>
                                <span className="text-text-ghost">{c.author.username}</span>
                              </div>
                              <span className="font-mono text-[10px] text-text-ghost">{c.createdAt}</span>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed pl-7">{c.content}</p>

                            {/* Nested replies */}
                            {c.replies?.map((r) => (
                              <div key={r.id} className="ml-7 mt-2 p-2.5 rounded-lg border border-border/60 bg-surface/50 flex items-start gap-2">
                                <CornerDownRight className="w-3.5 h-3.5 text-text-ghost shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 font-mono text-[11px]">
                                    <span className="font-bold text-text-primary">{r.author.name}</span>
                                    <span className="text-text-ghost">{r.createdAt}</span>
                                  </div>
                                  <p className="text-xs text-text-secondary">{r.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
