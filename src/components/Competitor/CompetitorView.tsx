import { useState } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import { calculateOverallScore, calculateSEOScore, calculateSecurityScore, calculatePerformanceScore, calculateAccessibilityScore, formatBytes } from '@/utils/scoring';
import { GitCompare, ShieldAlert } from 'lucide-react';

export default function CompetitorView() {
  const { analysis, competitor, isCompetitorLoading, competitorError, analyzeCompetitor } = useAnalysis();
  const [competitorUrl, setCompetitorUrl] = useState('');

  if (!analysis) return null;

  const currentHost = analysis.site.hostname;
  const currentOverall = calculateOverallScore(analysis);
  const currentSeo = calculateSEOScore(analysis);
  const currentSecurity = calculateSecurityScore(analysis);
  const currentPerformance = calculatePerformanceScore(analysis);
  const currentAccessibility = calculateAccessibilityScore(analysis);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorUrl.trim()) return;
    analyzeCompetitor(competitorUrl);
  };

  const getComparisonRow = (
    label: string,
    currentValue: string | number,
    competitorValue: string | number,
    higherIsBetter = true
  ) => {
    const curNum = typeof currentValue === 'number' ? currentValue : parseFloat(currentValue);
    const compNum = typeof competitorValue === 'number' ? competitorValue : parseFloat(competitorValue);

    const isCurrentBetter = higherIsBetter ? curNum > compNum : curNum < compNum;
    const isDraw = curNum === compNum;

    return (
      <div className="flex items-center justify-between py-2 border-b border-border-light dark:border-zinc-800/40 last:border-b-0 text-xs">
        <span className="text-gray-500 dark:text-zinc-400 font-medium">{label}</span>
        <div className="flex gap-4 font-mono tabular-nums">
          <span className={`w-16 text-right font-semibold ${!isDraw && isCurrentBetter ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-zinc-350'}`}>
            {currentValue}
            {!isDraw && isCurrentBetter && ' ✓'}
          </span>
          <span className="text-gray-300 dark:text-zinc-600">vs</span>
          <span className={`w-16 text-left font-semibold ${!isDraw && !isCurrentBetter ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-zinc-350'}`}>
            {competitorValue}
            {!isDraw && !isCurrentBetter && ' ✓'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-grow p-5 overflow-y-auto space-y-4 animate-slide-up bg-bg">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
          <GitCompare size={18} className="text-primary-dark dark:text-primary-light" />
          Competitor Analysis
        </h1>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Compare website metrics side by side</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleScan} className="card bg-surface flex flex-col gap-2 p-3 border border-border dark:border-zinc-800">
        <label htmlFor="competitor-input" className="text-2xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Enter Competitor URL</label>
        <div className="flex gap-2">
          <input
            id="competitor-input"
            type="text"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="e.g. competitor.com"
            disabled={isCompetitorLoading}
            className="flex-1 text-xs px-3 py-1.5 border border-border dark:border-zinc-700 rounded-md focus:outline-none focus:border-primary bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={isCompetitorLoading || !competitorUrl.trim()}
            className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary-dark dark:hover:bg-primary-light/90 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {isCompetitorLoading ? 'Scanning...' : 'Compare'}
          </button>
        </div>
      </form>

      {/* Error state */}
      {competitorError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-xs flex gap-2">
          <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
          <p>{competitorError}</p>
        </div>
      )}

      {/* Loading state */}
      {isCompetitorLoading && (
        <div className="card border border-border dark:border-zinc-800 flex flex-col items-center justify-center py-16 text-center">
          <GitCompare size={32} className="text-primary animate-spin mb-3" />
          <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Analyzing Competitor Website</p>
          <p className="text-2xs text-gray-400 dark:text-zinc-500 mt-1">Fetching metrics, checking tags & headers...</p>
        </div>
      )}

      {/* Comparison results */}
      {!isCompetitorLoading && competitor && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary Card */}
          <div className="card border border-border dark:border-zinc-800 bg-gradient-to-br from-white to-surface-2 dark:from-zinc-900 dark:to-zinc-950">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Audit Scorecard</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-2 border-r border-border dark:border-zinc-800">
                <p className="text-2xs text-gray-500 dark:text-zinc-400 truncate">{currentHost}</p>
                <p className={`text-2xl font-bold mt-1 ${currentOverall >= competitor.overallScore ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-zinc-350'}`}>
                  {currentOverall}
                </p>
                <span className="text-2xs text-gray-400 dark:text-zinc-500 font-medium">Health Score</span>
              </div>
              <div className="p-2">
                <p className="text-2xs text-gray-500 dark:text-zinc-400 truncate">{competitor.hostname}</p>
                <p className={`text-2xl font-bold mt-1 ${competitor.overallScore > currentOverall ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-zinc-350'}`}>
                  {competitor.overallScore}
                </p>
                <span className="text-2xs text-gray-400 dark:text-zinc-500 font-medium">Health Score</span>
              </div>
            </div>
          </div>

          {/* Scores comparison */}
          <SectionCard title="Score Comparison" collapsible={false}>
            <div className="space-y-0">
              {getComparisonRow('SEO Score', currentSeo, competitor.seoScore)}
              {getComparisonRow('Security Score', currentSecurity, competitor.securityScore)}
              {getComparisonRow('Performance Score', currentPerformance, competitor.performanceScore)}
              {getComparisonRow('Accessibility Score', currentAccessibility, competitor.accessibilityScore)}
              {getComparisonRow('Overall Score', currentOverall, competitor.overallScore)}
            </div>
          </SectionCard>

          {/* Resources comparison */}
          <SectionCard title="Website Footprint" collapsible={false}>
            <div className="space-y-0">
              {getComparisonRow('Page Size', formatBytes(analysis.performance.totalSize), formatBytes(competitor.pageSize), false)}
              {getComparisonRow('Total Requests', analysis.performance.totalRequests, competitor.requestsCount, false)}
              {getComparisonRow('CMS Platform', analysis.wordpress.detected ? 'WordPress' : analysis.shopify.detected ? 'Shopify' : 'Custom', competitor.cms, false)}
              {getComparisonRow('Stack Count', Object.values(analysis.technology).flat().length, competitor.technologiesCount)}
            </div>
          </SectionCard>

          {/* Actionable Comparison advice */}
          <div className="p-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg text-xs">
            <span className="font-semibold text-primary-dark dark:text-primary-light">Auditor Note:</span>
            <p className="text-gray-600 dark:text-zinc-300 mt-1">
              {currentOverall >= competitor.overallScore
                ? `Nice job! Your site outscores ${competitor.hostname} by ${currentOverall - competitor.overallScore} points. Keep optimizing your performance metrics to widen the lead.`
                : `Your website scores lower than ${competitor.hostname} by ${competitor.overallScore - currentOverall} points. Address your security headers and page size footprint to match their performance.`}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isCompetitorLoading && !competitor && (
        <div className="card border border-border dark:border-zinc-800 flex flex-col items-center justify-center py-12 text-center">
          <GitCompare size={28} className="text-gray-300 dark:text-zinc-700 mb-2" />
          <p className="text-xs font-semibold text-gray-600 dark:text-zinc-300">No competitor scanned yet</p>
          <p className="text-2xs text-gray-400 dark:text-zinc-500 mt-0.5">Input a competitor URL above to perform a side-by-side comparison.</p>
        </div>
      )}
    </div>
  );
}
