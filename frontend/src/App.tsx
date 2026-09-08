import React from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ScreeningProvider } from "./contexts/ScreeningContext";

// Layout
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";

// 14 Dedicated Pages
import { LandingPage } from "./pages/LandingPage";
import { ScreeningPage } from "./pages/ScreeningPage";
import { QualityPage } from "./pages/QualityPage";
import { GradingPage } from "./pages/GradingPage";
import { ExplainabilityPage } from "./pages/ExplainabilityPage";
import { LesionsPage } from "./pages/LesionsPage";
import { RecordPage } from "./pages/RecordPage";
import { ReportPage } from "./pages/ReportPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ModelsPage } from "./pages/ModelsPage";
import { ArchitecturePage } from "./pages/ArchitecturePage";
import { DeploymentPage } from "./pages/DeploymentPage";
import { AboutPage } from "./pages/AboutPage";
import { SettingsPage } from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f2d4a] antialiased">
      <div className="flex min-h-screen">
        {/* Persistent Clinical Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/screening" component={ScreeningPage} />
        <Route path="/analysis" component={GradingPage} />
        <Route path="/explainability" component={ExplainabilityPage} />
        <Route path="/quality" component={QualityPage} />
        <Route path="/grading" component={GradingPage} />
        <Route path="/lesions" component={LesionsPage} />
        <Route path="/record" component={RecordPage} />
        <Route path="/report" component={ReportPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/models" component={ModelsPage} />
        <Route path="/architecture" component={ArchitecturePage} />
        <Route path="/deployment" component={DeploymentPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ScreeningProvider>
          <TooltipProvider delayDuration={200}>
            <Toaster position="top-right" richColors />
            <Router />
          </TooltipProvider>
        </ScreeningProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
