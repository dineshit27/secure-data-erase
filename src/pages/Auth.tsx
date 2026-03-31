import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, User, Eye, EyeOff, Github, ArrowLeft, AlertCircle, CheckCircle2, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { CyberButton } from "@/components/ui/CyberButton";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "login" | "signup" | "forgot";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(60),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;

const inputClass = "w-full h-12 px-4 pl-11 bg-surface border border-border rounded-lg font-mono text-sm text-text-primary placeholder:text-text-ghost focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all";
const labelClass = "block font-mono text-xs text-text-ghost uppercase tracking-widest mb-2";
const errorClass = "text-xs text-[hsl(0_100%_61%)] mt-1.5 font-mono flex items-center gap-1.5";

const ScanLine = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
    <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-[scan-line_3s_linear_infinite]" />
  </div>
);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>((searchParams.get("mode") as AuthMode) || "login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGithub, resetPassword, continueAsGuest, user } = useAuth();

  useEffect(() => { if (user) navigate("/profile"); }, [user, navigate]);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });
  const forgotForm = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const clearMessages = () => { setErrorMessage(""); setSuccessMessage(""); };
  const switchMode = (m: AuthMode) => { setMode(m); clearMessages(); };

  const onLogin = async (data: LoginForm) => {
    clearMessages();
    const { error } = await signIn(data.email, data.password);
    if (error) setErrorMessage(error.message);
    else navigate("/profile");
  };

  const onSignup = async (data: SignupForm) => {
    clearMessages();
    const { error } = await signUp(data.email, data.password, data.displayName);
    if (error) setErrorMessage(error.message);
    else setSuccessMessage("Account created! Check your email to confirm your address.");
  };

  const onForgot = async (data: ForgotForm) => {
    clearMessages();
    const { error } = await resetPassword(data.email);
    if (error) setErrorMessage(error.message);
    else setSuccessMessage("Reset link sent. Check your inbox.");
  };

  const onGithub = async () => {
    clearMessages();
    const { error } = await signInWithGithub();
    if (error) setErrorMessage(error.message);
  };

  const onGuest = () => {
    continueAsGuest();
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(hsl(157 100% 50% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(157 100% 50% / 0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(157 100% 50% / 0.08), transparent)" }} />

      <div className="w-full max-w-md relative">
        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-text-ghost hover:text-primary transition-colors mb-8 group" data-testid="link-back-home">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to SecureDel
        </Link>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative p-8 rounded-2xl bg-surface border border-border shadow-[0_0_80px_hsl(157_100%_50%/0.06)] overflow-hidden"
        >
          <ScanLine />

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-text-primary tracking-wide">Secure<span className="text-primary">Del</span></p>
              <p className="font-mono text-[10px] text-text-ghost tracking-widest uppercase">Secure Access Terminal</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ── LOGIN ── */}
            {mode === "login" && (
              <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h1 className="font-display font-extrabold text-2xl text-text-primary uppercase tracking-wider mb-1">Sign In</h1>
                <p className="font-mono text-xs text-text-ghost mb-8">Authenticate to access your secure workspace</p>

                {/* GitHub OAuth */}
                <button
                  onClick={onGithub}
                  data-testid="button-github-login"
                  className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-surface-2 border border-border hover:border-primary/30 font-mono text-sm text-text-primary transition-all mb-6 hover:bg-surface"
                >
                  <Github className="w-4 h-4" />
                  Continue with GitHub
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-mono text-xs text-text-ghost">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                  <div>
                    <label className={labelClass}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
                      <input {...loginForm.register("email")} type="email" className={inputClass} placeholder="you@example.com" data-testid="input-login-email" />
                    </div>
                    {loginForm.formState.errors.email && <p className={errorClass}><AlertCircle className="w-3 h-3" />{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`${labelClass} mb-0`}>Password</label>
                      <button type="button" onClick={() => switchMode("forgot")} className="font-mono text-[10px] text-primary hover:underline tracking-widest uppercase" data-testid="button-forgot-password">
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
                      <input {...loginForm.register("password")} type={showPassword ? "text" : "password"} className={inputClass} placeholder="••••••••" data-testid="input-login-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-ghost hover:text-primary transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && <p className={errorClass}><AlertCircle className="w-3 h-3" />{loginForm.formState.errors.password.message}</p>}
                  </div>

                  {errorMessage && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[hsl(0_100%_61%/0.08)] border border-[hsl(0_100%_61%/0.2)]">
                      <AlertCircle className="w-4 h-4 text-[hsl(0_100%_61%)] mt-0.5 shrink-0" />
                      <p className="font-mono text-xs text-[hsl(0_100%_61%)]">{errorMessage}</p>
                    </div>
                  )}

                  <CyberButton type="submit" variant="primary" size="lg" className="w-full" disabled={loginForm.formState.isSubmitting} data-testid="button-login-submit">
                    {loginForm.formState.isSubmitting ? <span className="animate-pulse">AUTHENTICATING...</span> : "Sign In"}
                  </CyberButton>
                </form>

                <p className="mt-6 text-center font-mono text-xs text-text-ghost">
                  No account?{" "}
                  <button onClick={() => switchMode("signup")} className="text-primary hover:underline" data-testid="button-switch-signup">Create one →</button>
                </p>

                <div className="flex items-center gap-4 mt-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-mono text-[10px] text-text-ghost uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button
                  onClick={onGuest}
                  data-testid="button-guest-login"
                  className="mt-4 w-full h-11 flex items-center justify-center gap-2.5 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 font-mono text-sm text-text-ghost hover:text-text-secondary transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  Continue as Guest
                </button>
              </motion.div>
            )}

            {/* ── SIGNUP ── */}
            {mode === "signup" && (
              <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h1 className="font-display font-extrabold text-2xl text-text-primary uppercase tracking-wider mb-1">Create Account</h1>
                <p className="font-mono text-xs text-text-ghost mb-8">Join 50,000+ privacy-first operators</p>

                <button
                  onClick={onGithub}
                  data-testid="button-github-signup"
                  className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-surface-2 border border-border hover:border-primary/30 font-mono text-sm text-text-primary transition-all mb-6 hover:bg-surface"
                >
                  <Github className="w-4 h-4" />
                  Continue with GitHub
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-mono text-xs text-text-ghost">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <div>
                    <label className={labelClass}>Display Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
                      <input {...signupForm.register("displayName")} className={inputClass} placeholder="Your name" data-testid="input-signup-name" />
                    </div>
                    {signupForm.formState.errors.displayName && <p className={errorClass}><AlertCircle className="w-3 h-3" />{signupForm.formState.errors.displayName.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
                      <input {...signupForm.register("email")} type="email" className={inputClass} placeholder="you@example.com" data-testid="input-signup-email" />
                    </div>
                    {signupForm.formState.errors.email && <p className={errorClass}><AlertCircle className="w-3 h-3" />{signupForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
                      <input {...signupForm.register("password")} type={showPassword ? "text" : "password"} className={inputClass} placeholder="Min 8 characters" data-testid="input-signup-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-ghost hover:text-primary transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupForm.formState.errors.password && <p className={errorClass}><AlertCircle className="w-3 h-3" />{signupForm.formState.errors.password.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
                      <input {...signupForm.register("confirmPassword")} type={showConfirmPassword ? "text" : "password"} className={inputClass} placeholder="Repeat password" data-testid="input-signup-confirm-password" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-ghost hover:text-primary transition-colors">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupForm.formState.errors.confirmPassword && <p className={errorClass}><AlertCircle className="w-3 h-3" />{signupForm.formState.errors.confirmPassword.message}</p>}
                  </div>

                  {errorMessage && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[hsl(0_100%_61%/0.08)] border border-[hsl(0_100%_61%/0.2)]">
                      <AlertCircle className="w-4 h-4 text-[hsl(0_100%_61%)] mt-0.5 shrink-0" />
                      <p className="font-mono text-xs text-[hsl(0_100%_61%)]">{errorMessage}</p>
                    </div>
                  )}
                  {successMessage && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="font-mono text-xs text-primary">{successMessage}</p>
                    </div>
                  )}

                  <CyberButton type="submit" variant="primary" size="lg" className="w-full" disabled={signupForm.formState.isSubmitting} data-testid="button-signup-submit">
                    {signupForm.formState.isSubmitting ? <span className="animate-pulse">CREATING ACCOUNT...</span> : "Create Account"}
                  </CyberButton>
                </form>

                <p className="mt-6 text-center font-mono text-xs text-text-ghost">
                  Already have one?{" "}
                  <button onClick={() => switchMode("login")} className="text-primary hover:underline" data-testid="button-switch-login">Sign in →</button>
                </p>

                <div className="flex items-center gap-4 mt-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-mono text-[10px] text-text-ghost uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button
                  onClick={onGuest}
                  data-testid="button-guest-signup"
                  className="mt-4 w-full h-11 flex items-center justify-center gap-2.5 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 font-mono text-sm text-text-ghost hover:text-text-secondary transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  Continue as Guest
                </button>
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {mode === "forgot" && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h1 className="font-display font-extrabold text-2xl text-text-primary uppercase tracking-wider mb-1">Reset Password</h1>
                <p className="font-mono text-xs text-text-ghost mb-8">We'll send a reset link to your inbox</p>

                <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-5">
                  <div>
                    <label className={labelClass}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
                      <input {...forgotForm.register("email")} type="email" className={inputClass} placeholder="you@example.com" data-testid="input-forgot-email" />
                    </div>
                    {forgotForm.formState.errors.email && <p className={errorClass}><AlertCircle className="w-3 h-3" />{forgotForm.formState.errors.email.message}</p>}
                  </div>

                  {errorMessage && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[hsl(0_100%_61%/0.08)] border border-[hsl(0_100%_61%/0.2)]">
                      <AlertCircle className="w-4 h-4 text-[hsl(0_100%_61%)] mt-0.5 shrink-0" />
                      <p className="font-mono text-xs text-[hsl(0_100%_61%)]">{errorMessage}</p>
                    </div>
                  )}
                  {successMessage && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="font-mono text-xs text-primary">{successMessage}</p>
                    </div>
                  )}

                  <CyberButton type="submit" variant="primary" size="lg" className="w-full" disabled={forgotForm.formState.isSubmitting} data-testid="button-reset-submit">
                    {forgotForm.formState.isSubmitting ? <span className="animate-pulse">SENDING...</span> : "Send Reset Link"}
                  </CyberButton>
                </form>

                <p className="mt-6 text-center font-mono text-xs text-text-ghost">
                  Remembered it?{" "}
                  <button onClick={() => switchMode("login")} className="text-primary hover:underline" data-testid="button-back-login">Back to login →</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="mt-6 text-center font-mono text-[10px] text-text-ghost">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
