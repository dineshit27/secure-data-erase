import React, { useState } from "react";
import {
  HelpCircle,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Eye,
  Plus,
  Bookmark,
  Share2,
  Sparkles,
  Send
} from "lucide-react";
import { useCommunityStore, QAQuestionItem, CommunityUser } from "@/lib/communityStore";
import { CyberButton } from "@/components/ui/CyberButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import toast from "react-hot-toast";

export const QASection: React.FC = () => {
  const {
    questions,
    searchQuery,
    setOpenCreateModalType,
    setSelectedUserProfile,
    toggleVoteQuestion,
    toggleVoteAnswer,
    markAnswerAccepted,
    addAnswer
  } = useCommunityStore();

  const [filterMode, setFilterMode] = useState<"all" | "unanswered" | "resolved">("all");
  const [activeQuestionModal, setActiveQuestionModal] = useState<QAQuestionItem | null>(null);
  const [answerInput, setAnswerInput] = useState("");

  const filteredQuestions = questions.filter((q) => {
    if (filterMode === "unanswered" && q.answersCount > 0) return false;
    if (filterMode === "resolved" && !q.isResolved) return false;

    return (
      !searchQuery ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handlePostAnswer = (questionId: string) => {
    if (!answerInput.trim()) return;
    addAnswer(questionId, answerInput.trim());
    setAnswerInput("");
    toast.success("Answer posted successfully!");

    // refresh active question modal
    const updated = useCommunityStore.getState().questions.find((q) => q.id === questionId);
    if (updated) setActiveQuestionModal(updated);
  };

  const handleAcceptAnswer = (questionId: string, answerId: string) => {
    markAnswerAccepted(questionId, answerId);
    toast.success("Marked as Accepted Answer! 🏆");
    const updated = useCommunityStore.getState().questions.find((q) => q.id === questionId);
    if (updated) setActiveQuestionModal(updated);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl uppercase tracking-wide text-text-primary flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-cyan-400" />
            <span>Technical Questions & Answers</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Stack Overflow style technical help desk. Get verified solutions for code bugs, disk wipe scripts, and security configs.
          </p>
        </div>

        <CyberButton
          variant="primary"
          size="sm"
          onClick={() => setOpenCreateModalType("question")}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ask Question</span>
        </CyberButton>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <button
          onClick={() => setFilterMode("all")}
          className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
            filterMode === "all" ? "bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          All Questions ({questions.length})
        </button>
        <button
          onClick={() => setFilterMode("resolved")}
          className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
            filterMode === "resolved" ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          ✓ Solved ({questions.filter((q) => q.isResolved).length})
        </button>
        <button
          onClick={() => setFilterMode("unanswered")}
          className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
            filterMode === "unanswered" ? "bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Unanswered ({questions.filter((q) => q.answersCount === 0).length})
        </button>
      </div>

      {/* Question Cards Feed */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-12 text-center space-y-3">
            <HelpCircle className="w-8 h-8 text-text-ghost mx-auto" />
            <p className="font-mono text-sm text-text-secondary">No technical questions found in this view.</p>
            <CyberButton variant="secondary" size="sm" onClick={() => setOpenCreateModalType("question")}>
              Ask a Question
            </CyberButton>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="rounded-xl border border-border bg-surface hover:border-cyan-400/40 transition-all p-5 space-y-4 flex flex-col sm:flex-row items-start gap-5 shadow-lg"
            >
              {/* Stats Badge Column */}
              <div className="flex sm:flex-col items-center gap-4 sm:gap-2 shrink-0 font-mono text-xs text-center border-b sm:border-b-0 sm:border-r border-border/60 pb-3 sm:pb-0 sm:pr-5 w-full sm:w-auto">
                <button
                  onClick={() => toggleVoteQuestion(q.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center min-w-[54px] ${
                    q.userVoted ? "border-cyan-400 bg-cyan-400/10 text-cyan-400 font-bold" : "border-border text-text-ghost hover:text-text-primary"
                  }`}
                >
                  <span className="text-sm">{q.votes}</span>
                  <span className="text-[9px] uppercase">votes</span>
                </button>

                <div
                  className={`p-2 rounded-xl border flex flex-col items-center min-w-[54px] ${
                    q.isResolved
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold"
                      : "border-border text-text-ghost"
                  }`}
                >
                  <span className="text-sm">{q.answersCount}</span>
                  <span className="text-[9px] uppercase">{q.isResolved ? "✓ Solved" : "answers"}</span>
                </div>
              </div>

              {/* Question Main Area */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3
                    onClick={() => setActiveQuestionModal(q)}
                    className="font-bold text-base sm:text-lg text-text-primary hover:text-cyan-400 cursor-pointer transition-colors"
                  >
                    {q.title}
                  </h3>

                  {q.isResolved && (
                    <span className="px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 font-mono text-[10px] font-bold text-emerald-400 uppercase shrink-0">
                      ✓ Accepted Answer
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-text-secondary line-clamp-2 leading-relaxed">{q.description}</p>

                {/* Tags & Author metadata */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {q.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-void border border-border text-[10px] font-mono text-cyan-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs text-text-ghost">
                    <span
                      onClick={() => setSelectedUserProfile(q.author as unknown as CommunityUser)}
                      className="cursor-pointer hover:text-text-primary flex items-center gap-1.5"
                    >
                      <img src={q.author.avatar} alt={q.author.name} className="w-5 h-5 rounded-full object-cover" />
                      <span>{q.author.name}</span>
                    </span>
                    <span>{q.createdAt}</span>
                    <CyberButton
                      variant="ghost"
                      size="sm"
                      className="text-xs text-cyan-400"
                      onClick={() => setActiveQuestionModal(q)}
                    >
                      Answer / View →
                    </CyberButton>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Question Details & Answer Modal */}
      {activeQuestionModal && (
        <Dialog open={!!activeQuestionModal} onOpenChange={() => setActiveQuestionModal(null)}>
          <DialogContent className="max-w-3xl border-border bg-surface text-text-primary max-h-[85vh] overflow-y-auto z-50">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">Question Details</span>
                {activeQuestionModal.isResolved && (
                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 font-mono text-xs font-bold">
                    ✓ Solved
                  </span>
                )}
              </div>
              <DialogTitle className="font-display font-bold text-xl uppercase tracking-wide text-text-primary">
                {activeQuestionModal.title}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-text-ghost">
                Asked by {activeQuestionModal.author.name} ({activeQuestionModal.author.username}) • {activeQuestionModal.createdAt}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              <div className="p-4 rounded-xl border border-border bg-void text-xs sm:text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {activeQuestionModal.description}
              </div>

              {/* Answers List */}
              <div className="space-y-4">
                <h4 className="font-display font-bold text-base uppercase tracking-wide text-text-primary flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Answers ({activeQuestionModal.answers.length})</span>
                </h4>

                {activeQuestionModal.answers.length === 0 ? (
                  <p className="font-mono text-xs text-text-ghost italic">
                    No answers submitted yet. Be the first to answer!
                  </p>
                ) : (
                  activeQuestionModal.answers.map((ans) => (
                    <div
                      key={ans.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        ans.isAccepted
                          ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                          : "border-border bg-void/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <img src={ans.author.avatar} alt={ans.author.name} className="w-6 h-6 rounded-full object-cover" />
                          <span className="font-bold text-text-primary">{ans.author.name}</span>
                          {ans.author.badge && (
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">
                              {ans.author.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {ans.isAccepted ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500 text-void font-mono text-[10px] font-bold uppercase">
                              ✓ Accepted Answer
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAcceptAnswer(activeQuestionModal.id, ans.id)}
                              className="font-mono text-[10px] text-emerald-400 hover:underline"
                            >
                              Mark Accepted
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {ans.content}
                      </p>

                      <div className="flex items-center justify-between pt-2 text-xs font-mono text-text-ghost border-t border-border/40">
                        <button
                          onClick={() => toggleVoteAnswer(activeQuestionModal.id, ans.id)}
                          className={`flex items-center gap-1 hover:text-cyan-400 ${
                            ans.userVoted ? "text-cyan-400 font-bold" : ""
                          }`}
                        >
                          ▲ {ans.votes} votes
                        </button>
                        <span>{ans.createdAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Submit Answer Form */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="font-mono text-xs text-cyan-400 uppercase tracking-widest">Your Answer</h4>
                <textarea
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Provide a clear, technical response with code snippets or CLI steps..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-border bg-void text-xs font-mono text-text-primary focus:outline-none focus:border-cyan-400"
                />
                <CyberButton
                  variant="primary"
                  size="sm"
                  onClick={() => handlePostAnswer(activeQuestionModal.id)}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Post Answer</span>
                </CyberButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
