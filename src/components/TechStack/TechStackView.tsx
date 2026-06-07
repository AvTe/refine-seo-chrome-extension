import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import {
  Code2,
  Server,
  BarChart3,
  ShoppingCart,
  Search,
  Zap,
  Shield,
  Type,
  Layers,
} from 'lucide-react';
import type { TechItem } from '@/types/analysis';

const categoryConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  cms: { label: 'CMS', icon: <Layers size={14} /> },
  frontend: { label: 'Frontend', icon: <Code2 size={14} /> },
  backend: { label: 'Backend', icon: <Server size={14} /> },
  analytics: { label: 'Analytics', icon: <BarChart3 size={14} /> },
  infrastructure: { label: 'Infrastructure', icon: <Server size={14} /> },
  ecommerce: { label: 'E-Commerce', icon: <ShoppingCart size={14} /> },
  seo: { label: 'SEO', icon: <Search size={14} /> },
  caching: { label: 'Caching', icon: <Zap size={14} /> },
  security: { label: 'Security', icon: <Shield size={14} /> },
  fonts: { label: 'Fonts', icon: <Type size={14} /> },
};

export default function TechStackView() {
  const { analysis } = useAnalysis();
  if (!analysis) return null;

  const { technology: tech } = analysis;

  // Build categories with items
  const categories = Object.entries(tech)
    .filter(([key, items]) => key !== 'other' && (items as TechItem[]).length > 0)
    .map(([key, items]) => ({
      key,
      ...categoryConfig[key],
      items: items as TechItem[],
    }));

  const totalDetected = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up bg-bg">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Tech Stack</h1>
        <p className="text-xs text-gray-400 dark:text-zinc-550 mt-0.5">
          {analysis.site.hostname} · {totalDetected} technologies detected
        </p>
      </div>

      {/* Summary */}
      <div className="card border border-border dark:border-zinc-800 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Code2 size={20} className="text-primary-dark dark:text-primary-light" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              {totalDetected} Technologies Detected
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Across {categories.length} categories
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.map((category) => (
        <SectionCard
          key={category.key}
          title={category.label || category.key}
          badge={
            <span className="badge badge-neutral">{category.items.length}</span>
          }
        >
          <div className="space-y-0">
            {category.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-border-light dark:border-zinc-800/40 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-gray-400 dark:text-zinc-500">{category.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.version && (
                    <span className="text-xs text-gray-400 dark:text-zinc-500 tabular-nums">
                      v{item.version}
                    </span>
                  )}
                  <span
                    className={`badge text-2xs ${
                      item.confidence === 'high'
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}
                  >
                    {item.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}

      {/* No tech detected */}
      {totalDetected === 0 && (
        <div className="card border border-border dark:border-zinc-800 flex flex-col items-center justify-center py-12 text-center bg-card">
          <Code2 size={32} className="text-gray-300 dark:text-zinc-700 mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
            No Technologies Detected
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
            Try scanning a different page or website.
          </p>
        </div>
      )}
    </div>
  );
}
