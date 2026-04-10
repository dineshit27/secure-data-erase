import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  at: string;
}

const STARTER: ChatMessage = {
  id: "assistant-starter",
  role: "assistant",
  text: "Hi, I am SecureDel AI assistant. Ask me about tools, plans, community updates, or type: open subscription, open community, or open try now.",
  at: new Date().toISOString(),
};

const QUICK_ACTIONS = ["Best plan for me", "How to use file wiper", "Open subscription", "Open community"];

const getPageSuggestions = (pathname: string): string[] => {
  if (pathname.startsWith("/subscription")) {
    return ["Pro vs Elite", "Yearly savings", "Compare plans", "Open try now"];
  }
  if (pathname.startsWith("/community")) {
    return ["Open threat alerts", "Trending topics", "Open subscription", "Open try now"];
  }
  if (pathname.startsWith("/try-now") || pathname.startsWith("/app")) {
    return ["How to use file wiper", "Temp cleaner", "Runs history", "Open subscription"];
  }
  return ["Open try now", "Open community", "Open subscription", "How to use file wiper"];
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "now";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const storageKey = "securedel.ai.chat.messages";

export const AIChatbot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed.slice(-30));
      }
    } catch {
      // Ignore invalid local data.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  const suggestions = useMemo(() => {
    const pageSuggestions = getPageSuggestions(location.pathname);
    const recentUser = [...messages].reverse().find((message) => message.role === "user")?.text?.toLowerCase() ?? "";

    if (recentUser.includes("plan") || recentUser.includes("subscription")) {
      return ["Open subscription", "Pro vs Elite", "Yearly savings"];
    }
    if (recentUser.includes("tool") || recentUser.includes("delete")) {
      return ["Open try now", "File wiper guide", "Temp cleaner"];
    }
    if (recentUser.includes("community") || recentUser.includes("threat")) {
      return ["Open community", "Open threat alerts", "Trending topics"];
    }

    return pageSuggestions.length > 0 ? pageSuggestions : QUICK_ACTIONS;
  }, [location.pathname, messages]);

  const pushAssistant = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text,
        at: new Date().toISOString(),
      },
    ]);
  };

  const pushUser = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text,
        at: new Date().toISOString(),
      },
    ]);
  };

  const replyFor = (raw: string) => {
    const text = raw.trim().toLowerCase();

    if (!text) return "Please type a message so I can help.";

    if (text.includes("open subscription") || text.includes("subscription")) {
      navigate("/subscription");
      return "Opened Subscription. Free is best for basics, Pro is best value for most users, and Elite is best for advanced protection and unlimited AI.";
    }

    if (text.includes("open community") || text.includes("community")) {
      navigate("/community");
      return "Opened Community. You can follow announcements, threat alerts, trending topics, and daily security tips there.";
    }

    if (text.includes("open try now") || text.includes("try now") || text.includes("tools")) {
      navigate("/try-now");
      return "Opened Try Now. Start with File Wiper for secure deletion, then Temp Cleaner and Log Scanner for deeper hygiene.";
    }

    if (text.includes("file wiper") || text.includes("secure deletion")) {
      return "Use File Wiper for permanent deletion. Choose your target file/folder, select overwrite method, run, and verify completion in Runs History.";
    }

    if (text.includes("pro vs elite") || text.includes("elite") || text.includes("pro")) {
      return "Pro includes unlimited deletions and essential cleaners. Elite adds secret leakage scanner, risk analyzer, unlimited AI chatbot, threat alerts, live feed, and early access.";
    }

    if (text.includes("yearly") || text.includes("save")) {
      return "Yearly billing gives lower effective monthly cost. On Subscription page, switch to yearly to compare savings instantly.";
    }

    if (text.includes("hello") || text.includes("hi")) {
      return "Hello. I can guide you through plans, tools, and community resources. Try asking: Which plan should I choose?";
    }

    return "I can help with plans, tools, and community navigation. Try: Open subscription, Open try now, or How to use file wiper.";
  };

  const handleSend = (value: string) => {
    const text = value.trim();
    if (!text) return;

    pushUser(text);
    setInput("");
    setTyping(true);

    window.setTimeout(() => {
      const reply = replyFor(text);
      setTyping(false);
      pushAssistant(reply);
    }, 450);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[85] pointer-events-none">
      {open && (
        <div className="pointer-events-auto mb-3 w-[min(24rem,calc(100vw-1rem))] rounded-2xl border border-primary/25 bg-surface/95 backdrop-blur-xl shadow-[0_0_40px_hsl(157_100%_50%/0.18)] overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[2px] text-primary">SecureDel AI</p>
                <p className="text-[11px] text-text-ghost">Assistant online</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-md border border-border hover:border-primary/35 text-text-secondary hover:text-primary flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="h-[52vh] max-h-[420px] min-h-[280px] overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 border ${
                    message.role === "assistant"
                      ? "bg-void/70 border-border text-text-secondary"
                      : "bg-primary/15 border-primary/30 text-text-primary"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className="font-mono text-[10px] text-text-ghost mt-1">{formatTime(message.at)}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-xl px-3 py-2 border border-border bg-void/70">
                  <p className="font-mono text-xs text-primary animate-pulse">thinking...</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-3 pb-2 flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSend(item)}
                className="text-[11px] font-mono px-2 py-1 rounded-md border border-border hover:border-primary/30 hover:text-primary text-text-secondary transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="p-3 pt-1 border-t border-border flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask SecureDel AI..."
              className="w-full rounded-lg bg-void border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-ghost focus:outline-none focus:border-primary/40"
            />
            <button
              type="submit"
              className="shrink-0 w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:shadow-[0_0_20px_hsl(157_100%_50%/0.35)] transition-shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close AI chatbot" : "Open AI chatbot"}
        className="pointer-events-auto ml-auto relative w-14 h-14 rounded-full border border-primary/35 bg-primary text-primary-foreground shadow-[0_0_30px_hsl(157_100%_50%/0.35)] hover:scale-[1.03] active:scale-95 transition-transform flex items-center justify-center"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {!open && <Sparkles className="w-3 h-3 absolute -top-0.5 -right-0.5 text-primary-foreground/90" />}
      </button>
    </div>
  );
};
