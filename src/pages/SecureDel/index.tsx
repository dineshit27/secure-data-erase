import { Link, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Chrome, Clock, FileText, Key, Trash2, ArrowRight } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";

const tools = [
  { id: "file-wiper", icon: Shield, title: "Secure File Wiper", desc: "Multi-pass overwrite destruction" },
  { id: "browser-cleaner", icon: Chrome, title: "Browser Cache Cleaner", desc: "Wipe browser storage & cookies" },
  { id: "recent-files", icon: Clock, title: "Recent Files Eraser", desc: "Eliminate OS activity trails" },
  { id: "log-scanner", icon: FileText, title: "Log File Scanner", desc: "Detect sensitive data in logs" },
  { id: "secret-scanner", icon: Key, title: "Secret Leak Detector", desc: "Find hardcoded secrets in code" },
  { id: "temp-cleaner", icon: Trash2, title: "Temp File Eliminator", desc: "Destroy temporary file artifacts" },
];

const DashboardIndex = () => (
  <div>
    <span className="font-mono text-xs text-primary tracking-[6px] uppercase block mb-8">
      // Select Erasure Module
    </span>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool, i) => (
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Link
            to={`/app/${tool.id}`}
            className="block group p-5 rounded-xl bg-surface border border-border hover:border-primary/25 transition-all duration-300 hover:-translate-y-1"
            data-interactive
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <tool.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-text-primary mb-1">{tool.title}</h3>
            <p className="text-xs text-text-secondary mb-3">{tool.desc}</p>
            <div className="flex items-center justify-between">
              <StatusBadge status="active" />
              <span className="text-xs font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                LAUNCH <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  </div>
);

const SecureDelDashboard = () => {
  const location = useLocation();
  const isRoot = location.pathname === "/app";
  const activeTool = tools.find((t) => location.pathname.includes(t.id));

  return (
    <PageWrapper>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-surface/50 p-4">
          <span className="font-mono text-[10px] text-text-ghost tracking-widest uppercase mb-4 px-2">
            Modules
          </span>
          <nav className="flex flex-col gap-1">
            {tools.map((tool) => {
              const isActive = location.pathname.includes(tool.id);
              return (
                <Link
                  key={tool.id}
                  to={`/app/${tool.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                  }`}
                  data-interactive
                >
                  <tool.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{tool.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-border">
            <div className="px-2">
              <p className="font-mono text-[10px] text-text-ghost tracking-widest">SECUREDEL CORE v2.4.1</p>
              <StatusBadge status="online" className="mt-1" />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {/* Mobile nav */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6 -mx-2 px-2">
            {tools.map((tool) => {
              const isActive = location.pathname.includes(tool.id);
              return (
                <Link
                  key={tool.id}
                  to={`/app/${tool.id}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-surface text-text-secondary border border-border"
                  }`}
                  data-interactive
                >
                  <tool.icon className="w-3.5 h-3.5" />
                  {tool.title.split(" ")[0]}
                </Link>
              );
            })}
          </div>

          {/* Breadcrumb */}
          {activeTool && (
            <div className="flex items-center gap-2 mb-6 font-mono text-xs text-text-ghost">
              <Link to="/app" className="hover:text-primary transition-colors" data-interactive>dashboard</Link>
              <span>/</span>
              <span className="text-primary">{activeTool.id}</span>
            </div>
          )}

          {isRoot ? <DashboardIndex /> : <Outlet />}
        </main>
      </div>
    </PageWrapper>
  );
};

export default SecureDelDashboard;
