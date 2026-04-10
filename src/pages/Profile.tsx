import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, Mail, Shield, LogOut, Key, Clock, CheckCircle2,
  Trash2, FileText, Chrome, Settings, UserCheck, UserPlus, Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import PrivacyHealthDashboard from "@/components/ui/PrivacyHealthDashboard";
import { useAuth } from "@/contexts/AuthContext";

const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const quickActions = [
  { icon: Trash2, label: "File Wiper", desc: "Secure multi-pass wipe", to: "/app/file-wiper" },
  { icon: Chrome, label: "Browser Cleaner", desc: "Deep browser wipe", to: "/app/browser-cleaner" },
  { icon: Key, label: "Secret Scanner", desc: "Find leaked credentials", to: "/app/secret-scanner" },
  { icon: FileText, label: "Log Scanner", desc: "Scan for sensitive data", to: "/app/log-scanner" },
];

const GuestProfile = () => {
  const { exitGuestMode } = useAuth();
  const navigate = useNavigate();
  return (
    <PageWrapper>
      <div className="py-28 px-4 sm:px-6 max-w-5xl mx-auto">
        <FadeUp>
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono text-[11px] text-primary tracking-[4px] uppercase">Guest Session</span>
              </div>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-text-primary uppercase tracking-wider">
                Welcome, <span className="text-primary">Guest</span>
              </h1>
              <p className="mt-2 font-mono text-sm text-text-secondary">You have full access to all tools. No account needed.</p>
            </div>
          </div>
        </FadeUp>

        {/* Upgrade banner */}
        <FadeUp delay={0.05}>
          <div className="mb-8 p-5 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-display font-bold text-text-primary text-sm">Save your history & settings</p>
                <p className="font-mono text-xs text-text-ghost mt-0.5">Create a free account to keep deletion logs, certificates, and preferences across sessions.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/auth?mode=signup" onClick={() => exitGuestMode()}>
                <CyberButton variant="primary" size="sm" data-testid="button-guest-upgrade">
                  <UserPlus className="inline w-3.5 h-3.5 mr-1.5" />
                  Create Account
                </CyberButton>
              </Link>
              <Link to="/auth" onClick={() => exitGuestMode()}>
                <CyberButton variant="ghost" size="sm" data-testid="button-guest-signin-profile">Sign In</CyberButton>
              </Link>
            </div>
          </div>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guest info card */}
          <FadeUp delay={0.1} className="lg:col-span-1">
            <div className="p-6 rounded-xl bg-surface border border-border h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-dashed border-primary/30 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-text-primary">Guest</p>
                  <p className="font-mono text-[10px] text-text-ghost uppercase tracking-widest">Anonymous Session</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Session Type", value: "Guest / Unauthenticated" },
                  { label: "Tools Access", value: "All 6 modules" },
                  { label: "History Saved", value: "This session only" },
                  { label: "Certificates", value: "Not available" },
                ].map((row) => (
                  <div key={row.label}>
                    <p className="font-mono text-[10px] text-text-ghost tracking-widest uppercase mb-1">{row.label}</p>
                    <p className="font-mono text-sm text-text-primary">{row.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-border">
                <button
                  onClick={() => { exitGuestMode(); navigate("/"); }}
                  data-testid="button-guest-exit-profile"
                  className="w-full flex items-center justify-center gap-2 font-mono text-xs text-[hsl(0_100%_61%)] hover:underline"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Exit Guest Mode
                </button>
              </div>
            </div>
          </FadeUp>

          {/* Right side */}
          <div className="lg:col-span-2 space-y-6">
            <FadeUp delay={0.15}>
              <TerminalWindow title="guest-session">
                <div className="space-y-1.5 text-xs">
                  <p className="text-primary">&gt; Guest session initialised.</p>
                  <p className="text-text-secondary">&gt; Auth: none (anonymous)</p>
                  <p className="text-text-secondary">&gt; Access: full tool suite</p>
                  <p className="text-text-secondary">&gt; Storage: session-scoped only</p>
                  <p className="text-primary mt-3">&gt; All 6 wipe modules available. _</p>
                </div>
              </TerminalWindow>
            </FadeUp>

            {/* Quick Actions — same as authenticated */}
            <FadeUp delay={0.2}>
              <div className="p-6 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-5">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-primary tracking-widest uppercase">Quick Actions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quickActions.map((action, i) => (
                    <Link
                      key={action.label}
                      to={action.to}
                      data-testid={`link-guest-action-${i}`}
                      className="flex items-center gap-3 p-3.5 rounded-lg bg-surface-2 border border-border hover:border-primary/30 hover:-translate-y-0.5 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                        <action.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm text-text-primary">{action.label}</p>
                        <p className="font-mono text-[10px] text-text-ghost">{action.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>

        <FadeUp delay={0.25} className="mt-6">
          <PrivacyHealthDashboard
            heading="Device Privacy Health"
            subtitle="Track cleanup coverage, active risks, and pending privacy actions in real time."
          />
        </FadeUp>
      </div>
    </PageWrapper>
  );
};

const Profile = () => {
  const { user, isGuest, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && !isGuest) navigate("/auth");
  }, [user, isGuest, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <p className="font-mono text-sm text-primary animate-pulse">AUTHENTICATING...</p>
      </div>
    );
  }

  if (isGuest && !user) return <GuestProfile />;

  if (!user) return null;

  const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Operator";
  const provider = user.app_metadata?.provider || "email";
  const createdAt = new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <PageWrapper>
      <div className="py-28 px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Header */}
        <FadeUp>
          <div className="flex items-start justify-between mb-12 flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[11px] text-primary tracking-[4px] uppercase">Authenticated Session</span>
              </div>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-text-primary uppercase tracking-wider">
                Welcome, <span className="text-primary">{displayName}</span>
              </h1>
              <p className="mt-2 font-mono text-sm text-text-secondary">Secure workspace is ready.</p>
            </div>
            <CyberButton variant="danger" size="sm" onClick={handleSignOut} data-testid="button-signout" className="shrink-0">
              <LogOut className="inline w-3.5 h-3.5 mr-1.5" />
              Sign Out
            </CyberButton>
          </div>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Info */}
          <FadeUp delay={0.1} className="lg:col-span-1">
            <div className="p-6 rounded-xl bg-surface border border-border h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-text-primary">{displayName}</p>
                  <p className="font-mono text-[10px] text-text-ghost uppercase tracking-widest">
                    {provider === "github" ? "GitHub OAuth" : "Email Auth"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-mono text-[10px] text-text-ghost tracking-widest uppercase mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <p className="font-mono text-sm text-text-primary break-all">{user.email}</p>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-text-ghost tracking-widest uppercase mb-1">Email Verified</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${user.email_confirmed_at ? "text-primary" : "text-text-ghost"}`} />
                    <p className="font-mono text-sm text-text-primary">{user.email_confirmed_at ? "Verified" : "Pending verification"}</p>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-text-ghost tracking-widest uppercase mb-1">Member Since</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <p className="font-mono text-sm text-text-primary">{createdAt}</p>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-text-ghost tracking-widest uppercase mb-1">Last Sign In</p>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                    <p className="font-mono text-sm text-text-primary">{lastSignIn}</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Right side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session terminal */}
            <FadeUp delay={0.15}>
              <TerminalWindow title="session-info">
                <div className="space-y-1.5 text-xs">
                  <p className="text-primary">&gt; Session established.</p>
                  <p className="text-text-secondary">&gt; User ID: {user.id.slice(0, 16)}...</p>
                  <p className="text-text-secondary">&gt; Provider: {provider}</p>
                  <p className="text-text-secondary">&gt; Role: {user.role || "authenticated"}</p>
                  <p className="text-primary mt-3">&gt; All wipe modules unlocked. _</p>
                </div>
              </TerminalWindow>
            </FadeUp>

            {/* Quick Actions */}
            <FadeUp delay={0.2}>
              <div className="p-6 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-5">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-primary tracking-widest uppercase">Quick Actions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quickActions.map((action, i) => (
                    <Link
                      key={action.label}
                      to={action.to}
                      data-testid={`link-action-${i}`}
                      className="flex items-center gap-3 p-3.5 rounded-lg bg-surface-2 border border-border hover:border-primary/30 hover:-translate-y-0.5 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                        <action.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm text-text-primary">{action.label}</p>
                        <p className="font-mono text-[10px] text-text-ghost">{action.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Security Status */}
            <FadeUp delay={0.25}>
              <div className="p-6 rounded-xl bg-surface border border-primary/15 shadow-[0_0_30px_hsl(157_100%_50%/0.04)]">
                <div className="flex items-center gap-2 mb-5">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-primary tracking-widest uppercase">Security Status</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Account Authentication", status: "✓ Active", ok: true },
                    { label: "Session Encryption", status: "✓ TLS 1.3", ok: true },
                    { label: "Email Verified", status: user.email_confirmed_at ? "✓ Confirmed" : "⚠ Pending", ok: !!user.email_confirmed_at },
                    { label: "Two-Factor Auth", status: "Available", ok: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="font-mono text-xs text-text-secondary">{item.label}</span>
                      <span className={`font-mono text-xs font-bold ${item.ok ? "text-primary" : "text-text-ghost"}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>

        <FadeUp delay={0.3} className="mt-6">
          <PrivacyHealthDashboard
            heading="Device Privacy Health"
            subtitle="Your live privacy health report with score, risk radar, and cleanup recommendations."
          />
        </FadeUp>
      </div>
    </PageWrapper>
  );
};

export default Profile;
