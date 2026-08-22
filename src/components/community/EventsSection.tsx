import React, { useState } from "react";
import { Calendar, Users, MapPin, Clock, Plus, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";
import { useCommunityStore, EventItem } from "@/lib/communityStore";
import { CyberButton } from "@/components/ui/CyberButton";
import toast from "react-hot-toast";

const types = ["All", "Hackathon", "Webinar", "Workshop", "Meetup", "Conference"];

export const EventsSection: React.FC = () => {
  const { events, searchQuery, setOpenCreateModalType, toggleRegisterEvent } = useCommunityStore();
  const [selectedType, setSelectedType] = useState("All");

  const filteredEvents = events.filter((evt) => {
    const matchesType = selectedType === "All" || evt.type === selectedType;
    const matchesSearch =
      !searchQuery ||
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleRegisterToggle = (evt: EventItem) => {
    toggleRegisterEvent(evt.id);
    if (!evt.isRegistered) {
      toast.success(`Registered for "${evt.title}"! Access pass sent.`);
    } else {
      toast.error(`Cancelled registration for "${evt.title}".`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl uppercase tracking-wide text-text-primary flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pink-400" />
            <span>Developer & Security Events</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Join security workshops, live hackathons, virtual panels, and tech meetups.
          </p>
        </div>

        <CyberButton
          variant="primary"
          size="sm"
          onClick={() => setOpenCreateModalType("event")}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Host an Event</span>
        </CyberButton>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all ${
              selectedType === type
                ? "bg-pink-500 text-void font-bold shadow-[0_0_12px_rgba(236,72,153,0.4)]"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-pink-500/40"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center space-y-3">
            <Calendar className="w-8 h-8 text-text-ghost mx-auto" />
            <p className="font-mono text-sm text-text-secondary">No events scheduled in this category.</p>
            <CyberButton variant="secondary" size="sm" onClick={() => setOpenCreateModalType("event")}>
              Create an Event
            </CyberButton>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="rounded-xl border border-border bg-surface hover:border-pink-400/40 transition-all flex flex-col justify-between p-6 space-y-5 shadow-xl relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={evt.organizerAvatar}
                      alt={evt.organizer}
                      className="w-10 h-10 rounded-xl object-cover border border-border"
                    />
                    <div>
                      <span className="font-mono text-[10px] text-pink-400 uppercase font-bold tracking-wider">
                        {evt.type}
                      </span>
                      <h3 className="font-bold text-base text-text-primary leading-snug">{evt.title}</h3>
                    </div>
                  </div>
                </div>

                {/* Details Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-text-ghost">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg border border-border bg-void">
                    <Calendar className="w-3.5 h-3.5 text-pink-400" />
                    <span className="truncate">{evt.date}</span>
                  </div>

                  <div className="flex items-center gap-1.5 p-2 rounded-lg border border-border bg-void">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">{evt.time}</span>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{evt.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {evt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-void border border-border text-[10px] font-mono text-text-ghost"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-between font-mono text-xs">
                <span className="flex items-center gap-1.5 text-text-ghost">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>{evt.attendeesCount} attending</span>
                </span>

                <CyberButton
                  variant={evt.isRegistered ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => handleRegisterToggle(evt)}
                  className="flex items-center gap-1.5"
                >
                  {evt.isRegistered ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Registered</span>
                    </>
                  ) : (
                    <span>Register →</span>
                  )}
                </CyberButton>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
