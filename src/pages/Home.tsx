import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Shield, Chrome, Clock, FileText, Key, Trash2, ArrowRight,
  CheckCircle2, AlertTriangle, Zap, Lock, Eye, Server,
  Star, Quote, Play, Terminal, Users, Award, TrendingUp
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CyberButton } from "@/components/ui/CyberButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CounterAnimation } from "@/components/ui/CounterAnimation";
import { ParticleBackground } from "@/components/ui/ParticleBackground";

const TypeWriter = ({ text, delay = 0, speed = 60 }: { text: string; delay?: number; speed?: number }) => {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStarted(true), delay); return () => clearTimeout(t); }, [delay]);
  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
      return () => clearTimeout(t);
    }
  }, [started, displayed, text, speed]);
  return <span>{displayed}{started && displayed.length < text.length && <span className="animate-blink text-primary">▌</span>}</span>;
};

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: delay / 1000, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.55, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const tools = [
  { num: "01", icon: Shield, title: "Secure File Wiper", desc: "Multi-pass overwrite using DOD 5220.22-M, Gutmann 35-pass, and custom algorithms. Complete forensic-grade file destruction.", to: "/app/file-wiper" },
  { num: "02", icon: Chrome, title: "Browser Cache Cleaner", desc: "Locate and securely wipe browser caches, cookies, session storage, autofill data, and saved passwords across all browsers.", to: "/app/browser-cleaner" },
  { num: "03", icon: Clock, title: "Recent Files Eraser", desc: "Eliminate OS activity trails including recent documents, jump lists, thumbnail caches, and file access logs.", to: "/app/recent-files" },
  { num: "04", icon: FileText, title: "Log File Scanner", desc: "Deep scan log files for passwords, API keys, PII, credit cards, and JWT tokens with intelligent pattern matching.", to: "/app/log-scanner" },
  { num: "05", icon: Key, title: "Secret Leak Detector", desc: "Scan codebases for hardcoded AWS keys, GitHub tokens, API secrets, and high-entropy strings before they reach GitHub.", to: "/app/secret-scanner" },
  { num: "06", icon: Trash2, title: "Temp File Eliminator", desc: "Find and destroy temporary files from OS caches, IDE artifacts, media processing leftovers, and office temp storage.", to: "/app/temp-cleaner" },
];

const steps = [
  { num: "01", title: "SELECT", desc: "Choose your erasure module from 6 forensic-grade tools" },
  { num: "02", title: "CONFIGURE", desc: "Set wipe algorithm — DOD, Gutmann, PRNG, or custom N-pass" },
  { num: "03", title: "EXECUTE", desc: "Watch real-time progress as data is permanently destroyed" },
];

const trustBadges = [
  { icon: Shield, label: "DOD 5220.22-M Certified" },
  { icon: Lock, label: "Zero Telemetry" },
  { icon: Eye, label: "No Cloud Upload" },
  { icon: Server, label: "100% Local Processing" },
  { icon: Award, label: "Open Source Audited" },
];

const whyReasons = [
  { icon: Zap, title: "Instant Execution", desc: "No install required. Run directly from browser with native OS access through our secure bridge." },
  { icon: Lock, title: "Air-Gapped Safe", desc: "Works fully offline. Zero network calls during wipe operations. Your data never touches the internet." },
  { icon: Eye, title: "Audit Trail", desc: "Cryptographically signed deletion certificates. Prove data was destroyed — for compliance and peace of mind." },
  { icon: Users, title: "50,000+ Users", desc: "Trusted by journalists, lawyers, IT admins, and privacy-first individuals worldwide." },
  { icon: TrendingUp, title: "Recovery Tested", desc: "We test against Recuva, PhotoRec, and professional forensic tools. None can recover wiped data." },
  { icon: Terminal, title: "CLI-First Design", desc: "Full terminal interface available. Scriptable, automatable, and integrates with existing workflows." },
];

const testimonials = [
  {
    quote: "SecureDel is the only tool I trust before returning company laptops. The DOD wipe + audit certificate is exactly what compliance requires.",
    author: "Marcus R.",
    role: "IT Security Manager",
    stars: 5,
  },
  {
    quote: "As a journalist covering sensitive topics, this is non-negotiable. I wipe sources, communications, and draft notes before every border crossing.",
    author: "Yuki T.",
    role: "Investigative Journalist",
    stars: 5,
  },
  {
    quote: "We integrated SecureDel's CLI into our offboarding pipeline. Hundreds of devices processed automatically with cryptographic proof of deletion.",
    author: "Priya S.",
    role: "DevSecOps Lead",
    stars: 5,
  },
];

const demoLines = [
  { delay: 0, text: "> Initializing SecureDel v3.2.1...", color: "text-primary" },
  { delay: 600, text: "> Scanning: /home/user/Documents/...", color: "text-text-secondary" },
  { delay: 1200, text: "> Found 847 files (2.3 GB)", color: "text-text-secondary" },
  { delay: 1800, text: "> Algorithm: DOD 5220.22-M (3-pass)", color: "text-warning" },
  { delay: 2400, text: "> Pass 1/3: Writing 0x00 patterns...", color: "text-text-secondary" },
  { delay: 3000, text: "> Pass 2/3: Writing 0xFF patterns...", color: "text-text-secondary" },
  { delay: 3600, text: "> Pass 3/3: Writing random data...  ", color: "text-text-secondary" },
  { delay: 4200, text: "> ✓ 847 files permanently destroyed.", color: "text-primary" },
  { delay: 4800, text: "> Certificate: SHA-256 abc1f3e9...", color: "text-primary" },
  { delay: 5400, text: "> RECOVERY IMPOSSIBLE. _", color: "text-primary" },
];

const TerminalDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!inView) return;
    demoLines.forEach((line, i) => {
      setTimeout(() => setVisibleLines(i + 1), line.delay);
    });
  }, [inView]);

  return (
    <div ref={ref} className="relative rounded-xl overflow-hidden border border-border bg-[hsl(240_25%_4%)] shadow-[0_0_60px_hsl(157_100%_50%/0.08)]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
        <span className="w-3 h-3 rounded-full bg-[hsl(0_80%_60%)]" />
        <span className="w-3 h-3 rounded-full bg-[hsl(43_100%_50%)]" />
        <span className="w-3 h-3 rounded-full bg-primary" />
        <span className="ml-4 font-mono text-xs text-text-ghost">securedel — terminal</span>
      </div>
      <div className="p-6 font-mono text-sm space-y-2 min-h-[280px]">
        {demoLines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={line.color}
          >
            {line.text}
          </motion.div>
        ))}
        {visibleLines > 0 && visibleLines < demoLines.length && (
          <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
        )}
      </div>
    </div>
  );
};

const problems = [
  { icon: AlertTriangle, text: "Deleted files stay on disk — recoverable in minutes by free tools" },
  { icon: AlertTriangle, text: "Browser history and cookies persist after 'clearing'" },
  { icon: AlertTriangle, text: "Log files silently accumulate passwords and API keys" },
  { icon: AlertTriangle, text: "Temp files from editors, IDEs, and apps linger for months" },
];

const solutions = [
  { icon: CheckCircle2, text: "7-pass overwrite — forensically unrecoverable by any tool" },
  { icon: CheckCircle2, text: "Deep browser wipe including SQLite databases and LevelDB stores" },
  { icon: CheckCircle2, text: "Intelligent log scanning with 50+ secret pattern detectors" },
  { icon: CheckCircle2, text: "Full temp file mapping across all major OS locations" },
];

const Home = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageWrapper>
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ParticleBackground />
        <div className="relative z-10 text-center px-4 sm:px-8 w-full max-w-5xl mx-auto">
          <FadeIn delay={200}>
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[11px] text-primary tracking-[4px] uppercase">System Online — v3.2.1</span>
            </div>
          </FadeIn>
          <h1 className="font-display font-extrabold text-text-primary uppercase leading-[0.9] mb-6 text-[clamp(1.5rem,5vw,4.5rem)] break-words overflow-hidden">
            <div><TypeWriter text="DELETE." delay={600} /></div>
            <FadeIn delay={1400}><div>PERMANENTLY.</div></FadeIn>
            <FadeIn delay={1900}><div>UNTRACEABLE.</div></FadeIn>
          </h1>
          <FadeIn delay={2400}>
            <p className="font-mono text-sm sm:text-base text-text-secondary max-w-lg mx-auto leading-relaxed">
              Military-grade erasure toolkit. Six forensic tools. Zero recovery possible. No trace left behind.
            </p>
          </FadeIn>
          <FadeIn delay={2900}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
              <Link to="/app">
                <CyberButton variant="primary" size="lg" className="animate-pulse-glow" data-testid="button-hero-launch">
                  Initiate Protocol <ArrowRight className="inline w-4 h-4 ml-2" />
                </CyberButton>
              </Link>
              <a href="#demo">
                <CyberButton variant="secondary" size="lg" data-testid="button-hero-demo">
                  <Play className="inline w-4 h-4 mr-2" />Live Demo
                </CyberButton>
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={3400}>
            <div className="flex items-center justify-center gap-8 mt-16 flex-wrap">
              {["7-PASS WIPE", "DOD 5220.22-M", "ZERO RECOVERY", "50K+ USERS"].map((stat) => (
                <span key={stat} className="font-mono text-[11px] text-text-ghost tracking-widest border-b border-border pb-1">
                  {stat}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-px h-10 bg-gradient-to-b from-primary/50 to-transparent mx-auto" />
        </div>
      </section>

      {/* ── TRUST INDICATORS ── */}
      <section className="py-10 border-y border-border bg-surface/40 overflow-hidden">
        <div className="flex items-center gap-12 animate-marquee whitespace-nowrap px-6">
          {[...trustBadges, ...trustBadges].map((badge, i) => (
            <div key={i} className="inline-flex items-center gap-2.5 shrink-0">
              <badge.icon className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-text-secondary tracking-widest uppercase">{badge.label}</span>
              <span className="w-1 h-1 rounded-full bg-border ml-6" />
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM → SOLUTION ── */}
      <section className="py-28 px-4 sm:px-6 max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// The Reality</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-text-primary uppercase">
              Your Data Isn't <span className="text-primary">Gone</span> When You Think It Is
            </h2>
          </div>
        </FadeUp>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <FadeUp delay={0.1}>
            <div className="h-full p-8 rounded-xl bg-surface border border-[hsl(0_100%_61%/0.15)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0_100%_61%/0.04)] to-transparent pointer-events-none" />
              <span className="font-mono text-xs text-[hsl(0_100%_61%)] tracking-[6px] uppercase block mb-6">// The Problem</span>
              <div className="space-y-4">
                {problems.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="flex items-start gap-3"
                  >
                    <p.icon className="w-4 h-4 text-[hsl(0_100%_61%)] mt-0.5 shrink-0" />
                    <p className="text-sm text-text-secondary leading-relaxed">{p.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeUp>
          <FadeUp delay={0.2}>
            <div className="h-full p-8 rounded-xl bg-surface border border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-6">// SecureDel Solution</span>
              <div className="space-y-4">
                {solutions.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="flex items-start gap-3"
                  >
                    <s.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-text-secondary leading-relaxed">{s.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <FadeUp>
          <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// Erasure Modules</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary uppercase mb-12">
            Six Tools. One Mission.
          </h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool, idx) => (
            <FadeUp key={tool.num} delay={idx * 0.07}>
              <Link to={tool.to} className="block group h-full" data-testid={`card-tool-${tool.num}`}>
                <div className="relative h-full p-6 rounded-xl bg-surface border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_50px_hsl(157_100%_50%/0.05)]">
                  <span className="absolute top-4 right-4 font-mono text-[11px] text-text-ghost">{tool.num}</span>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <tool.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-text-primary mb-2">{tool.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">{tool.desc}</p>
                  <div className="flex items-center justify-between">
                    <StatusBadge status="active" />
                    <span className="text-xs font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity">LAUNCH MODULE →</span>
                  </div>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <FadeUp>
          <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// Protocol Sequence</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary uppercase mb-16">How It Works</h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <FadeUp key={step.num} delay={i * 0.15}>
              <div className="relative">
                <span className="font-mono font-extrabold text-7xl text-primary/5 absolute -top-6 -left-2">{step.num}</span>
                <div className="relative">
                  <h3 className="font-display font-bold text-xl text-text-primary uppercase tracking-wider mb-3">{step.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && <div className="hidden md:block absolute top-8 -right-4 w-8 border-t border-dashed border-border" />}
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-24 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
          {[
            { end: 10000, suffix: "+", label: "Files Securely Deleted", prefix: "" },
            { end: 7, suffix: "", label: "Wipe Algorithm Passes", prefix: "" },
            { end: 100, suffix: "%", label: "Recovery Prevention Rate", prefix: "" },
          ].map((stat, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div>
                <div className="font-mono font-extrabold text-5xl sm:text-6xl text-primary mb-2">
                  <CounterAnimation end={stat.end} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
                <p className="text-sm text-text-secondary">{stat.label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── LIVE DEMO PREVIEW ── */}
      <section id="demo" className="py-28 px-4 sm:px-6 max-w-5xl mx-auto">
        <FadeUp>
          <div className="text-center mb-12">
            <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// Live Demo</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-text-primary uppercase">
              See It In Action
            </h2>
            <p className="mt-4 font-mono text-sm text-text-secondary max-w-md mx-auto">
              Watch a real DOD 3-pass wipe execute in real time. This is what your data's last moment looks like.
            </p>
          </div>
        </FadeUp>
        <FadeUp delay={0.15}>
          <TerminalDemo />
        </FadeUp>
        <FadeUp delay={0.25}>
          <div className="mt-8 text-center">
            <Link to="/app/file-wiper">
              <CyberButton variant="primary" size="lg" data-testid="button-demo-cta">
                Try It Yourself <ArrowRight className="inline w-4 h-4 ml-2" />
              </CyberButton>
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── WHY SECUREDEL ── */}
      <section className="py-28 px-4 sm:px-6 max-w-6xl mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// Why Us</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-text-primary uppercase">
              Why SecureDel?
            </h2>
          </div>
        </FadeUp>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyReasons.map((reason, i) => (
            <FadeUp key={reason.title} delay={i * 0.07}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-xl bg-surface border border-border hover:border-primary/25 transition-colors group"
                data-testid={`card-why-${i}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <reason.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-base text-text-primary uppercase tracking-wider mb-2">{reason.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{reason.desc}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-28 px-4 sm:px-6 bg-surface border-y border-border">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// User Reports</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-text-primary uppercase">
                Trusted By Operators
              </h2>
            </div>
          </FadeUp>
          <div className="relative min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <Quote className="w-8 h-8 text-primary/40 mx-auto mb-6" />
                <p className="font-display text-xl sm:text-2xl text-text-primary leading-relaxed italic mb-8 max-w-2xl mx-auto">
                  "{testimonials[activeTestimonial].quote}"
                </p>
                <div className="flex items-center justify-center gap-1 mb-3">
                  {Array.from({ length: testimonials[activeTestimonial].stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="font-mono text-sm text-text-primary font-bold">{testimonials[activeTestimonial].author}</p>
                <p className="font-mono text-xs text-text-ghost mt-1">{testimonials[activeTestimonial].role}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                data-testid={`button-testimonial-${i}`}
                onClick={() => setActiveTestimonial(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === activeTestimonial ? "bg-primary w-6" : "bg-border hover:bg-primary/40"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(157 100% 50% / 0.02) 40px, hsl(157 100% 50% / 0.02) 41px)" }} />
        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <FadeUp>
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[11px] text-primary tracking-[4px] uppercase">System Ready</span>
            </div>
            <h2 className="font-display font-extrabold text-4xl sm:text-6xl text-text-primary uppercase mb-6">
              Leave No Trace.
            </h2>
            <p className="text-text-secondary font-mono text-sm mb-10 max-w-lg mx-auto leading-relaxed">
              Join 50,000+ users who trust SecureDel for permanent, forensic-grade data erasure. Free. Always.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/app">
                <CyberButton variant="primary" size="lg" data-testid="button-cta-launch">
                  Start Erasing — Free <ArrowRight className="inline w-4 h-4 ml-2" />
                </CyberButton>
              </Link>
              <Link to="/about">
                <CyberButton variant="secondary" size="lg" data-testid="button-cta-about">
                  Learn More
                </CyberButton>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </PageWrapper>
  );
};

export default Home;
