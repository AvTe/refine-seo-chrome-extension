import { useState } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import StatusCheck from '@/components/shared/StatusCheck';
import { calculateSEOScore, getScoreColor } from '@/utils/scoring';
import type { PageAnalysis } from '@/types/analysis';
import { ExternalLink, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

type SEOTab = 'onpage' | 'content' | 'links' | 'schema';

export default function SEOInspector() {
  const { analysis } = useAnalysis();
  const [activeTab, setActiveTab] = useState<SEOTab>('onpage');

  if (!analysis) return null;
  const { seo, schema } = analysis;
  const score = calculateSEOScore(analysis);
  const color = getScoreColor(score);

  const tabs: { id: SEOTab; label: string }[] = [
    { id: 'onpage', label: 'On-Page' },
    { id: 'content', label: 'Content' },
    { id: 'links', label: 'Links' },
    { id: 'schema', label: 'Schema' },
  ];

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">SEO Inspector</h1>
          <p className="text-xs text-gray-400 mt-0.5">{analysis.site.hostname}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'onpage' && <OnPageTab seo={seo} />}
      {activeTab === 'content' && <ContentTab seo={seo} />}
      {activeTab === 'links' && <LinksTab seo={seo} />}
      {activeTab === 'schema' && <SchemaTab schema={schema} />}
    </div>
  );
}

function OnPageTab({ seo }: { seo: PageAnalysis['seo'] }) {
  const [selectedHeadingIndex, setSelectedHeadingIndex] = useState<number | null>(null);
  const [showAllHeadings, setShowAllHeadings] = useState(false);
  
  const titleStatus = !seo.title.value ? 'fail' : seo.title.length >= 30 && seo.title.length <= 60 ? 'pass' : 'warning';
  const descStatus = !seo.metaDescription.value ? 'fail' : seo.metaDescription.length >= 120 && seo.metaDescription.length <= 160 ? 'pass' : 'warning';
  const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime?.id;

  const highlightHeadingOnPage = (index: number | null, scroll = false) => {
    if (!isChromeExtension) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        if (index !== null) {
          chrome.tabs.sendMessage(activeTab.id, { 
            type: 'HIGHLIGHT_HEADING', 
            index, 
            scroll 
          }).catch(() => {});
        } else {
          chrome.tabs.sendMessage(activeTab.id, { 
            type: 'CLEAR_HIGHLIGHT' 
          }).catch(() => {});
        }
      }
    });
  };

  const displayedHeadings = showAllHeadings ? seo.headings : seo.headings.slice(0, 15);

  return (
    <div className="space-y-3">
      {/* Title */}
      <SectionCard title="Title Tag">
        <div className="space-y-2">
          <p className="text-sm text-gray-700 bg-surface p-2 rounded break-all">
            {seo.title.value || <span className="text-red-400 italic">Missing</span>}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{seo.title.length} characters</span>
            <span className={`badge ${titleStatus === 'pass' ? 'badge-success' : titleStatus === 'fail' ? 'badge-danger' : 'badge-warning'}`}>
              {titleStatus === 'pass' ? '✓ Optimal' : titleStatus === 'fail' ? '✕ Missing' : '⚠ Length'}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Meta Description */}
      <SectionCard title="Meta Description">
        <div className="space-y-2">
          <p className="text-sm text-gray-700 bg-surface p-2 rounded break-all">
            {seo.metaDescription.value || <span className="text-red-400 italic">Missing</span>}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{seo.metaDescription.length} characters</span>
            <span className={`badge ${descStatus === 'pass' ? 'badge-success' : descStatus === 'fail' ? 'badge-danger' : 'badge-warning'}`}>
              {descStatus === 'pass' ? '✓ Optimal' : descStatus === 'fail' ? '✕ Missing' : seo.metaDescription.length > 160 ? '⚠ Too Long' : '⚠ Too Short'}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Meta Tags */}
      <SectionCard title="Meta Tags">
        <div className="space-y-0">
          <StatusCheck label="Canonical URL" status={seo.canonical ? 'pass' : 'fail'} detail={seo.canonical || undefined} />
          <StatusCheck label="Robots" status={seo.robots ? 'pass' : 'warning'} detail={seo.robots || 'Not set'} />
          <StatusCheck label="Language" status={seo.lang ? 'pass' : 'fail'} detail={seo.lang || undefined} />
          <StatusCheck label="Viewport" status={seo.viewport ? 'pass' : 'fail'} />
          <StatusCheck label="Charset" status={seo.charset ? 'pass' : 'warning'} detail={seo.charset} />
          <StatusCheck label="Favicon" status={seo.favicon ? 'pass' : 'warning'} />
        </div>
      </SectionCard>

      {/* Open Graph */}
      <SectionCard title="Open Graph" defaultOpen={false}>
        <div className="space-y-0">
          <StatusCheck label="og:title" status={seo.og['og:title'] ? 'pass' : 'fail'} detail={seo.og['og:title']} />
          <StatusCheck label="og:description" status={seo.og['og:description'] ? 'pass' : 'fail'} detail={seo.og['og:description']?.substring(0, 80)} />
          <StatusCheck label="og:image" status={seo.og['og:image'] ? 'pass' : 'fail'} />
          <StatusCheck label="og:type" status={seo.og['og:type'] ? 'pass' : 'warning'} detail={seo.og['og:type']} />
        </div>
      </SectionCard>

      {/* Twitter Card */}
      <SectionCard title="Twitter Card" defaultOpen={false}>
        <div className="space-y-0">
          <StatusCheck label="twitter:card" status={seo.twitter['twitter:card'] ? 'pass' : 'warning'} detail={seo.twitter['twitter:card']} />
          <StatusCheck label="twitter:title" status={seo.twitter['twitter:title'] ? 'pass' : 'warning'} detail={seo.twitter['twitter:title']} />
        </div>
      </SectionCard>

      {/* Heading Structure */}
      <SectionCard title="Headings" badge={<span className="badge badge-neutral">{seo.headings.length}</span>}>
        <div className="space-y-0">
          <StatusCheck
            label={`H1 Tags (${seo.h1Count})`}
            status={seo.h1Count === 1 ? 'pass' : seo.h1Count === 0 ? 'fail' : 'warning'}
            detail={seo.h1Count === 1 ? 'One H1 — optimal' : seo.h1Count === 0 ? 'Missing H1 tag' : `${seo.h1Count} H1 tags found`}
          />
        </div>
        <div className="mt-2 space-y-1">
          {displayedHeadings.map((h: { tag: string; text: string; level: number }, i: number) => {
            const isSelected = selectedHeadingIndex === i;
            return (
              <div 
                key={i} 
                className={`flex items-start gap-2 text-xs py-1.5 px-2 rounded cursor-pointer transition-all duration-150 group border-l-2
                  ${isSelected 
                    ? 'bg-indigo-50 border-indigo-500 font-medium text-indigo-950' 
                    : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-transparent'
                  }`}
                style={{ marginLeft: `${(h.level - 1) * 12}px` }}
                onClick={() => {
                  const nextIndex = isSelected ? null : i;
                  setSelectedHeadingIndex(nextIndex);
                  highlightHeadingOnPage(nextIndex, true);
                }}
                onMouseEnter={() => {
                  highlightHeadingOnPage(i, false);
                }}
                onMouseLeave={() => {
                  highlightHeadingOnPage(isSelected ? i : selectedHeadingIndex, false);
                }}
              >
                <span className={`badge flex-shrink-0 text-2xs transition-colors duration-150 py-0.5 px-1.5 h-4 min-h-0 font-semibold
                  ${isSelected 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-neutral text-gray-500 group-hover:bg-gray-200'
                  }`}
                >
                  {h.tag.toUpperCase()}
                </span>
                <span className="break-all leading-tight">{h.text}</span>
              </div>
            );
          })}
          
          {seo.headings.length > 15 && (
            <button
              onClick={() => setShowAllHeadings(!showAllHeadings)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline mt-2 block w-full text-center py-1 bg-surface rounded border border-gray-100"
            >
              {showAllHeadings ? 'Show less' : `Show all ${seo.headings.length} headings`}
            </button>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function ContentTab({ seo }: { seo: PageAnalysis['seo'] }) {
  return (
    <div className="space-y-3">
      {/* Content Stats */}
      <SectionCard title="Content Statistics" collapsible={false}>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-surface rounded-lg">
            <p className="stat-value text-lg">{seo.content.wordCount.toLocaleString()}</p>
            <p className="stat-label">Words</p>
          </div>
          <div className="text-center p-3 bg-surface rounded-lg">
            <p className="stat-value text-lg">{seo.content.readingTime} min</p>
            <p className="stat-label">Reading Time</p>
          </div>
        </div>
      </SectionCard>

      {/* Keyword Density */}
      <SectionCard title="Top Keywords" badge={<span className="badge badge-neutral">{seo.content.keywords.length}</span>}>
        <div className="space-y-2">
          {seo.content.keywords.map((kw: { word: string; density: string }, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm py-1">
              <span className="text-gray-700">{kw.word}</span>
              <div className="flex items-center gap-3">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, parseFloat(kw.density) * 20)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 tabular-nums w-10 text-right">
                  {kw.density}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Images */}
      <SectionCard title="Images" badge={<span className="badge badge-neutral">{seo.images.total}</span>}>
        <StatusCheck
          label="Images with alt text"
          status={seo.images.withoutAlt === 0 ? 'pass' : 'warning'}
          detail={`${seo.images.total - seo.images.withoutAlt} of ${seo.images.total} have alt text`}
        />
        {seo.images.missingAlt.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-400 font-medium">Missing Alt Text:</p>
            {seo.images.missingAlt.slice(0, 5).map((img: { src: string }, i: number) => (
              <p key={i} className="text-xs text-red-500 truncate pl-2">
                {img.src}
              </p>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function LinksTab({ seo }: { seo: PageAnalysis['seo'] }) {
  const { analysis } = useAnalysis();
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<Record<string, { status: string; code: number; error?: string }>>({});
  const [auditRan, setAuditRan] = useState(false);

  const getAbsoluteUrl = (href: string) => {
    if (!href) return '';
    if (href.startsWith('javascript:')) return '';
    if (href.startsWith('#')) {
      return `${analysis?.site.protocol || 'https:'}//${analysis?.site.hostname || ''}${analysis?.site.pathname || ''}${href}`;
    }
    if (href.startsWith('http://') || href.startsWith('https://')) return href;
    if (href.startsWith('//')) return `${analysis?.site.protocol || 'https:'}${href}`;
    if (href.startsWith('/')) {
      return `${analysis?.site.protocol || 'https:'}//${analysis?.site.hostname || ''}${href}`;
    }
    return `${analysis?.site.protocol || 'https:'}//${analysis?.site.hostname || ''}/${href}`;
  };

  const allLinks = [
    ...seo.links.internal.items.map(l => l.href),
    ...seo.links.external.items.map(l => l.href)
  ].map(getAbsoluteUrl).filter(url => url && url.startsWith('http'));
  const uniqueLinks = [...new Set(allLinks)];

  const runLinkAudit = () => {
    setIsAuditing(true);
    setAuditResults({});
    setAuditRan(true);

    if (uniqueLinks.length === 0) {
      setIsAuditing(false);
      return;
    }

    const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime?.id;
    if (!isChromeExtension) {
      // Dev mode mock check
      setTimeout(() => {
        const mockRes: Record<string, { status: string; code: number }> = {};
        uniqueLinks.forEach((url, index) => {
          if (index === 1 || index === 4) {
            mockRes[url] = { status: 'success', code: 301 }; // redirect
          } else if (index === 2) {
            mockRes[url] = { status: 'fail', code: 404 }; // broken
          } else {
            mockRes[url] = { status: 'success', code: 200 };
          }
        });
        setAuditResults(mockRes);
        setIsAuditing(false);
      }, 1500);
      return;
    }

    chrome.runtime.sendMessage({ type: 'CHECK_LINKS_HEALTH', links: uniqueLinks }, (response: any) => {
      if (response?.success && response.results) {
        setAuditResults(response.results);
      }
      setIsAuditing(false);
    });
  };

  const getStatusBadge = (url: string) => {
    const absUrl = getAbsoluteUrl(url);
    const result = auditResults[absUrl];
    if (!result) return null;

    if (result.status === 'checking') {
      return <span className="text-3xs text-primary animate-pulse font-semibold">checking...</span>;
    }
    if (result.code === 200) {
      return <span className="badge badge-success text-3xs py-0 px-1 font-semibold flex items-center gap-0.5"><CheckCircle size={8} /> 200 OK</span>;
    }
    if (result.code >= 300 && result.code < 400) {
      return <span className="badge badge-warning text-3xs py-0 px-1 font-semibold flex items-center gap-0.5"><AlertTriangle size={8} /> {result.code} Redirect</span>;
    }
    if (result.code >= 400 || result.code === 0) {
      return <span className="badge badge-danger text-3xs py-0 px-1 font-semibold flex items-center gap-0.5"><AlertTriangle size={8} /> {result.code || 'ERR'} Broken</span>;
    }
    return null;
  };

  const brokenCount = Object.values(auditResults).filter(r => r.code >= 400 || r.code === 0).length;
  const redirectCount = Object.values(auditResults).filter(r => r.code >= 300 && r.code < 400).length;
  const healthyCount = Object.values(auditResults).filter(r => r.code === 200).length;

  return (
    <div className="space-y-3">
      {/* Run Audit Card */}
      <div className="card space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-gray-900">Broken Link Checker</p>
            <p className="text-3xs text-gray-400 mt-0.5">Audit HTTP status of all {uniqueLinks.length} unique page links</p>
          </div>
          <button
            onClick={runLinkAudit}
            disabled={isAuditing || uniqueLinks.length === 0}
            className="px-2.5 py-1 bg-primary hover:bg-primary-dark text-white text-3xs font-bold rounded flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={10} className={isAuditing ? 'animate-spin' : ''} />
            <span>{isAuditing ? 'Auditing...' : 'Check Links'}</span>
          </button>
        </div>

        {/* Audit Results stats */}
        {auditRan && !isAuditing && (
          <div className="grid grid-cols-3 gap-2 animate-fade-in pt-1">
            <div className="p-2 border border-green-200 bg-green-50/50 rounded text-center">
              <p className="text-sm font-bold text-green-700">{healthyCount}</p>
              <p className="text-3xs text-green-600 font-medium">Healthy (200)</p>
            </div>
            <div className="p-2 border border-amber-200 bg-amber-50/50 rounded text-center">
              <p className="text-sm font-bold text-amber-700">{redirectCount}</p>
              <p className="text-3xs text-amber-600 font-medium">Redirects (3xx)</p>
            </div>
            <div className="p-2 border border-red-200 bg-red-50/50 rounded text-center">
              <p className="text-sm font-bold text-red-700">{brokenCount}</p>
              <p className="text-3xs text-red-600 font-medium">Broken (40x/50x)</p>
            </div>
          </div>
        )}
      </div>

      <SectionCard title="Link Summary" collapsible={false}>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-surface rounded-lg">
            <p className="stat-value text-lg">{seo.links.internal.count}</p>
            <p className="stat-label">Internal</p>
          </div>
          <div className="text-center p-3 bg-surface rounded-lg">
            <p className="stat-value text-lg">{seo.links.external.count}</p>
            <p className="stat-label">External</p>
          </div>
          <div className="text-center p-3 bg-surface rounded-lg">
            <p className="stat-value text-lg">{seo.links.nofollow.count}</p>
            <p className="stat-label">Nofollow</p>
          </div>
        </div>
      </SectionCard>

      {seo.links.internal.items.length > 0 && (
        <SectionCard title="Internal Links" defaultOpen={true} badge={<span className="badge badge-neutral">{seo.links.internal.count}</span>}>
          <div className="space-y-1">
            {seo.links.internal.items.slice(0, 30).map((link: { href: string; text: string; isNofollow: boolean }, i: number) => {
              const absUrl = getAbsoluteUrl(link.href);
              return (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border-light last:border-0 min-w-0">
                  <div className="flex flex-col min-w-0 flex-1 mr-2">
                    <span className="text-gray-700 truncate font-medium">
                      {link.text ? link.text : <span className="text-gray-400 italic">[No Anchor Text]</span>}
                    </span>
                    {absUrl ? (
                      <a
                        href={absUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-dark hover:underline truncate text-2xs flex items-center gap-0.5"
                      >
                        {link.href}
                        <ExternalLink size={10} className="inline flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-gray-400 truncate text-2xs">{link.href}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {getStatusBadge(link.href)}
                    {link.isNofollow && <span className="badge badge-warning text-2xs">nofollow</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {seo.links.external.items.length > 0 && (
        <SectionCard title="External Links" defaultOpen={true} badge={<span className="badge badge-neutral">{seo.links.external.count}</span>}>
          <div className="space-y-1">
            {seo.links.external.items.slice(0, 15).map((link: { href: string; text?: string; isNofollow: boolean }, i: number) => {
              const absUrl = getAbsoluteUrl(link.href);
              return (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border-light last:border-0 min-w-0">
                  <div className="flex flex-col min-w-0 flex-1 mr-2">
                    <span className="text-gray-700 truncate font-medium">
                      {link.text ? link.text : <span className="text-gray-400 italic">[No Anchor Text]</span>}
                    </span>
                    {absUrl ? (
                      <a
                        href={absUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-dark hover:underline truncate text-2xs flex items-center gap-0.5"
                      >
                        {link.href}
                        <ExternalLink size={10} className="inline flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-gray-400 truncate text-2xs">{link.href}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {getStatusBadge(link.href)}
                    {link.isNofollow && <span className="badge badge-warning text-2xs">nofollow</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function SchemaTab({ schema }: { schema: PageAnalysis['schema'] }) {
  return (
    <div className="space-y-3">
      <SectionCard title="Structured Data" collapsible={false}>
        <StatusCheck
          label="JSON-LD"
          status={schema.count > 0 ? 'pass' : 'fail'}
          detail={`${schema.count} schema block(s) found`}
        />
        <StatusCheck
          label="Microdata"
          status={schema.hasMicrodata ? 'pass' : 'info'}
          detail={schema.hasMicrodata ? `${schema.microdataCount} items` : 'Not used'}
        />
      </SectionCard>

      {schema.types.length > 0 && (
        <SectionCard title="Schema Types">
          <div className="flex flex-wrap gap-1.5">
            {schema.types.map((type: string, i: number) => (
              <span key={i} className="badge badge-info">{type}</span>
            ))}
          </div>
        </SectionCard>
      )}

      {schema.count === 0 && (
        <div className="card bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800 font-medium">No structured data found</p>
          <p className="text-xs text-amber-600 mt-1">
            Adding JSON-LD structured data helps search engines understand your content better.
          </p>
        </div>
      )}
    </div>
  );
}

// End of SEOInspector.tsx
