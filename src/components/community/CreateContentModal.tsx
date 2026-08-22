import React, { useState } from "react";
import { MessageSquare, HelpCircle, FolderGit2, Wrench, Sparkles, Calendar, Plus, X } from "lucide-react";
import { useCommunityStore } from "@/lib/communityStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CyberButton } from "@/components/ui/CyberButton";
import toast from "react-hot-toast";

export const CreateContentModal: React.FC = () => {
  const { openCreateModalType, setOpenCreateModalType, addDiscussion, addQuestion, addProject, addTool, addShowcase, addEvent } = useCommunityStore();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Cybersecurity");
  const [tags, setTags] = useState("");
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [pricing, setPricing] = useState<"Free" | "Freemium" | "Paid" | "Open Source">("Free");
  const [listingType, setListingType] = useState<"free" | "featured" | "sponsored">("free");
  const [eventDate, setEventDate] = useState("");

  if (!openCreateModalType) return null;

  const handleClose = () => {
    setOpenCreateModalType(null);
    setTitle("");
    setDescription("");
    setCategory("Cybersecurity");
    setTags("");
    setUrl1("");
    setUrl2("");
    setPricing("Free");
    setListingType("free");
    setEventDate("");
  };

  const parseTags = () =>
    tags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => t.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please enter both a title and description!");
      return;
    }

    const parsedTagsList = parseTags().length > 0 ? parseTags() : ["Security", "Tech"];

    switch (openCreateModalType) {
      case "discussion":
        addDiscussion({
          title,
          description,
          content: description,
          category,
          tags: parsedTagsList,
          author: {
            id: "user-curr",
            name: "Operator",
            username: "@operator",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80",
            badge: "Community Member"
          }
        });
        toast.success("Discussion published!");
        break;

      case "question":
        addQuestion({
          title,
          description,
          category,
          tags: parsedTagsList,
          author: {
            id: "user-curr",
            name: "Operator",
            username: "@operator",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80"
          }
        });
        toast.success("Question submitted to Q&A!");
        break;

      case "project":
        addProject({
          name: title,
          tagline: description.slice(0, 120),
          description,
          logo: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=200&q=80",
          image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
          creator: {
            id: "user-curr",
            name: "Operator",
            username: "@operator",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80"
          },
          category,
          techStack: parsedTagsList,
          githubUrl: url1 || "https://github.com",
          demoUrl: url2 || "https://example.com",
          tags: parsedTagsList,
          license: "MIT",
          status: "Production"
        });
        toast.success("Project published to ecosystem!");
        break;

      case "tool":
        addTool({
          name: title,
          logo: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=150&q=80",
          description,
          category,
          website: url1 || "https://example.com",
          pricingType: pricing,
          platform: ["Windows", "Linux", "Web"],
          tags: parsedTagsList
        });
        toast.success("IT Tool added to directory!");
        break;

      case "showcase":
        addShowcase({
          productName: title,
          companyName: "Operator Tech Labs",
          logo: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=200&q=80",
          tagline: description.slice(0, 100),
          description,
          category,
          website: url1 || "https://example.com",
          tags: parsedTagsList,
          highlights: ["Developer Friendly", "Security Verified"],
          listingType,
          badgeText: listingType === "sponsored" ? "⚡ SPONSORED SPOTLIGHT" : listingType === "featured" ? "⭐ FEATURED" : undefined
        });
        toast.success("Tech Showcase created!");
        break;

      case "event":
        addEvent({
          title,
          type: "Workshop",
          date: eventDate || "SEP 15, 2026",
          time: "17:00 UTC",
          format: "Online",
          organizer: "SecureDel Community",
          organizerAvatar: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=150&q=80",
          description,
          tags: parsedTagsList
        });
        toast.success("Community Event scheduled!");
        break;
    }

    handleClose();
  };

  const getTitleText = () => {
    switch (openCreateModalType) {
      case "discussion":
        return "Start a Discussion";
      case "question":
        return "Ask a Technical Question";
      case "project":
        return "Publish a Project";
      case "tool":
        return "Submit an IT Tool";
      case "showcase":
        return "Create Tech Showcase";
      case "event":
        return "Host a Community Event";
    }
  };

  return (
    <Dialog open={!!openCreateModalType} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl border-border bg-surface text-text-primary z-50">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-xl uppercase tracking-wide text-primary">
            {getTitleText()}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-text-ghost">
            Fill out the details below to share with the SecureDel developer & security community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title input */}
          <div className="space-y-1">
            <label className="font-mono text-xs text-text-secondary uppercase">
              {openCreateModalType === "project" ? "Project Name *" : openCreateModalType === "tool" ? "Tool Name *" : "Title *"}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to manage secrets in production / SecureVault CLI..."
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Description input */}
          <div className="space-y-1">
            <label className="font-mono text-xs text-text-secondary uppercase">Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete context, code snippets, features, or background..."
              className="w-full p-3.5 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category & Tags Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-mono text-xs text-text-secondary uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Web Development">Web Development</option>
                <option value="AI & ML">AI & ML</option>
                <option value="DevOps">DevOps</option>
                <option value="Cloud">Cloud</option>
                <option value="Privacy">Privacy</option>
                <option value="Open Source">Open Source</option>
                <option value="Developer Tools">Developer Tools</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-xs text-text-secondary uppercase">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Security, React, DevOps"
                className="w-full px-3 py-2 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Type specific extra fields */}
          {(openCreateModalType === "project" || openCreateModalType === "tool" || openCreateModalType === "showcase") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-xs text-text-secondary uppercase">
                  {openCreateModalType === "project" ? "GitHub URL" : "Website URL"}
                </label>
                <input
                  type="url"
                  value={url1}
                  onChange={(e) => setUrl1(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              {openCreateModalType === "project" && (
                <div className="space-y-1">
                  <label className="font-mono text-xs text-text-secondary uppercase">Live Demo URL</label>
                  <input
                    type="url"
                    value={url2}
                    onChange={(e) => setUrl2(e.target.value)}
                    placeholder="https://my-app.example.com"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              {openCreateModalType === "tool" && (
                <div className="space-y-1">
                  <label className="font-mono text-xs text-text-secondary uppercase">Pricing Type</label>
                  <select
                    value={pricing}
                    onChange={(e) => setPricing(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="Free">Free</option>
                    <option value="Freemium">Freemium</option>
                    <option value="Paid">Paid</option>
                    <option value="Open Source">Open Source</option>
                  </select>
                </div>
              )}

              {openCreateModalType === "showcase" && (
                <div className="space-y-1">
                  <label className="font-mono text-xs text-text-secondary uppercase">Listing Promotion Tier</label>
                  <select
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="free">Community Listing (Free)</option>
                    <option value="featured">Featured Listing (⭐ Paid Promo)</option>
                    <option value="sponsored">Sponsored Spotlight (⚡ Premium)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {openCreateModalType === "event" && (
            <div className="space-y-1">
              <label className="font-mono text-xs text-text-secondary uppercase">Event Date & Time</label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="SEP 15, 2026 • 18:00 UTC"
                className="w-full px-3 py-2 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <CyberButton variant="ghost" size="sm" type="button" onClick={handleClose}>
              Cancel
            </CyberButton>

            <CyberButton variant="primary" size="sm" type="submit">
              Submit & Publish
            </CyberButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
