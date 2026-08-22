import React, { useEffect } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CommunityNav } from "@/components/community/CommunityNav";
import { CommunityHome } from "@/components/community/CommunityHome";
import { DiscussionsSection } from "@/components/community/DiscussionsSection";
import { ProjectsSection } from "@/components/community/ProjectsSection";
import { TechShowcaseSection } from "@/components/community/TechShowcaseSection";
import { ITToolsSection } from "@/components/community/ITToolsSection";
import { QASection } from "@/components/community/QASection";
import { EventsSection } from "@/components/community/EventsSection";
import { LeaderboardSection } from "@/components/community/LeaderboardSection";
import { UserProfileDrawer } from "@/components/community/UserProfileDrawer";
import { CreateContentModal } from "@/components/community/CreateContentModal";
import { ModerationModal } from "@/components/community/ModerationModal";
import { useCommunityStore } from "@/lib/communityStore";
import { logClientRun } from "@/lib/api";

const Community: React.FC = () => {
  const { activeTab } = useCommunityStore();

  useEffect(() => {
    logClientRun({ toolId: "community", action: "view-community-page", status: "success" });
  }, []);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-void text-text-primary pt-16">
        {/* Sticky Community Navigation Bar */}
        <CommunityNav />

        {/* Dynamic Section Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          {activeTab === "home" && <CommunityHome />}
          {activeTab === "discussions" && <DiscussionsSection />}
          {activeTab === "projects" && <ProjectsSection />}
          {activeTab === "showcase" && <TechShowcaseSection />}
          {activeTab === "tools" && <ITToolsSection />}
          {activeTab === "questions" && <QASection />}
          {activeTab === "events" && <EventsSection />}
          {activeTab === "leaderboard" && <LeaderboardSection />}
        </main>

        {/* Modals & Drawers */}
        <UserProfileDrawer />
        <CreateContentModal />
        <ModerationModal />
      </div>
    </PageWrapper>
  );
};

export default Community;
