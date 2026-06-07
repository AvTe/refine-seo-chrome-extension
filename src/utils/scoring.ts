// RefineAI Inspector — Scoring Utilities

import type { PageAnalysis, A11yIssue } from '@/types/analysis';

/**
 * Calculate SEO score (0-100)
 */
export function calculateSEOScore(analysis: PageAnalysis): number {
  if (!analysis?.seo) return 0;
  const { seo, schema } = analysis;
  let score = 100;
  const deductions: { reason: string; points: number }[] = [];

  // Title
  if (!seo.title.value) {
    deductions.push({ reason: 'Missing title', points: 15 });
  } else if (seo.title.length < 30) {
    deductions.push({ reason: 'Title too short', points: 5 });
  } else if (seo.title.length > 60) {
    deductions.push({ reason: 'Title too long', points: 3 });
  }

  // Meta description
  if (!seo.metaDescription.value) {
    deductions.push({ reason: 'Missing meta description', points: 10 });
  } else if (seo.metaDescription.length < 120) {
    deductions.push({ reason: 'Meta description too short', points: 3 });
  } else if (seo.metaDescription.length > 160) {
    deductions.push({ reason: 'Meta description too long', points: 3 });
  }

  // H1
  if (seo.h1Count === 0) {
    deductions.push({ reason: 'Missing H1', points: 10 });
  } else if (seo.h1Count > 1) {
    deductions.push({ reason: 'Multiple H1 tags', points: 5 });
  }

  // Canonical
  if (!seo.canonical) {
    deductions.push({ reason: 'Missing canonical URL', points: 5 });
  }

  // Lang
  if (!seo.lang) {
    deductions.push({ reason: 'Missing lang attribute', points: 3 });
  }

  // Open Graph
  if (!seo.og['og:title'] || !seo.og['og:description']) {
    deductions.push({ reason: 'Missing Open Graph tags', points: 5 });
  }

  // Images without alt
  if (seo.images.total > 0 && seo.images.withoutAlt > 0) {
    const ratio = seo.images.withoutAlt / seo.images.total;
    deductions.push({ reason: 'Images missing alt text', points: Math.min(10, Math.round(ratio * 15)) });
  }

  // Schema
  if (schema.count === 0) {
    deductions.push({ reason: 'No structured data', points: 5 });
  }

  // Viewport
  if (!seo.viewport) {
    deductions.push({ reason: 'Missing viewport meta', points: 5 });
  }

  const totalDeduction = deductions.reduce((sum, d) => sum + d.points, 0);
  score = Math.max(0, score - totalDeduction);

  return score;
}

/**
 * Calculate Security score (0-100)
 */
export function calculateSecurityScore(analysis: PageAnalysis): number {
  if (!analysis?.security) return 0;
  const { security } = analysis;
  let score = 100;

  if (!security.isHTTPS) score -= 30;
  if (security.mixedContent.count > 0) score -= 15;
  if (security.passwordOverHTTP) score -= 20;
  if (security.insecureForms.count > 0) score -= 10;

  // Headers (if available)
  if (security.headers) {
    if (!security.headers['strict-transport-security']) score -= 5;
    if (!security.headers['content-security-policy']) score -= 5;
    if (!security.headers['x-frame-options']) score -= 3;
    if (!security.headers['x-content-type-options']) score -= 3;
    if (!security.headers['referrer-policy']) score -= 2;
    if (!security.headers['permissions-policy']) score -= 2;
  }

  return Math.max(0, score);
}

/**
 * Calculate Performance score (0-100)
 */
export function calculatePerformanceScore(analysis: PageAnalysis): number {
  if (!analysis?.performance) return 0;
  const { performance: perf } = analysis;
  let score = 100;

  // TTFB
  if (perf.timings.ttfb !== null) {
    if (perf.timings.ttfb > 800) score -= 15;
    else if (perf.timings.ttfb > 500) score -= 8;
    else if (perf.timings.ttfb > 200) score -= 3;
  }

  // FCP
  if (perf.timings.fcp !== null) {
    if (perf.timings.fcp > 3000) score -= 15;
    else if (perf.timings.fcp > 1800) score -= 8;
    else if (perf.timings.fcp > 1000) score -= 3;
  }

  // Page weight
  const totalMB = perf.totalSize / (1024 * 1024);
  if (totalMB > 5) score -= 15;
  else if (totalMB > 3) score -= 10;
  else if (totalMB > 1.5) score -= 5;

  // Request count
  if (perf.totalRequests > 100) score -= 10;
  else if (perf.totalRequests > 60) score -= 5;

  // DOM size
  if (perf.domSize > 3000) score -= 10;
  else if (perf.domSize > 1500) score -= 5;

  return Math.max(0, score);
}

/**
 * Calculate Accessibility score (0-100)
 */
export function calculateAccessibilityScore(analysis: PageAnalysis): number {
  if (!analysis?.accessibility) return 0;
  const { accessibility } = analysis;
  let score = 100;

  accessibility.issues.forEach((issue: A11yIssue) => {
    if (issue.type === 'error') {
      score -= Math.min(10, issue.count * 3);
    } else {
      score -= Math.min(5, issue.count * 2);
    }
  });

  return Math.max(0, score);
}

/**
 * Calculate overall health score
 */
export function calculateOverallScore(analysis: PageAnalysis): number {
  const seo = calculateSEOScore(analysis);
  const security = calculateSecurityScore(analysis);
  const performance = calculatePerformanceScore(analysis);
  const accessibility = calculateAccessibilityScore(analysis);

  // Weighted average
  return Math.round(seo * 0.30 + security * 0.25 + performance * 0.25 + accessibility * 0.20);
}

/**
 * Get score color
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

/**
 * Get score label
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

/**
 * Format bytes to human-readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format milliseconds
 */
export function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

/**
 * Truncate URL for display
 */
export function truncateUrl(url: string, maxLen = 60): string {
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen - 3) + '...';
}
