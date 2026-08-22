import React, { useState } from "react";
import {
  FolderGit2,
  Star,
  Eye,
  ExternalLink,
  Github,
  Plus,
  Tag,
  Bookmark,
  Share2,
  MessageSquare,
  CheckCircle2,
  Shield
} from "lucide-react";
import { useCommunityStore, ProjectItem, CommunityUser } from "@/lib/communityStore";
import { CyberButton } from "@/components/ui/CyberButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import toast from "react-hot-toast";

const categories = ["All", "Open Source", "Security", "AI & ML", "Developer Tools", "DevOps", "Personal", "Startup"];

export const ProjectsSection: React.FC = () => {
  const {
    projects,
    searchQuery,
    setOpenCreateModalType,
    setSelectedUserProfile,
    toggleStarProject,
    toggleBookmarkProject
  } = useCommunityStore();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeProjectModal, setActiveProjectModal] = useState<ProjectItem | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.techStack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleShare = (name: string) => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success(`Copied project link for "${name}"`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl uppercase tracking-wide text-text-primary flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-emerald-400" />
            <span>Developer Projects Ecosystem</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Discover, showcase, and star open-source security tools, AI apps, and developer side-projects.
          </p>
        </div>

        <CyberButton
          variant="primary"
          size="sm"
          onClick={() => setOpenCreateModalType("project")}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Project</span>
        </CyberButton>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-emerald-500 text-void font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-emerald-500/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center space-y-3">
            <FolderGit2 className="w-8 h-8 text-text-ghost mx-auto" />
            <p className="font-mono text-sm text-text-secondary">No projects published in this category yet.</p>
            <CyberButton variant="secondary" size="sm" onClick={() => setOpenCreateModalType("project")}>
              Submit a Project
            </CyberButton>
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="rounded-xl border border-border bg-surface hover:border-emerald-500/40 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
            >
              {/* Top Banner & Header */}
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={proj.logo}
                      alt={proj.name}
                      className="w-12 h-12 rounded-xl object-cover border border-border group-hover:border-emerald-500/50 transition-colors"
                    />
                    <div>
                      <h3
                        onClick={() => setActiveProjectModal(proj)}
                        className="font-bold text-base text-text-primary hover:text-emerald-400 cursor-pointer transition-colors"
                      >
                        {proj.name}
                      </h3>
                      <p
                        onClick={() => setSelectedUserProfile(proj.creator as unknown as CommunityUser)}
                        className="font-mono text-xs text-text-ghost hover:text-text-primary cursor-pointer"
                      >
                        by {proj.creator.name}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase font-bold">
                    {proj.status}
                  </span>
                </div>

                <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">{proj.tagline}</p>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded bg-void border border-border text-[10px] font-mono text-text-ghost"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-5 pt-0 space-y-3">
                <div className="flex items-center gap-2">
                  <CyberButton
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setActiveProjectModal(proj)}
                  >
                    View Project
                  </CyberButton>

                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl border border-border bg-void hover:border-text-primary text-text-ghost hover:text-text-primary transition-colors"
                      title="GitHub Repository"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}

                  {proj.demoUrl && (
                    <a
                      href={proj.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-void transition-colors"
                      title="Live Demo"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-mono text-text-ghost">
                  <button
                    onClick={() => toggleStarProject(proj.id)}
                    className={`flex items-center gap-1 hover:text-amber-400 transition-colors ${
                      proj.userStarred ? "text-amber-400 font-bold" : ""
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{proj.stars} stars</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {proj.views}
                    </span>
                    <button onClick={() => handleShare(proj.name)} className="hover:text-text-primary">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Project Details Modal */}
      {activeProjectModal && (
        <Dialog open={!!activeProjectModal} onOpenChange={() => setActiveProjectModal(null)}>
          <DialogContent className="max-w-2xl border-border bg-surface text-text-primary z-50">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <img
                  src={activeProjectModal.logo}
                  alt={activeProjectModal.name}
                  className="w-12 h-12 rounded-xl object-cover border border-border"
                />
                <div>
                  <DialogTitle className="font-display font-bold text-xl uppercase tracking-wide">
                    {activeProjectModal.name}
                  </DialogTitle>
                  <DialogDescription className="font-mono text-xs text-text-ghost">
                    Published by {activeProjectModal.creator.name} ({activeProjectModal.creator.username})
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-border overflow-hidden max-h-56 bg-void">
                <img
                  src={activeProjectModal.image}
                  alt={activeProjectModal.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-mono text-xs text-emerald-400 uppercase tracking-widest">About Project</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{activeProjectModal.description}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {activeProjectModal.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-lg border border-border bg-void text-xs font-mono text-text-primary"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-border">
                {activeProjectModal.demoUrl && (
                  <a href={activeProjectModal.demoUrl} target="_blank" rel="noreferrer" className="flex-1">
                    <CyberButton variant="primary" size="sm" className="w-full flex items-center justify-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <span>Visit Live Demo</span>
                    </CyberButton>
                  </a>
                )}

                {activeProjectModal.githubUrl && (
                  <a href={activeProjectModal.githubUrl} target="_blank" rel="noreferrer" className="flex-1">
                    <CyberButton variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
                      <Github className="w-4 h-4" />
                      <span>View Source Code</span>
                    </CyberButton>
                  </a>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
