import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Mail, Github, MessageSquare, Clock, Globe,
  Shield, Bug, Lightbulb, Lock, MapPin, AlertCircle, CheckCircle2
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { GlitchText } from "@/components/ui/GlitchText";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
  isSecurityDisclosure: z.boolean().default(false),
});

const bugSchema = z.object({
  bugTitle: z.string().min(1, "Title required").max(100),
  bugEmail: z.string().email("Invalid email"),
  severity: z.string().min(1, "Severity required"),
  description: z.string().min(20, "Please describe the issue in detail").max(3000),
  stepsToReproduce: z.string().min(10, "Steps required").max(1000),
});

type ContactForm = z.infer<typeof contactSchema>;
type BugForm = z.infer<typeof bugSchema>;

const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.55, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const inputClass = "w-full h-12 px-4 bg-surface border border-border rounded-lg font-mono text-sm text-text-primary placeholder:text-text-ghost focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all";
const labelClass = "block font-mono text-xs text-text-ghost uppercase tracking-widest mb-2";
const errorClass = "text-xs text-[hsl(0_100%_61%)] mt-1.5 font-mono";

const contactOptions = [
  {
    icon: Mail,
    label: "Email",
    value: "security@securedel.io",
    desc: "General inquiries and security disclosures",
    href: "mailto:security@securedel.io",
  },
  {
    icon: Github,
    label: "GitHub",
    value: "github.com/securedel",
    desc: "Bug reports, feature requests, source code",
    href: "https://github.com/securedel",
  },
  {
    icon: MessageSquare,
    label: "Discord",
    value: "discord.gg/securedel",
    desc: "Community support and live chat",
    href: "https://discord.gg/securedel",
  },
  {
    icon: Shield,
    label: "Security",
    value: "vuln@securedel.io",
    desc: "Encrypted vulnerability disclosures (PGP available)",
    href: "mailto:vuln@securedel.io",
  },
];

const availabilitySlots = [
  { day: "Mon–Fri", time: "09:00–18:00 UTC", status: "online" },
  { day: "Saturday", time: "10:00–14:00 UTC", status: "limited" },
  { day: "Sunday", time: "Emergency only", status: "offline" },
];

const Contact = () => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"contact" | "bug">("contact");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  const {
    register: bugRegister,
    handleSubmit: bugHandleSubmit,
    formState: { errors: bugErrors, isSubmitting: bugSubmitting },
  } = useForm<BugForm>({ resolver: zodResolver(bugSchema) });

  const onContactSubmit = async (data: ContactForm) => {
    await new Promise((r) => setTimeout(r, 1500));
    console.log("Contact:", data);
    setContactSubmitted(true);
  };

  const onBugSubmit = async (data: BugForm) => {
    await new Promise((r) => setTimeout(r, 1500));
    console.log("Bug report:", data);
    setBugSubmitted(true);
  };

  return (
    <PageWrapper>
      {/* ── HERO ── */}
      <section className="py-36 px-4 sm:px-6 max-w-5xl mx-auto text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(157 100% 50% / 0.06), transparent)" }} />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] text-primary tracking-[4px] uppercase">Transmission Open</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
          <GlitchText
            text="CONTACT"
            as="h1"
            className="font-display font-extrabold text-4xl sm:text-5xl text-text-primary uppercase tracking-wider"
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-text-secondary font-mono text-sm max-w-xl mx-auto leading-relaxed"
        >
          Security concerns, feature requests, bug reports, or just want to talk privacy.
          Our team monitors all channels — typically responding within 24 hours.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex items-center justify-center gap-6 flex-wrap"
        >
          {[{ label: "Avg Response", value: "< 24h" }, { label: "Security Disclosures", value: "< 4h" }, { label: "Community", value: "Active" }].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-mono font-bold text-xl text-primary">{s.value}</p>
              <p className="font-mono text-[10px] text-text-ghost tracking-widest uppercase mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── CONTACT OPTIONS ── */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-border">
        <FadeUp>
          <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-10">// Channels</span>
        </FadeUp>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactOptions.map((opt, i) => (
            <FadeUp key={opt.label} delay={i * 0.08}>
              <motion.a
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                data-testid={`link-contact-${opt.label.toLowerCase()}`}
                className="block p-5 rounded-xl bg-surface border border-border hover:border-primary/30 transition-all group h-full"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <opt.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="font-mono text-[10px] text-text-ghost tracking-widest uppercase mb-1">{opt.label}</p>
                <p className="font-display font-semibold text-sm text-text-primary mb-2 break-all">{opt.value}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{opt.desc}</p>
              </motion.a>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── CONTACT FORM + BUG REPORT TABS ── */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Left — tabs info */}
          <div className="lg:col-span-2 space-y-6">
            <FadeUp>
              <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border">
                {(["contact", "bug"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    data-testid={`button-tab-${tab}`}
                    className={`flex-1 py-2.5 rounded-lg font-mono text-xs uppercase tracking-widest transition-all ${
                      activeTab === tab
                        ? "bg-primary text-primary-foreground"
                        : "text-text-ghost hover:text-text-secondary"
                    }`}
                  >
                    {tab === "contact" ? (
                      <><Lightbulb className="inline w-3.5 h-3.5 mr-1.5" />General</>
                    ) : (
                      <><Bug className="inline w-3.5 h-3.5 mr-1.5" />Bug Report</>
                    )}
                  </button>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <TerminalWindow title="contact-info">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-text-ghost">EMAIL</span>
                    <span className="text-text-primary ml-auto">security@securedel.io</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Github className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-text-ghost">GITHUB</span>
                    <span className="text-text-primary ml-auto">github.com/securedel</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-text-ghost">DISCORD</span>
                    <span className="text-text-primary ml-auto">discord.gg/securedel</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-text-ghost">PGP KEY</span>
                    <span className="text-primary ml-auto cursor-pointer hover:underline">Download →</span>
                  </div>
                </div>
              </TerminalWindow>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="p-5 rounded-xl bg-surface border border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-primary tracking-widest uppercase">Security Disclosures</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Found a vulnerability? We take security seriously. Responsible disclosures receive acknowledgment within 4 hours and a public CVE credit upon patch release.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[hsl(43_100%_50%)]" />
                  <span className="font-mono text-[10px] text-[hsl(43_100%_50%)]">Use PGP for sensitive disclosures</span>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === "contact" ? (
                <motion.div key="contact-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  {contactSubmitted ? (
                    <TerminalWindow title="transmission-complete">
                      <div className="space-y-2">
                        <p className="text-primary">&gt; MESSAGE RECEIVED. DECRYPTING...</p>
                        <p className="text-primary">&gt; RESPONSE QUEUED FOR security@securedel.io</p>
                        <p className="text-primary">&gt; ETA: &lt; 24 HOURS</p>
                        <p className="text-text-ghost mt-4">&gt; _</p>
                      </div>
                    </TerminalWindow>
                  ) : (
                    <form onSubmit={handleSubmit(onContactSubmit)} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className={labelClass}>Name</label>
                          <input {...register("name")} className={inputClass} placeholder="Your name" data-testid="input-name" />
                          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                        </div>
                        <div>
                          <label className={labelClass}>Email</label>
                          <input {...register("email")} type="email" className={inputClass} placeholder="your@email.com" data-testid="input-email" />
                          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Subject</label>
                        <select {...register("subject")} className={inputClass} data-testid="select-subject">
                          <option value="">Select a subject</option>
                          <option value="bug">Bug Report</option>
                          <option value="feature">Feature Request</option>
                          <option value="security">Security Disclosure</option>
                          <option value="partnership">Partnership</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.subject && <p className={errorClass}>{errors.subject.message}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Message</label>
                        <textarea {...register("message")} rows={6} className={`${inputClass} h-auto resize-none`} placeholder="Your message..." data-testid="textarea-message" />
                        {errors.message && <p className={errorClass}>{errors.message.message}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" {...register("isSecurityDisclosure")} id="security" className="w-4 h-4 rounded border-border bg-surface accent-primary" data-testid="checkbox-security" />
                        <label htmlFor="security" className="text-sm text-text-secondary font-mono cursor-pointer">
                          This is a security vulnerability disclosure
                        </label>
                      </div>
                      <CyberButton type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting} data-testid="button-contact-submit">
                        {isSubmitting ? <span className="animate-pulse">TRANSMITTING...</span> : <>Send Message <Send className="inline w-4 h-4 ml-2" /></>}
                      </CyberButton>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div key="bug-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  {bugSubmitted ? (
                    <TerminalWindow title="bug-report-received">
                      <div className="space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-primary mb-4" />
                        <p className="text-primary">&gt; BUG REPORT LOGGED.</p>
                        <p className="text-primary">&gt; ISSUE TRACKER: UPDATED</p>
                        <p className="text-text-secondary">&gt; We'll investigate and respond within 24h.</p>
                        <p className="text-text-ghost mt-4">&gt; _</p>
                      </div>
                    </TerminalWindow>
                  ) : (
                    <form onSubmit={bugHandleSubmit(onBugSubmit)} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className={labelClass}>Bug Title</label>
                          <input {...bugRegister("bugTitle")} className={inputClass} placeholder="Brief description" data-testid="input-bug-title" />
                          {bugErrors.bugTitle && <p className={errorClass}>{bugErrors.bugTitle.message}</p>}
                        </div>
                        <div>
                          <label className={labelClass}>Your Email</label>
                          <input {...bugRegister("bugEmail")} type="email" className={inputClass} placeholder="your@email.com" data-testid="input-bug-email" />
                          {bugErrors.bugEmail && <p className={errorClass}>{bugErrors.bugEmail.message}</p>}
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Severity</label>
                        <select {...bugRegister("severity")} className={inputClass} data-testid="select-severity">
                          <option value="">Select severity</option>
                          <option value="critical">Critical — App crashes / data loss</option>
                          <option value="high">High — Major feature broken</option>
                          <option value="medium">Medium — Feature partially broken</option>
                          <option value="low">Low — Minor visual issue</option>
                        </select>
                        {bugErrors.severity && <p className={errorClass}>{bugErrors.severity.message}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Description</label>
                        <textarea {...bugRegister("description")} rows={4} className={`${inputClass} h-auto resize-none`} placeholder="What happened? What did you expect?" data-testid="textarea-bug-description" />
                        {bugErrors.description && <p className={errorClass}>{bugErrors.description.message}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Steps to Reproduce</label>
                        <textarea {...bugRegister("stepsToReproduce")} rows={3} className={`${inputClass} h-auto resize-none`} placeholder="1. Open... 2. Click... 3. Observe..." data-testid="textarea-bug-steps" />
                        {bugErrors.stepsToReproduce && <p className={errorClass}>{bugErrors.stepsToReproduce.message}</p>}
                      </div>
                      <CyberButton type="submit" variant="primary" size="lg" className="w-full" disabled={bugSubmitting} data-testid="button-bug-submit">
                        {bugSubmitting ? <span className="animate-pulse">SUBMITTING...</span> : <><Bug className="inline w-4 h-4 mr-2" />Submit Bug Report</>}
                      </CyberButton>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── LOCATION / AVAILABILITY ── */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <FadeUp>
            <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-6">// Location & Availability</span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-text-primary uppercase mb-8">
              Where We Operate
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-surface border border-border">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-mono text-xs text-text-ghost tracking-widest uppercase mb-1">Headquarters</p>
                  <p className="text-sm text-text-primary font-semibold">Distributed / Remote-First</p>
                  <p className="text-xs text-text-secondary mt-1">Team across EU, US East, and APAC time zones</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-surface border border-border">
                <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-mono text-xs text-text-ghost tracking-widest uppercase mb-1">Jurisdiction</p>
                  <p className="text-sm text-text-primary font-semibold">European Union (GDPR-native)</p>
                  <p className="text-xs text-text-secondary mt-1">All legal entities incorporated under EU law</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-surface border border-border">
                <Lock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-mono text-xs text-text-ghost tracking-widest uppercase mb-1">Infrastructure</p>
                  <p className="text-sm text-text-primary font-semibold">Zero Server Architecture</p>
                  <p className="text-xs text-text-secondary mt-1">No user data ever stored on our servers. Frontend-only.</p>
                </div>
              </div>
            </div>
          </FadeUp>
          <FadeUp delay={0.15}>
            <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-6">// Support Hours</span>
            <div className="space-y-3 mb-8">
              {availabilitySlots.map((slot, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border" data-testid={`row-availability-${i}`}>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-text-ghost" />
                    <span className="font-mono text-sm text-text-primary">{slot.day}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-text-secondary">{slot.time}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      slot.status === "online" ? "bg-primary animate-pulse" :
                      slot.status === "limited" ? "bg-[hsl(43_100%_50%)]" : "bg-border"
                    }`} />
                  </div>
                </div>
              ))}
            </div>
            <TerminalWindow title="current-status">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-primary">ALL SYSTEMS OPERATIONAL</span>
                </div>
                <p className="text-text-ghost mt-2">Last checked: just now</p>
                <p className="text-text-secondary">Support queue: 3 open tickets</p>
                <p className="text-text-secondary">Avg first response: 8.4 hours</p>
                <p className="text-primary mt-3">&gt; Ready to receive transmissions. _</p>
              </div>
            </TerminalWindow>
          </FadeUp>
        </div>
      </section>
    </PageWrapper>
  );
};

export default Contact;
