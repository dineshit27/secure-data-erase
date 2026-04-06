import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { GlitchText } from "@/components/ui/GlitchText";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { CyberButton } from "@/components/ui/CyberButton";
import {
  Shield, Code, GitBranch, Cpu, Database, Lock,
  ChevronDown, CheckCircle2, Calendar, ArrowRight,
  Brain, Layers, Zap, Globe
} from "lucide-react";
import { Link } from "react-router-dom";

const algorithms = [
  { name: "DOD 5220.22-M", passes: "3-pass", desc: "US Department of Defense standard. Three passes of overwriting with verified data." },
  { name: "Gutmann Method", passes: "35-pass", desc: "Peter Gutmann's 1996 specification. Maximum theoretical protection against forensic recovery." },
  { name: "PRNG Stream", passes: "N-pass", desc: "Pseudorandom number generator overwrite. Each byte replaced with cryptographic random data." },
  { name: "Zero Fill", passes: "1-pass", desc: "Single pass zeroing. Fast but less secure — suitable for non-critical data." },
  { name: "Random Fill", passes: "1-pass", desc: "Single pass random data write. Better than zero fill for modern drives." },
  { name: "Custom N-Pass", passes: "User-defined", desc: "Configure your own pass count with mixed patterns. Maximum flexibility." },
];

const techStack = [
  { icon: Code, name: "TypeScript", desc: "Type-safe codebase with zero any. Full IntelliSense across 30k+ lines." },
  { icon: Globe, name: "React 18", desc: "Concurrent rendering for smooth real-time wipe progress visualisations." },
  { icon: Cpu, name: "WebAssembly", desc: "Performance-critical wipe algorithms compiled to WASM for near-native speed." },
  { icon: Database, name: "IndexedDB", desc: "All audit logs and certificates stored client-side only. Never transmitted." },
  { icon: Lock, name: "Web Crypto API", desc: "CSPRNG seeding and SHA-256 certificate generation using browser's native crypto." },
  { icon: Layers, name: "File System API", desc: "Direct OS file access using the File System Access API — no plugins, no install." },
  { icon: Brain, name: "Regex Engine", desc: "Custom finite-state machine for high-speed secret pattern scanning across files." },
  { icon: GitBranch, name: "Open Source", desc: "Core wipe algorithms are MIT-licensed and peer-reviewed on GitHub." },
];

const roadmapItems = [
  { status: "done", quarter: "Q1 2024", title: "Core Wipe Engine", desc: "DOD, Gutmann, and PRNG algorithms implemented and verified against forensic tools." },
  { status: "done", quarter: "Q2 2024", title: "Browser Cleaner", desc: "SQLite and LevelDB deep-wipe for Chrome, Firefox, Safari, and Edge." },
  { status: "done", quarter: "Q3 2024", title: "Secret Scanner", desc: "50+ pattern detectors for AWS, GitHub, Stripe, JWT, and custom regex." },
  { status: "done", quarter: "Q4 2024", title: "Audit Certificates", desc: "SHA-256 signed deletion certificates with timestamp and file manifest." },
  { status: "active", quarter: "Q1 2025", title: "CLI Tool", desc: "Full terminal interface — scriptable, automatable, CI/CD integrations." },
  { status: "active", quarter: "Q2 2025", title: "Scheduled Wipes", desc: "Set automatic wipe schedules. Cron-style rules for recurring data hygiene." },
  { status: "upcoming", quarter: "Q3 2025", title: "Team Mode", desc: "Centralised admin console for IT teams. Deploy wipe policies fleet-wide." },
  { status: "upcoming", quarter: "Q4 2025", title: "Mobile App", desc: "iOS/Android companion for wipe verification and remote trigger." },
];

const storyMilestones = [
  { year: "2022", event: "The Incident", desc: "A journalist's laptop was confiscated at a border crossing. Files 'deleted' weeks prior were fully recovered by authorities." },
  { year: "2023", event: "Research Phase", desc: "We tested 12 existing erasure tools against Recuva, PhotoRec, and Autopsy. Nine failed. Three were closed-source. We decided to build differently." },
  { year: "2024", event: "SecureDel v1", desc: "First public release. DOD wipe engine, browser cleaner, and secret scanner. 10,000 users in the first month." },
  { year: "2025", event: "Today", desc: "50,000+ users. 2.4M files wiped. Zero successful forensic recoveries reported. The mission continues." },
];

const faqs = [
  {
    q: "Is SecureDel truly unrecoverable?",
    a: "We test every release against Recuva, PhotoRec, TestDisk, and professional forensic suites like Autopsy and FTK. No wiped file has ever been recovered in our testing. On SSDs, we complement file-level wipes with TRIM commands. On HDDs, multi-pass overwrite is forensically irreversible."
  },
  {
    q: "Does SecureDel send any data to servers?",
    a: "Zero. All processing happens locally in your browser. We don't collect telemetry, analytics, or usage data. The app works fully offline. No data ever leaves your device."
  },
  {
    q: "Will SecureDel damage my SSD?",
    a: "No. We are aware of SSD write-cycle concerns and use TRIM-based sanitisation on SSDs rather than multi-pass overwrite. This achieves the same security goal without unnecessary wear."
  },
  {
    q: "Is the source code auditable?",
    a: "Yes. The core wipe algorithms, secret detection patterns, and certificate generation code are all open source under the MIT license on GitHub. Security researchers are encouraged to review and report findings."
  },
  {
    q: "Can I use SecureDel for compliance (GDPR, HIPAA)?",
    a: "Yes. Our SHA-256 signed deletion certificates include file paths, timestamps, algorithm used, and pass count — sufficient evidence for most GDPR right-to-erasure obligations and HIPAA device sanitisation requirements."
  },
  {
    q: "Does it work on macOS, Windows, and Linux?",
    a: "SecureDel runs in the browser and leverages the File System Access API, which is supported on Chrome, Edge, and Brave across all major desktop operating systems."
  },
];

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

const FAQItem = ({ q, a, index }: { q: string; a: string; index: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      className="border border-border rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        data-testid={`button-faq-${index}`}
        className="w-full flex items-center justify-between p-6 bg-surface hover:bg-surface-2 transition-colors text-left group"
      >
        <span className="font-display font-semibold text-text-primary group-hover:text-primary transition-colors pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-4 h-4 text-text-ghost shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 bg-surface border-t border-border">
              <p className="text-sm text-text-secondary leading-relaxed pt-4">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const About = () => (
  <PageWrapper>
    {/* ── HERO ── */}
    <section className="py-36 px-4 sm:px-6 max-w-5xl mx-auto text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(157 100% 50% / 0.06), transparent)" }} />
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="inline-flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[11px] text-primary tracking-[4px] uppercase">Our Mission</span>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
        <GlitchText
          text="ABOUT SECUREDEL"
          as="h1"
          className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-text-primary uppercase tracking-wider leading-[1.1]"
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-6 text-text-secondary font-mono text-sm max-w-xl mx-auto leading-relaxed"
      >
        Built by security engineers who got tired of watching data "deletion" fail in forensic tests.
        Designed for anyone who values digital privacy — no technical knowledge required.
      </motion.p>
    </section>

    {/* ── PROBLEM DEEP DIVE ── */}
    <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto">
      <FadeUp>
        <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// The Problem, In Depth</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary uppercase mb-12">
          Why "Delete" Doesn't Mean Gone
        </h2>
      </FadeUp>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          {[
            { title: "File System Pointers", desc: "When you delete a file, the OS removes the directory entry pointing to it. The actual bytes on disk remain untouched until overwritten by new data — which may never happen on a large drive." },
            { title: "Forensic Tool Reality", desc: "Free tools like Recuva, PhotoRec, and TestDisk can recover 'deleted' files from years ago. Professional forensic suites used by law enforcement, employers, and state actors can go further — recovering fragments even after quick-format." },
            { title: "Browser 'Clear History'", desc: "Chrome, Firefox, and Safari store history in SQLite databases. Clearing history via the browser UI marks records as deleted in the database schema but doesn't overwrite the underlying data blocks." },
            { title: "Log File Accumulation", desc: "Every terminal session, IDE session, and system event produces logs. These silently accumulate passwords typed by mistake, API keys echoed to console, and full file path histories." },
          ].map((item, i) => (
            <FadeUp key={item.title} delay={i * 0.08}>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-[hsl(0_100%_61%/0.1)] border border-[hsl(0_100%_61%/0.2)] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-mono text-[10px] text-[hsl(0_100%_61%)] font-bold">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div>
                  <h4 className="font-display font-bold text-text-primary mb-1">{item.title}</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
        <FadeUp delay={0.2}>
          <TerminalWindow title="forensic-scan-example">
            <div className="space-y-1.5 text-xs">
              <p className="text-text-ghost"># Running PhotoRec on 'deleted' drive</p>
              <p className="text-text-secondary mt-3">Disk /dev/sdb - 500 GB</p>
              <p className="text-text-secondary">Filesystem: NTFS</p>
              <p className="text-primary mt-3">&gt; Scanning sectors...</p>
              <p className="text-text-secondary">Found: 14,832 recoverable files</p>
              <p className="text-text-secondary">Including: .docx, .pdf, .jpg, .msg</p>
              <p className="text-[hsl(0_100%_61%)] mt-3">&gt; RECOVERED: tax_return_2023.pdf</p>
              <p className="text-[hsl(0_100%_61%)]">&gt; RECOVERED: passwords.txt</p>
              <p className="text-[hsl(0_100%_61%)]">&gt; RECOVERED: private_keys.pem</p>
              <p className="text-text-ghost mt-3"># Deleted 6 months ago. All recovered.</p>
              <div className="mt-4 p-2 bg-[hsl(157_100%_50%/0.05)] rounded border border-primary/20">
                <p className="text-primary text-[10px]">↑ This is why SecureDel exists.</p>
              </div>
            </div>
          </TerminalWindow>
        </FadeUp>
      </div>
    </section>

    {/* ── SOLUTION PHILOSOPHY ── */}
    <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-t border-border">
      <FadeUp>
        <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// Our Philosophy</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary uppercase mb-6">
          Solution Philosophy
        </h2>
        <p className="text-text-secondary leading-relaxed max-w-2xl mb-14">
          SecureDel is built on four principles that guide every design decision — from how algorithms are implemented to what data the application is permitted to access.
        </p>
      </FadeUp>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          { icon: Lock, title: "Zero Trust", desc: "We don't trust ourselves with your data. Everything runs locally on your device. SecureDel has no backend, no user accounts, and no telemetry. We architect the app so that it is technically impossible for us to receive your data." },
          { icon: Shield, title: "Verifiable Deletion", desc: "Trust requires proof. Every wipe operation produces a SHA-256 signed certificate with the file manifest, algorithm, pass count, and timestamp. You can independently verify the certificate — no reliance on our word." },
          { icon: Code, title: "Open Source Core", desc: "Security through obscurity is not security. Our core wipe algorithms, pattern detectors, and certificate generation are open source on GitHub. Independent security researchers have reviewed and validated the implementation." },
          { icon: Zap, title: "Simplicity First", desc: "Military-grade security shouldn't require a manual. Every tool is designed for immediate use without technical knowledge. Complexity is hidden in the implementation, not exposed to the user." },
        ].map((v, i) => (
          <FadeUp key={v.title} delay={i * 0.1}>
            <div className="p-6 rounded-xl bg-surface border border-border h-full">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <v.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg text-text-primary uppercase tracking-wider mb-3">{v.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{v.desc}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>

    {/* ── TECHNOLOGY STACK ── */}
    <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-t border-border">
      <FadeUp>
        <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// Under The Hood</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary uppercase mb-12">
          Technology Stack
        </h2>
      </FadeUp>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {techStack.map((tech, i) => (
          <FadeUp key={tech.name} delay={i * 0.06}>
            <motion.div
              whileHover={{ scale: 1.03, borderColor: "hsl(157 100% 50% / 0.3)" }}
              className="p-5 rounded-xl bg-surface border border-border transition-colors h-full"
              data-testid={`card-tech-${i}`}
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <tech.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="font-display font-bold text-sm text-text-primary uppercase tracking-wider mb-2">{tech.name}</p>
              <p className="text-xs text-text-secondary leading-relaxed">{tech.desc}</p>
            </motion.div>
          </FadeUp>
        ))}
      </div>
    </section>

    {/* ── ALGORITHMS ── */}
    <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-t border-border">
      <FadeUp>
        <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// The Algorithms</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary uppercase mb-12">
          Wipe Standards
        </h2>
      </FadeUp>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {algorithms.map((algo, i) => (
          <FadeUp key={algo.name} delay={i * 0.08}>
            <TerminalWindow title={algo.name.toLowerCase().replace(/\s+/g, "-")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-primary font-bold">{algo.name}</span>
                <span className="text-xs text-text-ghost bg-surface-2 px-2 py-0.5 rounded">{algo.passes}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{algo.desc}</p>
            </TerminalWindow>
          </FadeUp>
        ))}
      </div>
    </section>

    {/* ── PROJECT STORY ── */}
    <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-t border-border">
      <FadeUp>
        <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// Origin Story</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary uppercase mb-12">
          How We Got Here
        </h2>
      </FadeUp>
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
        <div className="space-y-10">
          {storyMilestones.map((m, i) => (
            <FadeUp key={m.year} delay={i * 0.12}>
              <div className="flex gap-8 items-start">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-primary tracking-widest">{m.year}</span>
                    <h3 className="font-display font-bold text-lg text-text-primary uppercase">{m.event}</h3>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{m.desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>

    {/* ── ROADMAP ── */}
    <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-t border-border">
      <FadeUp>
        <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// What's Next</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary uppercase mb-12">
          Roadmap
        </h2>
      </FadeUp>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roadmapItems.map((item, i) => (
          <FadeUp key={item.quarter + item.title} delay={i * 0.07}>
            <div
              className={`p-5 rounded-xl border transition-all ${
                item.status === "done"
                  ? "bg-surface border-primary/15 opacity-70"
                  : item.status === "active"
                  ? "bg-surface border-primary/40 shadow-[0_0_30px_hsl(157_100%_50%/0.06)]"
                  : "bg-surface border-border"
              }`}
              data-testid={`card-roadmap-${i}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-text-ghost tracking-widest uppercase">{item.quarter}</span>
                <span className={`font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full ${
                  item.status === "done"
                    ? "text-primary/60 bg-primary/10"
                    : item.status === "active"
                    ? "text-primary bg-primary/20 animate-pulse"
                    : "text-text-ghost bg-surface-2"
                }`}>
                  {item.status === "done" ? "✓ DONE" : item.status === "active" ? "● IN PROGRESS" : "UPCOMING"}
                </span>
              </div>
              <h4 className="font-display font-bold text-text-primary uppercase tracking-wider mb-1">{item.title}</h4>
              <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              {item.status === "done" && <CheckCircle2 className="w-4 h-4 text-primary/50 mt-3" />}
            </div>
          </FadeUp>
        ))}
      </div>
    </section>

    {/* ── FAQ ── */}
    <section className="py-24 px-4 sm:px-6 max-w-3xl mx-auto border-t border-border">
      <FadeUp>
        <div className="text-center mb-14">
          <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-4">// FAQ</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary uppercase">
            Frequently Asked
          </h2>
        </div>
      </FadeUp>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
        ))}
      </div>
      <FadeUp delay={0.3}>
        <div className="mt-12 text-center">
          <p className="text-text-secondary font-mono text-sm mb-6">Still have questions?</p>
          <Link to="/contact">
            <CyberButton variant="secondary" data-testid="button-about-contact">
              Contact Us <ArrowRight className="inline w-4 h-4 ml-2" />
            </CyberButton>
          </Link>
        </div>
      </FadeUp>
    </section>
  </PageWrapper>
);

export default About;
