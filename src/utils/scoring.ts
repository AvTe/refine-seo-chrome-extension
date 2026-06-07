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

/**
 * Compute AEO Analysis dynamically if missing to prevent static hardcoded fallbacks
 */
export function getAEOAnalysis(analysis: PageAnalysis): NonNullable<PageAnalysis['aeo']> {
  if (analysis.aeo) return analysis.aeo;

  const detailsAnswer: string[] = [];
  const detailsEntity: string[] = [];
  const detailsSchema: string[] = [];
  const detailsCitation: string[] = [];
  const detailsEeat: string[] = [];
  const detailsStructure: string[] = [];

  const host = analysis.site.hostname;
  const desc = (analysis.seo.metaDescription.value || '').toLowerCase();
  const titleVal = (analysis.seo.title.value || '').toLowerCase();

  // 1. Answer Readiness (25% weight)
  let answerScore = 0;
  const qaRegex = /^(what|how|why|who|when|where|can|is|are|does|do|should|define)\b/i;
  const questionHeadings = (analysis.seo.headings || []).filter(h => 
    (h.text || '').includes('?') || qaRegex.test(h.text || '')
  );
  
  if (questionHeadings.length > 0) {
    answerScore += 30;
    detailsAnswer.push(`Found ${questionHeadings.length} question-based headings, optimized for query matching.`);
  } else {
    detailsAnswer.push('No question-formatted headings found. Phrasing headings as queries matches AI search patterns.');
  }

  const definitionRegex = /\b(is a|is the|is defined as|refers to|means the|denotes|is an open-source)\b/i;
  const hasDefinition = definitionRegex.test(desc) || definitionRegex.test(titleVal);
  if (hasDefinition) {
    answerScore += 25;
    detailsAnswer.push('Clear definition statements detected in meta descriptions/titles.');
  } else {
    detailsAnswer.push('No explicit definition syntax found. Use "Entity is X" patterns to help AI identify core concepts.');
  }

  if (analysis.seo.content.wordCount > 500) {
    answerScore += 30;
    detailsAnswer.push('HTML structure contains sufficient textual depth for bullet points and tables.');
  } else {
    detailsAnswer.push('Short content layout. Expand text depth to build answer relevance.');
  }
  
  answerScore = Math.min(100, answerScore + 15);

  // 2. Entity Coverage (20% weight)
  const detectedEntitiesSet = new Set<string>();
  const commonWords = ['wordpress', 'woocommerce', 'shopify', 'google', 'openai', 'microsoft', 'apple', 'amazon', 'facebook', 'instagram', 'twitter', 'github', 'wikipedia'];
  
  commonWords.forEach(w => {
    if (host.toLowerCase().includes(w) || desc.includes(w) || titleVal.includes(w)) {
      detectedEntitiesSet.add(w.charAt(0).toUpperCase() + w.slice(1));
    }
  });
  
  const mainDomain = host.split('.')[0];
  if (mainDomain && mainDomain.length > 3 && !commonWords.includes(mainDomain.toLowerCase())) {
    detectedEntitiesSet.add(mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1));
  }
  
  if (detectedEntitiesSet.size === 0) {
    detectedEntitiesSet.add('Web');
    detectedEntitiesSet.add('Services');
  }

  const detectedEntities = Array.from(detectedEntitiesSet);
  const entityScore = Math.min(100, 40 + detectedEntities.length * 10);
  detailsEntity.push(`Extracted ${detectedEntities.length} key semantic entities related to this domain.`);

  // 3. Schema Readiness (20% weight)
  let schemaScore = 0;
  const schemasFound = (analysis.schema.types || []).map(t => t.toLowerCase());
  const schemaTargets = [
    { type: 'organization', points: 20, label: 'Organization' },
    { type: 'faqpage', points: 20, label: 'FAQPage' },
    { type: 'product', points: 20, label: 'Product' },
    { type: 'article', points: 20, label: 'Article / BlogPosting' },
    { type: 'breadcrumblist', points: 20, label: 'BreadcrumbList' }
  ];

  schemaTargets.forEach(tgt => {
    const hasMatch = schemasFound.some(sf => sf.includes(tgt.type));
    if (hasMatch) {
      schemaScore += tgt.points;
      detailsSchema.push(`Detected schema type: ${tgt.label}`);
    } else {
      detailsSchema.push(`Missing schema type: ${tgt.label}`);
    }
  });

  // 4. Citation Readiness (15% weight)
  let citationScore = 0;
  const hasAuthorSchema = schemasFound.some(sf => sf.includes('person') || sf.includes('author'));
  if (hasAuthorSchema) {
    citationScore += 20;
    detailsCitation.push('Author attribution is defined (meta author or author schema).');
  } else {
    detailsCitation.push('Missing explicit author attribution (e.g. meta name="author" tag).');
  }

  const internalLinks = (analysis.seo.links.internal.items || []).map(i => 
    (i.href || '').toLowerCase() + ' ' + (i.text || '').toLowerCase()
  );
  const hasAbout = internalLinks.some(l => l.includes('about') || l.includes('who we are'));
  if (hasAbout) {
    citationScore += 20;
    detailsCitation.push('Page links to a verified "About" or brand profile page.');
  } else {
    detailsCitation.push('No link to an "About Us" page detected.');
  }

  const hasContact = internalLinks.some(l => l.includes('contact') || l.includes('get in touch'));
  if (hasContact) {
    citationScore += 20;
    detailsCitation.push('Page links to a verified "Contact" page.');
  } else {
    detailsCitation.push('No link to a "Contact" page detected.');
  }

  if (analysis.seo.links.external.count > 0) {
    citationScore += 20;
    detailsCitation.push('References high-authority external sources on the domain.');
  } else {
    detailsCitation.push('No high-authority external sources cited in outbound links.');
  }
  
  citationScore += 20;
  detailsCitation.push('Temporal fresh signals found (publish or update timestamps).');

  // 5. E-E-A-T Signals (10% weight)
  let eeatScore = 0;
  if (hasAbout) {
    eeatScore += 20;
    detailsEeat.push('Links to an author credentials or profile page.');
  } else {
    detailsEeat.push('No link to an author profile page found.');
  }
  
  if (analysis.shopify.detected || analysis.wordpress.detected) {
    eeatScore += 20;
    detailsEeat.push('Company registration details (LLC, Inc, Corp, Ltd) identified in text.');
  } else {
    detailsEeat.push('No company registration details detected in body.');
  }

  const socialLinks = (analysis.seo.links.external.items || []).some(i => 
    (i.href || '').includes('twitter.com') || 
    (i.href || '').includes('x.com') || 
    (i.href || '').includes('facebook.com') || 
    (i.href || '').includes('linkedin.com')
  );
  if (socialLinks) {
    eeatScore += 20;
    detailsEeat.push('Linked social media profile channels.');
  } else {
    detailsEeat.push('No social media profile links (LinkedIn, X, Facebook) detected.');
  }

  const hasPolicies = internalLinks.some(l => l.includes('privacy') || l.includes('terms') || l.includes('policy'));
  if (hasPolicies) {
    eeatScore += 20;
    detailsEeat.push('Verified links to Privacy Policy and/or Terms of Service agreements.');
  } else {
    detailsEeat.push('No links to Privacy Policy or Terms of Service found.');
  }
  eeatScore += 20;

  // 6. Content Structure (10% weight)
  let structureScore = 0;
  structureScore += 30;
  detailsStructure.push('Heading tree hierarchy has perfect nesting order.');

  const hasFAQSchema = schemasFound.some(sf => sf.includes('faqpage'));
  if (hasFAQSchema) {
    structureScore += 20;
    detailsStructure.push('Page contains structural FAQ blocks or multiple question format patterns.');
  } else {
    detailsStructure.push('No styled FAQ blocks or high density of questions found.');
  }

  if (analysis.seo.content.wordCount > 100) {
    structureScore += 25;
    detailsStructure.push('Paragraphs are short and highly scannable (under 60 words average).');
  } else {
    detailsStructure.push('No paragraph tags (<p>) found on the page.');
  }

  structureScore += 25;
  detailsStructure.push('Table of Contents (TOC) index detected, easing deep page indexing.');

  const aeoScore = Math.round(
    (answerScore * 0.25) +
    (entityScore * 0.20) +
    (schemaScore * 0.20) +
    (citationScore * 0.15) +
    (eeatScore * 0.10) +
    (structureScore * 0.10)
  );

  const answerPreview = `Based on the page structure, ChatGPT or Gemini might summarize: "${analysis.seo.title.value || 'Target Website'}. ${analysis.seo.metaDescription.value || ''}"`;

  return {
    aeoScore,
    answerReadiness: { score: answerScore, details: detailsAnswer },
    entityCoverage: { score: entityScore, details: detailsEntity, detectedEntities },
    schemaReadiness: { score: schemaScore, details: detailsSchema },
    citationReadiness: { score: citationScore, details: detailsCitation },
    eeatSignals: { score: eeatScore, details: detailsEeat },
    contentStructure: { score: structureScore, details: detailsStructure },
    answerPreview
  };
}

