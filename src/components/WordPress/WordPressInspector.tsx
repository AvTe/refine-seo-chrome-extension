import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import StatusCheck from '@/components/shared/StatusCheck';
import { Globe, Palette, Puzzle, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function WordPressInspector() {
  const { analysis } = useAnalysis();
  if (!analysis) return null;

  const { wordpress: wp, woocommerce: woo, shopify } = analysis;

  // Render Shopify view if shopify detected
  if (shopify?.detected) {
    return (
      <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-gray-900">Shopify Inspector</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {analysis.site.hostname}
            {shopify.currency && <span> · Currency: {shopify.currency}</span>}
          </p>
        </div>

        {/* Shopify Detected Badge */}
        <div className="card bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe size={20} className="text-primary-dark" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Shopify Detected</p>
              <p className="text-xs text-gray-500">
                Theme: {shopify.theme?.name || 'Unknown'} · {shopify.appCount || 0} apps detected
              </p>
            </div>
          </div>
        </div>

        {/* Theme */}
        {shopify.theme?.name && (
          <SectionCard title="Active Theme" collapsible={false}>
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
              <Palette size={16} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">{shopify.theme.name}</p>
                {shopify.theme.id && (
                  <p className="text-xs text-gray-400">Theme ID: {shopify.theme.id}</p>
                )}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Shopify Apps */}
        <SectionCard title="Shopify Apps & Integrations" badge={<span className="badge badge-info">{shopify.appCount || 0}</span>}>
          {shopify.apps && shopify.apps.length > 0 ? (
            <div className="space-y-0">
              {shopify.apps.map((app, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2 border-b border-border-light last:border-0">
                  <Puzzle size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">{app.name}</span>
                  <span className="badge badge-success text-2xs">Active</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No standard Shopify apps detected from front-end signatures.</p>
          )}
        </SectionCard>
      </div>
    );
  }

  if (!wp.detected) {
    return (
      <div className="flex-1 p-5 overflow-y-auto animate-slide-up">
        <h1 className="text-lg font-bold text-gray-900 mb-4">CMS Inspector</h1>
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <Globe size={32} className="text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">CMS Platform Not Detected</p>
          <p className="text-xs text-gray-400 mt-1">This website doesn't appear to be using WordPress or Shopify.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">WordPress</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {analysis.site.hostname}
          {wp.wpVersion && <span> · WordPress {wp.wpVersion}</span>}
        </p>
      </div>

      {/* WordPress Detected Badge */}
      <div className="card bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe size={20} className="text-primary-dark" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">WordPress Detected</p>
            <p className="text-xs text-gray-500">
              Version {wp.wpVersion || 'Unknown'} · {wp.pluginCount || 0} plugins · {wp.issues?.length || 0} issues
            </p>
          </div>
        </div>
      </div>

      {/* Theme */}
      <SectionCard title="Theme" collapsible={false}>
        <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
          <Palette size={16} className="text-primary" />
          <div>
            <p className="text-sm font-medium text-gray-900 capitalize">{wp.theme?.active || 'Unknown'}</p>
            {wp.theme?.hasChildTheme && (
              <p className="text-xs text-gray-400">Child theme active</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Plugins */}
      <SectionCard title="Plugins" badge={<span className="badge badge-info">{wp.pluginCount || 0}</span>}>
        <div className="space-y-0">
          {wp.plugins?.map((plugin: { name: string }, i: number) => (
            <div key={i} className="flex items-center gap-2.5 py-2 border-b border-border-light last:border-0">
              <Puzzle size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 flex-1">{plugin.name}</span>
              <span className="badge badge-success text-2xs">Detected</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* WooCommerce */}
      {woo.detected && (
        <SectionCard title="WooCommerce">
          <div className="space-y-0">
            <StatusCheck label="WooCommerce" status="pass" detail="E-commerce platform detected" />
            <StatusCheck label="Products on page" status="info" detail={`${woo.productsOnPage || 0} products`} />
            <StatusCheck label="Product Schema" status={woo.productSchema ? 'pass' : 'fail'} detail={woo.productSchema ? 'Markup found' : 'Missing product markup'} />
            <StatusCheck label="Cart" status={woo.hasCart ? 'pass' : 'info'} detail={woo.hasCart ? 'Cart detected' : 'Not on this page'} />
          </div>
        </SectionCard>
      )}

      {/* Issues & Recommendations */}
      {wp.issues && wp.issues.length > 0 && (
        <SectionCard title="Recommendations" badge={<span className="badge badge-warning">{wp.issues.length}</span>}>
          <div className="space-y-2">
            {wp.issues.map((issue: { type: string; message: string; severity: string }, i: number) => (
              <div key={i} className="flex items-start gap-2.5 py-2 border-b border-border-light last:border-0">
                {issue.type === 'security' ? (
                  <ShieldCheck size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                ) : issue.type === 'performance' ? (
                  <Zap size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm text-gray-700">{issue.message}</p>
                  <span className={`badge mt-1 ${issue.severity === 'high' ? 'badge-danger' : issue.severity === 'medium' ? 'badge-warning' : 'badge-neutral'} text-2xs`}>
                    {issue.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
