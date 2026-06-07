import { useAnalysis } from '@/context/AnalysisContext';
import type { NavSection } from '@/types/analysis';
import {
  LayoutDashboard,
  Search,
  Gauge,
  Shield,
  Globe,
  Cpu,
  Eye,
  X,
  Sparkles,
  Wand2,
  GitCompare,
  FileText,
  Camera,
  Settings,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const { activeSection, setActiveSection, analysis, requestAnalysis, isLoading, isSidebarOpen, setIsSidebarOpen } = useAnalysis();

  const cmsLabel = analysis?.shopify?.detected ? 'Shopify' : 'WordPress';

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'seo', label: 'SEO', icon: <Search size={16} /> },
    { id: 'performance', label: 'Performance', icon: <Gauge size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'wordpress', label: cmsLabel, icon: <Globe size={16} /> },
    { id: 'techstack', label: 'Tech Stack', icon: <Cpu size={16} /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Eye size={16} /> },
    { id: 'aiinsights', label: 'AI Insights', icon: <Sparkles size={16} /> },
    { id: 'actioncenter', label: 'Action Center', icon: <Wand2 size={16} /> },
    { id: 'competitor', label: 'Competitor', icon: <GitCompare size={16} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={16} /> },
    { id: 'screenshots', label: 'Screenshots', icon: <Camera size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  const hostname = analysis?.site?.hostname || '—';

  return (
    <>
      {/* Mobile/Narrow Overlay Backdrop when Expanded */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/25 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`h-screen border-r border-border bg-white flex flex-col overflow-hidden transition-all duration-200 flex-shrink-0 ${
          isSidebarOpen
            ? 'fixed md:static inset-y-0 left-0 z-50 w-[200px] shadow-lg md:shadow-none'
            : 'static w-[52px]'
        }`}
      >
        {/* Logo Header */}
        <div className={`py-3 border-b border-border flex items-center ${isSidebarOpen ? 'px-4 justify-between' : 'px-3 justify-center'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors"
              title={isSidebarOpen ? "Collapse menu" : "Expand menu"}
            >
              <span className="text-primary-dark text-xs font-bold">R</span>
            </button>
            {isSidebarOpen && <span className="text-sm font-semibold text-gray-900 truncate">RefineAI</span>}
          </div>
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Current Site */}
        {isSidebarOpen && (
          <div className="px-3 py-2.5 border-b border-border">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-surface rounded-md">
              <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 truncate">{hostname}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-2 py-3 space-y-0.5 overflow-y-auto">
          {isSidebarOpen && <p className="section-title px-3">Analysis</p>}
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                if (window.innerWidth <= 768) {
                  setIsSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                isSidebarOpen ? 'px-3 py-2 gap-2.5 justify-start' : 'p-2.5 justify-center'
              } ${activeSection === item.id ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-gray-500 hover:bg-surface-2 hover:text-gray-700'}`}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isSidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Rescan Button */}
        <div className="px-2 pb-3 flex justify-center border-t border-border-light pt-3">
          <button
            onClick={requestAnalysis}
            disabled={isLoading}
            className={`flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary-dark transition-colors disabled:opacity-50 ${
              isSidebarOpen ? 'w-full gap-2 px-3 py-2 text-sm font-medium rounded-lg' : 'w-8 h-8 rounded-full'
            }`}
            title="Rescan Website"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isSidebarOpen && <span>{isLoading ? 'Scanning...' : 'Rescan'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
