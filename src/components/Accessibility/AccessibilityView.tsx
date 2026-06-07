import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import { calculateAccessibilityScore, getScoreColor } from '@/utils/scoring';
import { Eye, AlertCircle, AlertTriangle } from 'lucide-react';

export default function AccessibilityView() {
  const { analysis } = useAnalysis();
  if (!analysis) return null;

  const { accessibility: a11y } = analysis;
  const score = calculateAccessibilityScore(analysis);
  const color = getScoreColor(score);

  const complianceLevel =
    score >= 90 ? 'AA Compliant' : score >= 70 ? 'Partial' : 'Non-Compliant';
  const complianceBadge =
    score >= 90
      ? 'badge-success'
      : score >= 70
        ? 'badge-warning'
        : 'badge-danger';

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Accessibility</h1>
          <p className="text-xs text-gray-400 mt-0.5">{analysis.site.hostname}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>

      {/* WCAG Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye size={20} className="text-primary-dark" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">WCAG Assessment</p>
              <p className="text-xs text-gray-500">
                {a11y.errorCount} errors · {a11y.warningCount} warnings
              </p>
            </div>
          </div>
          <span className={`badge ${complianceBadge}`}>{complianceLevel}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-xs font-medium text-red-700">Errors</span>
          </div>
          <p className="text-xl font-bold text-red-600 tabular-nums">
            {a11y.errorCount}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-700">Warnings</span>
          </div>
          <p className="text-xl font-bold text-amber-600 tabular-nums">
            {a11y.warningCount}
          </p>
        </div>
      </div>

      {/* Issues List */}
      {a11y.issues.length > 0 ? (
        <SectionCard
          title="Issues"
          badge={
            <span className="badge badge-danger">{a11y.totalIssues}</span>
          }
        >
          <div className="space-y-0">
            {a11y.issues.map((issue, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3 border-b border-border-light last:border-0"
              >
                {issue.type === 'error' ? (
                  <AlertCircle
                    size={16}
                    className="text-red-500 mt-0.5 flex-shrink-0"
                  />
                ) : (
                  <AlertTriangle
                    size={16}
                    className="text-amber-500 mt-0.5 flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{issue.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="badge badge-neutral text-2xs">
                      WCAG {issue.wcag}
                    </span>
                    <span className="badge badge-neutral text-2xs">
                      {issue.rule}
                    </span>
                    {issue.count > 1 && (
                      <span className="text-xs text-gray-400">
                        × {issue.count}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`badge text-2xs ${
                    issue.type === 'error' ? 'badge-danger' : 'badge-warning'
                  }`}
                >
                  {issue.type}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <Eye size={32} className="text-green-300 mb-3" />
          <p className="text-sm font-medium text-green-600">
            No Issues Found
          </p>
          <p className="text-xs text-gray-400 mt-1">
            This page passes basic accessibility checks.
          </p>
        </div>
      )}
    </div>
  );
}
