import { AnalysisProvider, useAnalysis } from '@/context/AnalysisContext';
import Sidebar from '@/components/Layout/Sidebar';
import LoadingState from '@/components/shared/LoadingState';
import Overview from '@/components/Overview/Overview';
import SEOInspector from '@/components/SEO/SEOInspector';
import PerformanceView from '@/components/Performance/PerformanceView';
import SecurityInspector from '@/components/Security/SecurityInspector';
import WordPressInspector from '@/components/WordPress/WordPressInspector';
import TechStackView from '@/components/TechStack/TechStackView';
import AccessibilityView from '@/components/Accessibility/AccessibilityView';
import SettingsView from '@/components/Settings/SettingsView';
import AIInsightsView from '@/components/AIInsights/AIInsightsView';
import CompetitorView from '@/components/Competitor/CompetitorView';
import ReportsView from '@/components/Reports/ReportsView';
import ScreenshotsView from '@/components/Screenshots/ScreenshotsView';
import { Menu, RefreshCw } from 'lucide-react';

function AppContent() {
  const { activeSection, isLoading, error, isSidebarOpen, setIsSidebarOpen, requestAnalysis } = useAnalysis();

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Analysis Failed</p>
          <p className="text-xs text-gray-400 mt-1 max-w-[200px]">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  const pages: Record<string, React.ReactNode> = {
    overview: <Overview />,
    seo: <SEOInspector />,
    performance: <PerformanceView />,
    security: <SecurityInspector />,
    wordpress: <WordPressInspector />,
    techstack: <TechStackView />,
    accessibility: <AccessibilityView />,
    aiinsights: <AIInsightsView />,
    competitor: <CompetitorView />,
    reports: <ReportsView />,
    screenshots: <ScreenshotsView />,
    settings: <SettingsView />,
  };

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="h-11 border-b border-border bg-white flex items-center px-4 justify-between flex-shrink-0 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            aria-label="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            {activeSection}
          </span>
        </div>
        <button
          onClick={requestAnalysis}
          disabled={isLoading}
          className="p-1 text-primary-dark hover:bg-primary/10 rounded-md disabled:opacity-50 flex items-center justify-center"
          title="Rescan"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </header>
      <div className="flex-grow flex flex-col overflow-hidden">
        {pages[activeSection] || <Overview />}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AnalysisProvider>
      <div className="flex h-screen w-full bg-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <AppContent />
        </main>
      </div>
    </AnalysisProvider>
  );
}
