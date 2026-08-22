import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  ExternalLink,
  ThumbsUp,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Star,
  Award,
  Filter
} from "lucide-react";
import { useCommunityStore, TechShowcaseItem } from "@/lib/communityStore";
import { CyberButton } from "@/components/ui/CyberButton";

const categories = [
  "All",
  "SaaS",
  "Developer Tools",
  "AI Tools",
  "Cybersecurity",
  "Cloud",
  "DevOps",
  "Productivity",
  "Design",
  "APIs",
  "Open Source",
  "Infrastructure"
];

export const TechShowcaseSection: React.FC = () => {
  const { showcases, searchQuery, setOpenCreateModalType, toggleVoteShowcase } = useCommunityStore();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredShowcases = showcases.filter((s) => {
    const matchesCat = selectedCategory === "All" || s.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl uppercase tracking-wide text-text-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span>Tech Showcase & Product Hub</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Discover premier SaaS tools, AI security platforms, and technology products from verified companies.
          </p>
        </div>

        <CyberButton
          variant="primary"
          size="sm"
          onClick={() => setOpenCreateModalType("showcase")}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Promote Your Product</span>
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
                ? "bg-purple-500 text-void font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-purple-500/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShowcases.length === 0 ? (
          <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-text-ghost mx-auto" />
            <p className="font-mono text-sm text-text-secondary">No products listed in this showcase category.</p>
            <CyberButton variant="secondary" size="sm" onClick={() => setOpenCreateModalType("showcase")}>
              Create a Showcase
            </CyberButton>
          </div>
        ) : (
          filteredShowcases.map((item) => {
            const isSponsored = item.listingType === "sponsored";
            const isFeatured = item.listingType === "featured";

            return (
              <div
                key={item.id}
                className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden p-6 space-y-5 shadow-xl relative ${
                  isSponsored
                    ? "border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-surface to-surface shadow-[0_0_30px_rgba(245,158,11,0.12)]"
                    : isFeatured
                    ? "border-purple-500/50 bg-gradient-to-b from-purple-500/10 via-surface to-surface shadow-[0_0_30px_rgba(168,85,247,0.12)]"
                    : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.logo}
                      alt={item.productName}
                      className="w-12 h-12 rounded-xl object-cover border border-border shadow-md"
                    />
                    <div>
                      <h3 className="font-bold text-base text-text-primary leading-snug">{item.productName}</h3>
                      <p className="font-mono text-xs text-text-ghost">{item.companyName}</p>
                    </div>
                  </div>

                  {item.badgeText && (
                    <span
                      className={`px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider ${
                        isSponsored
                          ? "border border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                          : "border border-purple-500/40 bg-purple-500/15 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                      }`}
                    >
                      {item.badgeText}
                    </span>
                  )}
                </div>

                {/* Tagline & Description */}
                <div className="space-y-2">
                  <p className="font-semibold text-xs text-primary">{item.tagline}</p>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{item.description}</p>
                </div>

                {/* Highlights List */}
                <div className="space-y-1.5 pt-1">
                  {item.highlights.map((hl) => (
                    <div key={hl} className="flex items-center gap-2 font-mono text-xs text-text-primary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>

                {/* Rating & Action Footer */}
                <div className="pt-4 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{item.rating}</span>
                      <span className="text-text-ghost">({item.reviewsCount} reviews)</span>
                    </div>

                    <button
                      onClick={() => toggleVoteShowcase(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all ${
                        item.userVoted
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border text-text-secondary hover:text-text-primary hover:border-primary/40"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{item.votes} votes</span>
                    </button>
                  </div>

                  <a href={item.website} target="_blank" rel="noreferrer" className="block">
                    <CyberButton
                      variant={isSponsored ? "primary" : "secondary"}
                      size="sm"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <span>Explore Product</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </CyberButton>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Promotional Callout Footer */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-surface to-surface p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-lg text-text-primary uppercase tracking-wide">
            Want your tech product featured to 12.8K IT & Security decision makers?
          </h3>
          <p className="text-xs text-text-secondary">
            Promote your product on SecureDel Tech Showcase with Featured or Sponsored Spotlight placements.
          </p>
        </div>

        <CyberButton variant="primary" size="md" onClick={() => setOpenCreateModalType("showcase")} className="shrink-0">
          Create Listing
        </CyberButton>
      </div>
    </div>
  );
};
