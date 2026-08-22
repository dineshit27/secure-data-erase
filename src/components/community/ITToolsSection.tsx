import React, { useState } from "react";
import {
  Wrench,
  Search,
  Star,
  ExternalLink,
  Plus,
  Filter,
  CheckCircle2,
  Bookmark,
  Cpu,
  Code,
  Globe
} from "lucide-react";
import { useCommunityStore, ITToolItem } from "@/lib/communityStore";
import { CyberButton } from "@/components/ui/CyberButton";
import toast from "react-hot-toast";

const categories = [
  "All",
  "Security",
  "AI",
  "Development",
  "Testing",
  "DevOps",
  "Cloud",
  "Database",
  "Design",
  "Productivity",
  "Monitoring",
  "Open Source"
];

const pricingOptions = ["All", "Free", "Freemium", "Paid", "Open Source"];

export const ITToolsSection: React.FC = () => {
  const { tools, searchQuery, setOpenCreateModalType, toggleBookmarkTool } = useCommunityStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPricing, setSelectedPricing] = useState("All");
  const [onlyAIPowered, setOnlyAIPowered] = useState(false);
  const [onlyOpenSource, setOnlyOpenSource] = useState(false);

  const filteredTools = tools.filter((t) => {
    const matchesCat = selectedCategory === "All" || t.category === selectedCategory;
    const matchesPrice = selectedPricing === "All" || t.pricingType === selectedPricing;
    const matchesAI = !onlyAIPowered || t.isAIPowered;
    const matchesOS = !onlyOpenSource || t.isOpenSource;
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesPrice && matchesAI && matchesOS && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl uppercase tracking-wide text-text-primary flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-400" />
            <span>IT & Security Tools Directory</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Searchable catalog of developer software, security utilities, penetration testing suites, and AI engines.
          </p>
        </div>

        <CyberButton
          variant="primary"
          size="sm"
          onClick={() => setOpenCreateModalType("tool")}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Submit a Tool</span>
        </CyberButton>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-amber-400 text-void font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                  : "bg-void border border-border text-text-secondary hover:text-text-primary hover:border-amber-400/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sub-Filters: Pricing & Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/60 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-text-ghost uppercase">Pricing:</span>
            {pricingOptions.map((price) => (
              <button
                key={price}
                onClick={() => setSelectedPricing(price)}
                className={`px-2.5 py-1 rounded-lg border transition-colors ${
                  selectedPricing === price
                    ? "border-amber-400 text-amber-400 font-bold bg-amber-400/10"
                    : "border-border text-text-ghost hover:text-text-primary"
                }`}
              >
                {price}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
              <input
                type="checkbox"
                checked={onlyAIPowered}
                onChange={(e) => setOnlyAIPowered(e.target.checked)}
                className="rounded border-border bg-void text-amber-400 focus:ring-amber-400"
              />
              <span>⚡ AI-Powered Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
              <input
                type="checkbox"
                checked={onlyOpenSource}
                onChange={(e) => setOnlyOpenSource(e.target.checked)}
                className="rounded border-border bg-void text-amber-400 focus:ring-amber-400"
              />
              <span>🌐 Open Source Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.length === 0 ? (
          <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center space-y-3">
            <Wrench className="w-8 h-8 text-text-ghost mx-auto" />
            <p className="font-mono text-sm text-text-secondary">No tools match your active filter criteria.</p>
            <CyberButton variant="secondary" size="sm" onClick={() => { setSelectedCategory("All"); setSelectedPricing("All"); setOnlyAIPowered(false); setOnlyOpenSource(false); }}>
              Reset Filters
            </CyberButton>
          </div>
        ) : (
          filteredTools.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-surface hover:border-amber-400/40 transition-all flex flex-col justify-between p-5 space-y-4 shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.logo}
                      alt={t.name}
                      className="w-11 h-11 rounded-xl object-cover border border-border shadow"
                    />
                    <div>
                      <h3 className="font-bold text-base text-text-primary">{t.name}</h3>
                      <span className="font-mono text-[10px] text-text-ghost uppercase">{t.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBookmarkTool(t.id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      t.userBookmarked
                        ? "border-amber-400 text-amber-400 bg-amber-400/10"
                        : "border-border text-text-ghost hover:text-text-primary"
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">{t.description}</p>

                {/* Platforms & Pricing Badges */}
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded border border-amber-400/30 bg-amber-400/10 text-amber-400 uppercase font-bold">
                    {t.pricingType}
                  </span>

                  {t.platform.map((plat) => (
                    <span key={plat} className="px-2 py-0.5 rounded bg-void border border-border text-text-ghost">
                      {plat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{t.rating}</span>
                  <span className="text-[10px] text-text-ghost font-normal">({t.reviewsCount})</span>
                </div>

                <a
                  href={t.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-amber-400 hover:underline"
                >
                  <span>Visit Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
