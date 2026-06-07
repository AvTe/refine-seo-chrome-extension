import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import { calculatePerformanceScore, getScoreColor, formatBytes, formatMs } from '@/utils/scoring';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

export default function PerformanceView() {
  const { analysis } = useAnalysis();
  if (!analysis) return null;

  const { performance: perf } = analysis;
  const score = calculatePerformanceScore(analysis);
  const color = getScoreColor(score);

  const timingData = [
    { name: 'DNS', value: perf.timings.dns || 0, color: '#c190ff' },
    { name: 'SSL', value: perf.timings.ssl || 0, color: '#a06ce0' },
    { name: 'TTFB', value: perf.timings.ttfb || 0, color: '#8b4fcf' },
    { name: 'FCP', value: perf.timings.fcp || 0, color: '#7639b8' },
    { name: 'Load', value: perf.timings.loadComplete || 0, color: '#5e2d91' },
  ];

  const resourceData = [
    { name: 'Images', count: perf.resources.images.count, size: perf.resources.images.totalSize },
    { name: 'Scripts', count: perf.resources.scripts.count, size: perf.resources.scripts.totalSize },
    { name: 'CSS', count: perf.resources.stylesheets.count, size: perf.resources.stylesheets.totalSize },
    { name: 'Fonts', count: perf.resources.fonts.count, size: perf.resources.fonts.totalSize },
    { name: 'Other', count: perf.resources.other.count, size: perf.resources.other.totalSize },
  ];

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Performance</h1>
          <p className="text-xs text-gray-400 mt-0.5">{analysis.site.hostname}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="TTFB" value={formatMs(perf.timings.ttfb)} threshold={perf.timings.ttfb ? perf.timings.ttfb < 200 ? 'good' : perf.timings.ttfb < 500 ? 'ok' : 'bad' : 'ok'} />
        <MetricCard label="FCP" value={formatMs(perf.timings.fcp)} threshold={perf.timings.fcp ? perf.timings.fcp < 1000 ? 'good' : perf.timings.fcp < 1800 ? 'ok' : 'bad' : 'ok'} />
        <MetricCard label="Page Size" value={formatBytes(perf.totalSize)} threshold={perf.totalSize < 1500000 ? 'good' : perf.totalSize < 3000000 ? 'ok' : 'bad'} />
        <MetricCard label="Requests" value={`${perf.totalRequests}`} threshold={perf.totalRequests < 40 ? 'good' : perf.totalRequests < 80 ? 'ok' : 'bad'} />
      </div>

      {/* Timing Waterfall */}
      <SectionCard title="Load Timeline">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timingData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#a3a3a3' }} tickFormatter={(v: any) => `${v}ms`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#737373' }} width={40} />
              <Tooltip
                formatter={(value: any) => [`${Math.round(Number(value || 0))} ms`, 'Duration']}
                contentStyle={{ fontSize: 12, border: '1px solid #e5e5e5', borderRadius: 8, boxShadow: 'none' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {timingData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Resource Breakdown */}
      <SectionCard title="Resource Breakdown">
        <div className="space-y-3">
          {resourceData.map((res, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">{res.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{res.count} files</span>
                  <span className="text-xs font-medium text-gray-600 tabular-nums w-16 text-right">{formatBytes(res.size)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${perf.totalSize > 0 ? (res.size / perf.totalSize) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* DOM Metrics */}
      <SectionCard title="DOM Metrics">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-surface rounded-lg">
            <p className={`stat-value text-lg ${perf.domSize > 1500 ? 'text-amber-600' : 'text-gray-900'}`}>
              {perf.domSize.toLocaleString()}
            </p>
            <p className="stat-label">Elements</p>
          </div>
          <div className="text-center p-3 bg-surface rounded-lg">
            <p className="stat-value text-lg">{perf.domDepth}</p>
            <p className="stat-label">Max Depth</p>
          </div>
        </div>
      </SectionCard>

      {/* Largest Resources */}
      {perf.resources.images.items.length > 0 && (
        <SectionCard title="Largest Images" defaultOpen={false}>
          <div className="space-y-1">
            {perf.resources.images.items.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border-light last:border-0">
                <span className="text-gray-600 truncate max-w-[60%]">
                  {item.url.split('/').pop()?.split('?')[0] || item.url}
                </span>
                <span className="font-medium text-gray-800 tabular-nums">{formatBytes(item.size)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function MetricCard({ label, value, threshold }: { label: string; value: string; threshold: 'good' | 'ok' | 'bad' }) {
  const colors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    ok: 'text-amber-600 bg-amber-50 border-amber-200',
    bad: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[threshold]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-lg font-bold mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}
