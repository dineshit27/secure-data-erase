import { PageWrapper } from "@/components/layout/PageWrapper";
import { Link } from "react-router-dom";
import { CyberButton } from "@/components/ui/CyberButton";
import { Shield, Chrome, Clock, FileText, Key, Trash2, ArrowRight } from "lucide-react";

const tools = [
  {
    icon: Shield,
    title: "Secure File Wiper",
    desc: "Multi-pass overwrite using DOD 5220.22-M, Gutmann 35-pass, and custom algorithms.",
    problem: "Deleted files are still recoverable with free tools, leaving sensitive data exposed even after you 'delete' them from your system.",
    solution: "Our tool performs forensic-grade, multi-pass overwrites (DOD, Gutmann, PRNG) to ensure files are permanently destroyed and unrecoverable.",
    to: "/app/file-wiper"
  },
  {
    icon: Chrome,
    title: "Browser Cache Cleaner",
    desc: "Locate and securely wipe browser caches, cookies, session storage, autofill data, and saved passwords.",
    problem: "Browsers retain caches, cookies, autofill, and saved passwords even after clearing history, risking privacy leaks.",
    solution: "We deep-scan and securely wipe all browser data stores, ensuring no trace of your browsing or credentials remains.",
    to: "/app/browser-cleaner"
  },
  {
    icon: Clock,
    title: "Recent Files Eraser",
    desc: "Eliminate OS activity trails including recent documents, jump lists, thumbnail caches, and file access logs.",
    problem: "Operating systems keep logs of recently accessed files, thumbnails, and jump lists, exposing your activity history.",
    solution: "We find and erase all recent file traces and thumbnails, removing evidence of your file activity from the OS.",
    to: "/app/recent-files"
  },
  {
    icon: FileText,
    title: "Log File Scanner",
    desc: "Deep scan log files for passwords, API keys, PII, credit cards, and JWT tokens with intelligent pattern matching.",
    problem: "Log files often contain sensitive data like passwords, API keys, and PII, which can be leaked or stolen.",
    solution: "We scan logs for 50+ secret patterns and help you securely remove or redact sensitive information before it leaks.",
    to: "/app/log-scanner"
  },
  {
    icon: Key,
    title: "Secret Leak Detector",
    desc: "Scan codebases for hardcoded AWS keys, GitHub tokens, API secrets, and high-entropy strings before they reach GitHub.",
    problem: "Developers accidentally commit secrets and API keys to codebases, risking major security breaches.",
    solution: "We scan your code for hardcoded secrets and high-entropy strings, alerting you before they reach public repos.",
    to: "/app/secret-scanner"
  },
  {
    icon: Trash2,
    title: "Temp File Eliminator",
    desc: "Find and destroy temporary files from OS caches, IDE artifacts, media processing leftovers, and office temp storage.",
    problem: "Temporary files from apps, editors, and the OS can contain sensitive fragments and persist for months unnoticed.",
    solution: "We map and securely delete temp files from all major locations, ensuring no sensitive data is left behind.",
    to: "/app/temp-cleaner"
  },
];

const TryNow = () => (
  <PageWrapper>
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary uppercase mb-10 text-center">Try SecureDel Tools</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool, idx) => (
          <Link to={tool.to} key={tool.title} className="block group h-full" data-testid={`card-tool-${idx}`}> 
            <div className="relative h-full p-6 rounded-xl bg-surface border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_50px_hsl(157_100%_50%/0.05)]">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <tool.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-text-primary mb-2">{tool.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-2">{tool.desc}</p>
              <div className="mb-2">
                <span className="block font-mono text-xs text-[hsl(0_100%_61%)] mb-1">Problem</span>
                <p className="text-xs text-text-secondary mb-2">{tool.problem}</p>
                <span className="block font-mono text-xs text-primary mb-1">Our Solution</span>
                <p className="text-xs text-text-secondary">{tool.solution}</p>
              </div>
              <CyberButton variant="primary" size="sm" className="mt-2">Try Now <ArrowRight className="inline w-4 h-4 ml-2" /></CyberButton>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
        <h2 className="font-display font-bold text-xl text-text-primary uppercase">Join the Community Intelligence Feed</h2>
        <p className="text-sm text-text-secondary mt-2 max-w-2xl mx-auto">
          Follow live cybersecurity news, threat alerts, and top discussions from the SecureDel community.
        </p>
        <Link to="/community" className="inline-block mt-4">
          <CyberButton variant="secondary" size="sm">Open Community</CyberButton>
        </Link>
      </div>
    </section>
  </PageWrapper>
);

export default TryNow;
