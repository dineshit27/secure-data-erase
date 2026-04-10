import React, { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { ScanLineOverlay } from "@/components/ui/ScanLineOverlay";
import { AIChatbot } from "@/components/ui/AIChatbot";
import { AuthProvider } from "@/contexts/AuthContext";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Community = lazy(() => import("./pages/Community"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const SecureDelDashboard = lazy(() => import("./pages/SecureDel/index"));
const FileWiper = lazy(() => import("./pages/SecureDel/FileWiper"));
const BrowserCleaner = lazy(() => import("./pages/SecureDel/BrowserCleaner"));
const RecentFilesCleaner = lazy(() => import("./pages/SecureDel/RecentFilesCleaner"));
const LogScanner = lazy(() => import("./pages/SecureDel/LogScanner"));
const SecretScanner = lazy(() => import("./pages/SecureDel/SecretScanner"));
const TempFileCleaner = lazy(() => import("./pages/SecureDel/TempFileCleaner"));
const RunsHistory = lazy(() => import("./pages/SecureDel/RunsHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-void">
    <span className="font-mono text-sm text-text-ghost animate-pulse">LOADING MODULE...</span>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CustomCursor />
          <ScanLineOverlay />
          <Navbar />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/try-now" element={React.createElement(lazy(() => import("./pages/TryNow")))} />
              <Route path="/community" element={<Community />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/app" element={<SecureDelDashboard />}>
                <Route path="file-wiper" element={<FileWiper />} />
                <Route path="browser-cleaner" element={<BrowserCleaner />} />
                <Route path="recent-files" element={<RecentFilesCleaner />} />
                <Route path="log-scanner" element={<LogScanner />} />
                <Route path="secret-scanner" element={<SecretScanner />} />
                <Route path="temp-cleaner" element={<TempFileCleaner />} />
                <Route path="runs-history" element={<RunsHistory />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Footer />
          <AIChatbot />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(240 25% 6%)',
                color: 'hsl(157 100% 95%)',
                border: '1px solid hsl(157 100% 50% / 0.25)',
                borderLeft: '3px solid hsl(157 100% 50%)',
                borderRadius: '8px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
