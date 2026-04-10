import { useMemo, useRef, useState } from "react";
import { Check, Crown, ShieldCheck, Sparkles, X } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CyberButton } from "@/components/ui/CyberButton";

type BillingCycle = "monthly" | "yearly";
type PlanId = "free" | "pro" | "elite";

type Plan = {
  id: PlanId;
  name: string;
  icon: typeof ShieldCheck;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyLabel: string;
  description: string;
  badge?: string;
  features: string[];
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Free Plan",
    icon: ShieldCheck,
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyLabel: "Always free",
    description: "Get started with essential privacy protection tools.",
    features: [
      "Basic secure deletion",
      "5 scans/month",
      "Community access",
      "Security tip of the day",
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    icon: Sparkles,
    monthlyPrice: 149,
    yearlyPrice: 999,
    yearlyLabel: "Save ₹789/year",
    description: "Built for power users who need complete daily cleanup.",
    badge: "Most Popular",
    features: [
      "Unlimited deletions",
      "Browser cache cleaner",
      "Temp file cleaner",
      "Log file scanner",
      "Community full access",
      "Limited AI chatbot",
      "Skip Ad Enabled",
    ],
  },
  {
    id: "elite",
    name: "Elite Plan",
    icon: Crown,
    monthlyPrice: 299,
    yearlyPrice: 1999,
    yearlyLabel: "Save ₹1,589/year",
    description: "For advanced users and teams requiring proactive defense.",
    badge: "Advanced",
    features: [
      "Everything in Pro",
      "Secret leakage repo scanner",
      "Risk score analyzer",
      "Unlimited AI chatbot",
      "Threat alerts",
      "Live feed",
      "Early access",
    ],
  },
];

const formatInr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const featureMatrix = [
  { name: "Basic secure deletion", free: true, pro: true, elite: true },
  { name: "5 scans/month", free: true, pro: false, elite: false },
  { name: "Unlimited deletions", free: false, pro: true, elite: true },
  { name: "Browser cache cleaner", free: false, pro: true, elite: true },
  { name: "Temp file cleaner", free: false, pro: true, elite: true },
  { name: "Log file scanner", free: false, pro: true, elite: true },
  { name: "Community access", free: true, pro: true, elite: true },
  { name: "Community full access", free: false, pro: true, elite: true },
  { name: "Security tip of the day", free: true, pro: true, elite: true },
  { name: "Limited AI chatbot", free: false, pro: true, elite: false },
  { name: "Unlimited AI chatbot", free: false, pro: false, elite: true },
  { name: "Skip Ad Enabled", free: false, pro: true, elite: true },
  { name: "Secret leakage repo scanner", free: false, pro: false, elite: true },
  { name: "Risk score analyzer", free: false, pro: false, elite: true },
  { name: "Threat alerts", free: false, pro: false, elite: true },
  { name: "Live feed", free: false, pro: false, elite: true },
  { name: "Early access", free: false, pro: false, elite: true },
];

const Subscription = () => {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const comparisonRef = useRef<HTMLDivElement | null>(null);

  const yearlySavings = useMemo(() => {
    return plans
      .filter((plan) => plan.monthlyPrice > 0 && plan.yearlyPrice > 0)
      .reduce((sum, plan) => sum + (plan.monthlyPrice * 12 - plan.yearlyPrice), 0);
  }, []);

  const handleCompareFeatures = () => {
    comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PageWrapper>
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-surface to-surface p-5 sm:p-7 lg:p-10 mb-8">
          <p className="font-mono text-xs uppercase tracking-[4px] text-primary mb-3">Subscription</p>
          <h1 className="font-display font-extrabold uppercase text-[clamp(1.6rem,6vw,3rem)] leading-[1.05] text-text-primary break-words">
            Pick Your SecureDel Plan
          </h1>
          <p className="text-sm text-text-secondary mt-3 max-w-3xl">
            Choose a plan that fits your workflow. Switch between monthly and yearly billing to compare pricing instantly.
          </p>

          <div className="mt-6 flex w-full sm:w-auto rounded-xl border border-border bg-void p-1">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-mono uppercase rounded-lg transition-colors ${
                cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-text-secondary hover:text-primary"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-mono uppercase rounded-lg transition-colors ${
                cycle === "yearly" ? "bg-primary text-primary-foreground" : "text-text-secondary hover:text-primary"
              }`}
            >
              Yearly
            </button>
          </div>

          <p className="font-mono text-xs text-text-ghost mt-3">
            Potential combined yearly savings across paid plans: {formatInr(yearlySavings)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const selected = plan.id === selectedPlan;
            const Icon = plan.icon;
            const price = cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const priceSuffix = cycle === "monthly" ? "/month" : "/year";

            return (
              <article
                key={plan.id}
                className={`relative rounded-2xl border p-6 transition-all duration-300 ${
                  selected
                    ? "border-primary bg-primary/8 shadow-[0_0_30px_hsl(157_100%_50%/0.14)]"
                    : "border-border bg-surface hover:border-primary/30"
                }`}
              >
                {plan.badge && (
                  <span className="absolute top-4 left-5 rounded-full border border-primary/40 bg-void px-3 py-1 text-[10px] font-mono uppercase tracking-[2px] text-primary">
                    {plan.badge}
                  </span>
                )}

                <div className={`flex items-center justify-between gap-3 ${plan.badge ? "pt-8" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/12 border border-primary/25 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-display text-lg sm:text-xl uppercase text-text-primary leading-tight">{plan.name}</h2>
                  </div>
                </div>

                <p className="text-xs text-text-secondary mt-3">{plan.description}</p>

                <div className="mt-5">
                  <div className="font-display text-[clamp(1.9rem,6vw,2.2rem)] text-text-primary leading-none">
                    {formatInr(price)}
                    <span className="font-mono text-xs sm:text-sm text-text-ghost ml-1">{priceSuffix}</span>
                  </div>
                  {cycle === "yearly" && (
                    <p className="font-mono text-xs text-primary mt-1">{plan.yearlyLabel}</p>
                  )}
                </div>

                <ul className="mt-5 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-text-secondary flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <CyberButton
                    variant={selected ? "primary" : "secondary"}
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {selected ? "Selected" : "Select Plan"}
                  </CyberButton>
                  {selected && <span className="font-mono text-xs text-primary">Current choice</span>}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="font-display text-lg uppercase text-text-primary">Ready to continue?</p>
            <p className="text-sm text-text-secondary mt-1">
              Selected plan: <span className="text-primary font-semibold">{plans.find((p) => p.id === selectedPlan)?.name}</span> ({cycle})
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
            <CyberButton
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleCompareFeatures}
            >
              Compare Features
            </CyberButton>
            <CyberButton variant="primary" size="sm" className="w-full sm:w-auto">Proceed to Checkout</CyberButton>
          </div>
        </div>

        <section ref={comparisonRef} className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-display text-xl sm:text-2xl uppercase text-text-primary">Feature Comparison</h2>
          <p className="text-sm text-text-secondary mt-2">Compare exactly what is included in each plan.</p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-mono text-xs uppercase tracking-[2px] text-text-ghost">Feature</th>
                  <th className={`text-center p-3 font-mono text-xs uppercase tracking-[2px] ${selectedPlan === "free" ? "text-primary" : "text-text-ghost"}`}>
                    Free
                  </th>
                  <th className={`text-center p-3 font-mono text-xs uppercase tracking-[2px] ${selectedPlan === "pro" ? "text-primary" : "text-text-ghost"}`}>
                    Pro
                  </th>
                  <th className={`text-center p-3 font-mono text-xs uppercase tracking-[2px] ${selectedPlan === "elite" ? "text-primary" : "text-text-ghost"}`}>
                    Elite
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureMatrix.map((row) => (
                  <tr key={row.name} className="border-b border-border/60">
                    <td className="p-3 text-sm text-text-secondary">{row.name}</td>
                    <td className="p-3 text-center">
                      {row.free ? <Check className="w-4 h-4 text-primary inline" /> : <X className="w-4 h-4 text-text-ghost inline" />}
                    </td>
                    <td className="p-3 text-center">
                      {row.pro ? <Check className="w-4 h-4 text-primary inline" /> : <X className="w-4 h-4 text-text-ghost inline" />}
                    </td>
                    <td className="p-3 text-center">
                      {row.elite ? <Check className="w-4 h-4 text-primary inline" /> : <X className="w-4 h-4 text-text-ghost inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </PageWrapper>
  );
};

export default Subscription;
