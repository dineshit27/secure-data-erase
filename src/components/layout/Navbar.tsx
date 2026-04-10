import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Shield, User, LogOut, ChevronDown, UserCheck, UserPlus } from "lucide-react";
import { CyberButton } from "@/components/ui/CyberButton";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/try-now", label: "Try Now" },
  { to: "/community", label: "Community" },
  { to: "/contact", label: "Contact" },
];

const GuestMenu = () => {
  const [open, setOpen] = useState(false);
  const { exitGuestMode } = useAuth();
  const navigate = useNavigate();

  const handleExit = () => {
    setOpen(false);
    exitGuestMode();
    navigate("/auth");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        data-testid="button-guest-menu"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-primary/30 hover:border-primary/60 transition-all bg-primary/5"
      >
        <UserCheck className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-xs text-primary">Guest</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-primary/60" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-surface border border-border shadow-[0_0_40px_hsl(157_100%_50%/0.08)] overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-border bg-primary/5">
              <p className="font-mono text-[10px] text-primary tracking-widest uppercase">Guest Session</p>
              <p className="font-mono text-xs text-text-ghost mt-0.5">Limited — no history saved</p>
            </div>
            <div className="py-1">
              <Link
                to="/auth?mode=signup"
                onClick={() => { setOpen(false); exitGuestMode(); }}
                data-testid="link-guest-create-account"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors font-mono"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Free Account
              </Link>
              <Link
                to="/auth"
                onClick={() => { setOpen(false); exitGuestMode(); }}
                data-testid="link-guest-signin"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors font-mono"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </Link>
              <button
                onClick={handleExit}
                data-testid="button-guest-exit"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[hsl(0_100%_61%)] hover:bg-[hsl(0_100%_61%/0.05)] transition-colors font-mono"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit Guest Mode
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
};

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Operator";

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        data-testid="button-user-menu"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 transition-all bg-surface/50"
      >
        <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="font-mono text-xs text-text-primary max-w-[110px] truncate">{displayName}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-text-ghost" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-surface border border-border shadow-[0_0_40px_hsl(157_100%_50%/0.08)] overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="font-mono text-[10px] text-text-ghost tracking-widest uppercase">Signed in as</p>
              <p className="font-mono text-xs text-text-primary mt-0.5 truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                data-testid="link-navbar-profile"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors font-mono"
              >
                <User className="w-3.5 h-3.5" />
                My Profile
              </Link>
              <button
                onClick={handleSignOut}
                data-testid="button-navbar-signout"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[hsl(0_100%_61%)] hover:bg-[hsl(0_100%_61%/0.05)] transition-colors font-mono"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
};

export const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, isGuest, signOut, exitGuestMode } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-void/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" data-interactive>
          <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-text-primary tracking-wide text-lg">
            Secure<span className="text-primary">Del</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium tracking-wide uppercase transition-colors duration-300 ${
                location.pathname === link.to
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-text-secondary hover:text-primary"
              }`}
              data-interactive
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/subscription">
            <CyberButton variant="secondary" size="sm" data-testid="button-nav-subscription">Subscription</CyberButton>
          </Link>
          {loading ? (
            <div className="w-24 h-8 rounded-lg bg-surface animate-pulse" />
          ) : user ? (
            <UserMenu />
          ) : isGuest ? (
            <GuestMenu />
          ) : (
            <>
              <Link to="/auth">
                <CyberButton variant="ghost" size="sm" data-testid="button-nav-login">Login</CyberButton>
              </Link>
              <Link to="/auth">
                <CyberButton variant="primary" size="sm" data-testid="button-nav-getstarted">Get Started</CyberButton>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-text-secondary hover:text-primary transition-colors ml-auto flex items-center justify-center w-10 h-10"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-interactive
          data-testid="button-mobile-menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed inset-0 z-[60] flex flex-col items-stretch justify-start gap-6 px-3 pt-24 pb-8 w-full h-[100dvh] bg-void/95 backdrop-blur-2xl border-b-2 border-primary overflow-y-auto shadow-2xl"
          >
            <div className="flex flex-col gap-4 w-full">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                // Add icons for each nav item (example icons, adjust as needed)
                const icons = {
                  Home: <Shield className="w-4 h-4 mr-2 inline-block" />,
                  About: <User className="w-4 h-4 mr-2 inline-block" />,
                  "Try Now": <Menu className="w-4 h-4 mr-2 inline-block" />,
                  Community: <UserCheck className="w-4 h-4 mr-2 inline-block" />,
                  Contact: <LogOut className="w-4 h-4 mr-2 inline-block" />,
                };
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`text-base font-display font-semibold uppercase tracking-wide transition-all duration-300 w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                      isActive 
                        ? "text-primary bg-primary/10 border-l-4 border-primary" 
                        : "text-text-primary hover:text-primary hover:bg-primary/5"
                    }`}
                    style={{fontSize: '1rem', letterSpacing: '0.08em'}} // further reduce text size
                    onClick={() => setMobileOpen(false)}
                    data-interactive
                  >
                    {icons[link.label]}
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 w-full mt-4">
              <Link to="/subscription" onClick={() => setMobileOpen(false)} className="w-full">
                <CyberButton variant="secondary" size="sm" className="w-full">Subscription</CyberButton>
              </Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="w-full">
                    <CyberButton variant="secondary" size="sm" className="w-full">My Profile</CyberButton>
                  </Link>
                  <CyberButton
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      await signOut();
                      navigate("/");
                      setMobileOpen(false);
                    }}
                  >
                    Sign Out
                  </CyberButton>
                </>
              ) : isGuest ? (
                <>
                  <div className="font-mono text-xs text-primary border border-dashed border-primary/30 rounded-lg px-3 py-1.5 w-full text-center">
                    Browsing as Guest
                  </div>
                  <Link to="/auth?mode=signup" onClick={() => { setMobileOpen(false); exitGuestMode(); }} className="w-full">
                    <CyberButton variant="primary" size="sm" className="w-full">Create Account</CyberButton>
                  </Link>
                  <CyberButton
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => { exitGuestMode(); navigate("/auth"); setMobileOpen(false); }}
                  >
                    Sign In
                  </CyberButton>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileOpen(false)} className="w-full">
                    <CyberButton variant="secondary" size="sm" className="w-full">Login</CyberButton>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileOpen(false)} className="w-full">
                    <CyberButton variant="primary" size="sm" className="w-full">Get Started</CyberButton>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
