import { useAnalysis } from '@/context/AnalysisContext';
import ScoreCard from '@/components/shared/ScoreCard';
import SectionCard from '@/components/shared/SectionCard';
import {
  calculateSEOScore,
  calculateSecurityScore,
  calculatePerformanceScore,
  calculateAccessibilityScore,
  calculateOverallScore,
  getScoreColor,
  formatBytes,
} from '@/utils/scoring';
import { Globe, Lock, Clock, Layers, Server, Wifi } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function Overview() {
  const { analysis, lastScanTime, auditHistory } = useAnalysis();
  if (!analysis) return null;

  const seoScore = calculateSEOScore(analysis);
  const securityScore = calculateSecurityScore(analysis);
  const performanceScore = calculatePerformanceScore(analysis);
  const accessibilityScore = calculateAccessibilityScore(analysis);
  const overallScore = calculateOverallScore(analysis);
  const overallColor = getScoreColor(overallScore);

  const hostHistory = auditHistory.filter(h => h.hostname === analysis.site.hostname);
  const currentScanTimeMs = analysis.timestamp;
  const prevScan = hostHistory.find(h => h.timestamp < currentScanTimeMs);
  const delta = prevScan ? overallScore - prevScan.scores.overall : null;

  const techItems = [
    ...analysis.technology.cms,
    ...analysis.technology.frontend,
    ...analysis.technology.ecommerce,
    ...analysis.technology.caching,
  ];

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Website Overview</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {analysis.site.hostname} · Last scan {lastScanTime || '—'}
          </p>
        </div>
      </div>

      {/* Overall Score */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full border-[4px] flex items-center justify-center flex-shrink-0"
            style={{ borderColor: overallColor }}
          >
            <span className="text-xl font-bold" style={{ color: overallColor }}>
              {overallScore}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium">Website Score</p>
              {delta !== null && (
                <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded ${
                  delta > 0 
                    ? 'bg-green-50 text-green-700' 
                    : delta < 0 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-gray-50 text-gray-600'
                }`}>
                  {delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${Math.abs(delta)}` : 'No change'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Based on SEO, security, performance & accessibility
            </p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${overallScore}%`, backgroundColor: overallColor }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard label="SEO" score={seoScore} />
        <ScoreCard label="Security" score={securityScore} />
        <ScoreCard label="Performance" score={performanceScore} />
        <ScoreCard label="Accessibility" score={accessibilityScore} />
      </div>

      {/* Score History Graph */}
      {hostHistory.length >= 2 && (
        <SectionCard title="Score History Trends" defaultOpen={true}>
          <div className="h-28 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hostHistory.slice(0, 10).reverse().map(h => ({
                time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                score: h.scores.overall
              }))}>
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} width={18} tick={{ fontSize: 9, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`Score: ${v}`, 'Overall']} contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                <Line type="monotone" dataKey="score" stroke="#a06ce0" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* Site Info */}
      <SectionCard title="Site Information">
        <div className="space-y-0">
          <InfoRow icon={<Globe size={14} />} label="Domain" value={analysis.site.hostname} />
          <InfoRow icon={<Lock size={14} />} label="SSL" value={analysis.security.isHTTPS ? 'HTTPS Enabled' : 'Not Secure'} status={analysis.security.isHTTPS ? 'pass' : 'fail'} />
          <InfoRow icon={<Clock size={14} />} label="Load Time" value={analysis.performance.timings.loadComplete ? `${(analysis.performance.timings.loadComplete / 1000).toFixed(1)}s` : '—'} />
          <InfoRow icon={<Layers size={14} />} label="Page Size" value={formatBytes(analysis.performance.totalSize)} />
          <InfoRow icon={<Server size={14} />} label="Requests" value={`${analysis.performance.totalRequests}`} />
          <InfoRow icon={<Wifi size={14} />} label="DOM Elements" value={`${analysis.performance.domSize}`} />
        </div>
      </SectionCard>

      {/* Tech Stack Quick View */}
      {techItems.length > 0 && (
        <SectionCard title="Technology">
          <div className="flex flex-wrap gap-1.5">
            {techItems.map((item, i) => (
              <span key={i} className="badge badge-neutral">
                {item.name}
                {item.version && <span className="ml-1 text-gray-400">{item.version}</span>}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* WordPress Quick Status */}
      {analysis.wordpress.detected && (
        <SectionCard title="WordPress Status">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Theme</span>
              <span className="font-medium text-gray-800 capitalize">
                {analysis.wordpress.theme?.active || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Plugins</span>
              <span className="font-medium text-gray-800">
                {analysis.wordpress.pluginCount || 0} detected
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Issues</span>
              <span className={`font-medium ${(analysis.wordpress.issues?.length || 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {analysis.wordpress.issues?.length || 0} found
              </span>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Critical Issues */}
      {analysis.accessibility.errorCount > 0 && (
        <SectionCard title="Issues Found" badge={<span className="badge badge-danger">{analysis.accessibility.totalIssues}</span>}>
          <div className="space-y-2">
            {analysis.accessibility.issues.slice(0, 5).map((issue: { type: string; message: string }, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm py-1">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${issue.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <span className="text-gray-600">{issue.message}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status?: 'pass' | 'fail';
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-light last:border-b-0">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span
        className={`text-sm font-medium ${
          status === 'pass'
            ? 'text-green-600'
            : status === 'fail'
              ? 'text-red-600'
              : 'text-gray-800'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
