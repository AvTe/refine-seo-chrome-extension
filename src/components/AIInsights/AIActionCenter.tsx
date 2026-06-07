import { useState } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import { Sparkles, Copy, Check, FileJson, AlertCircle, AlertTriangle, Type, Tag, HelpCircle, FileText } from 'lucide-react';

interface AIActionCenterState {
  title?: string;
  description?: string;
  faqSchema?: string;
  productSchema?: string;
  headingGuide?: string;
  altTexts?: { src: string; suggestedAlt: string }[];
}

export default function AIActionCenter() {
  const { analysis, apiKey } = useAnalysis();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [generations, setGenerations] = useState<AIActionCenterState>({});

  if (!analysis) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const callGemini = async (prompt: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('No API Key');
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  };

  const handleGenerate = async (type: keyof AIActionCenterState, prompt: string, fallbackGenerator: () => string | any) => {
    setLoadingMap(prev => ({ ...prev, [type]: true }));
    try {
      if (apiKey) {
        const result = await callGemini(prompt);
        let cleanResult = result.trim();
        // Clean JSON formatting if Gemini returns markdown fences
        if (type === 'faqSchema' || type === 'productSchema') {
          cleanResult = cleanResult.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }
        if (type === 'altTexts') {
          // Attempt to parse JSON Alt Texts
          try {
            const parsed = JSON.parse(cleanResult.replace(/^```json\s*/, '').replace(/```$/, '').trim());
            setGenerations(prev => ({ ...prev, altTexts: parsed }));
          } catch {
            // Parsing failed, fallback to split text lines
            const lines = cleanResult.split('\n').filter(l => l.trim());
            const parsedAlts = analysis.seo.images.missingAlt.slice(0, 5).map((img, index) => {
              const line = lines[index] || '';
              const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').replace(/"/g, '').trim();
              return {
                src: img.src,
                suggestedAlt: cleanLine || 'Descriptive website image'
              };
            });
            setGenerations(prev => ({ ...prev, altTexts: parsedAlts }));
          }
        } else {
          setGenerations(prev => ({ ...prev, [type]: cleanResult }));
        }
      } else {
        // Run Local Fallback after a slight delay
        await new Promise(resolve => setTimeout(resolve, 800));
        const res = fallbackGenerator();
        setGenerations(prev => ({ ...prev, [type]: res }));
      }
    } catch (err) {
      console.error(`Generation error for ${type}:`, err);
      // Run Fallback on error
      const res = fallbackGenerator();
      setGenerations(prev => ({ ...prev, [type]: res }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [type]: false }));
    }
  };

  // --- LOCAL FALLBACK GENERATORS ---

  const getFallbackTitle = () => {
    const brand = analysis.site.hostname.split('.')[0].toUpperCase();
    const cleanWord = analysis.seo.content.keywords[0]?.word || 'Solutions';
    const capWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    return `${brand} — Premium ${capWord} Services & Digital Audit`;
  };

  const getFallbackDescription = () => {
    const host = analysis.site.hostname;
    const kw = analysis.seo.content.keywords.slice(0, 3).map(k => k.word).join(', ');
    return `Discover professional web solutions, reviews and insights on ${host}. Specializing in optimized audits, page speed, technology details, and keywords like: ${kw}.`;
  };

  const getFallbackFAQSchema = () => {
    const list = analysis.seo.headings.filter(h => h.level === 2).slice(0, 2);
    const faqs = list.map(h => ({
      q: h.text,
      a: `Yes, we offer comprehensive details regarding ${h.text.toLowerCase()} directly on our website.`
    }));
    if (faqs.length === 0) {
      faqs.push(
        { q: `What is ${analysis.site.hostname}?`, a: `We provide modern web diagnostics, performance audits, and digital optimizations.` },
        { q: `How can I contact the team?`, a: `You can reach out to us using the contact form details listed on our website.` }
      );
    }
    const schemaObj = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };
    return JSON.stringify(schemaObj, null, 2);
  };

  const getFallbackProductSchema = () => {
    const isWp = analysis.wordpress.detected;
    const cms = isWp ? 'WordPress product' : 'Shopify item';
    const schemaObj = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": analysis.seo.title.value.split('—')[0].trim() || 'Online Store Product',
      "image": [analysis.seo.og['og:image'] || 'https://example.com/product.jpg'],
      "description": analysis.seo.metaDescription.value || `An amazing ${cms} available online.`,
      "brand": {
        "@type": "Brand",
        "name": analysis.site.hostname
      },
      "offers": {
        "@type": "Offer",
        "url": analysis.site.url,
        "priceCurrency": analysis.shopify.currency || 'USD',
        "price": "49.99",
        "availability": "https://schema.org/InStock"
      }
    };
    return JSON.stringify(schemaObj, null, 2);
  };

  const getFallbackAltTexts = () => {
    const kw = analysis.seo.content.keywords[0]?.word || 'product';
    return analysis.seo.images.missingAlt.slice(0, 5).map(img => {
      const name = img.src.split('/').pop()?.split('.')[0]?.replace(/[-_]/g, ' ') || 'visual element';
      return {
        src: img.src,
        suggestedAlt: `${name} illustrating ${kw} on ${analysis.site.hostname}`
      };
    });
  };

  const getFallbackHeadingGuide = () => {
    const hasH1 = analysis.seo.h1Count > 0;
    const list = [];
    if (!hasH1) {
      list.push(`• Insert a single <h1> heading at the top of the main body content representing: "${analysis.seo.title.value.split('—')[0].trim()}".`);
    } else if (analysis.seo.h1Count > 1) {
      list.push(`• Multiple <h1> tags detected (${analysis.seo.h1Count}). Consolidate them: leave the main title as <h1>, and convert secondary <h1> tags into <h2> sections.`);
    }
    
    // Check for hierarchy skips
    let lastL = 0;
    analysis.seo.headings.forEach(h => {
      if (h.level - lastL > 1 && lastL > 0) {
        list.push(`• Restructure: Heading "${h.text}" (${h.tag.toUpperCase()}) skips levels. Change it to <h${lastL + 1}> to follow the preceding <h${lastL}>.`);
      }
      lastL = h.level;
    });

    if (list.length === 0) {
      list.push(`• Heading hierarchy is optimal! Ensure all subtopics continue to nest sequentially: <h1> -> <h2> -> <h3>.`);
    }

    return list.join('\n');
  };

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up bg-white">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
          <Sparkles size={18} className="text-primary-dark" />
          AI Action Center
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Generate and implement instant SEO fixes</p>
      </div>

      {/* Gemini API state notice */}
      {!apiKey && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5 items-start">
          <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Local Rule Fallbacks Active</p>
            <p className="text-2xs text-amber-600 mt-0.5">
              Generating smart template suggestions. Configure your <strong>Gemini API key</strong> in the Settings panel for custom generative AI output.
            </p>
          </div>
        </div>
      )}

      {/* ─── OPTIMIZATION CARDS ─── */}

      {/* 1. Meta Title Card */}
      <SectionCard title="Optimize Meta Title">
        <div className="space-y-3">
          <div className="text-xs space-y-1">
            <span className="text-gray-400 font-semibold uppercase flex items-center gap-1"><Type size={11} /> Current Title</span>
            <p className="text-gray-700 bg-gray-50 p-2 rounded break-all border border-gray-100 font-mono text-2xs">
              {analysis.seo.title.value || <span className="text-red-400 italic">None</span>}
            </p>
          </div>

          {generations.title && (
            <div className="text-xs space-y-1 bg-purple-50/30 border border-purple-100 p-2 rounded animate-fade-in">
              <span className="text-primary-dark font-semibold uppercase">Suggested Title</span>
              <p className="text-gray-800 font-medium break-all">{generations.title}</p>
              <div className="flex items-center justify-between pt-1 border-t border-purple-100/50 mt-1">
                <span className="text-3xs text-gray-400">{generations.title.length} characters (Optimal: 30-60)</span>
                <button
                  onClick={() => copyToClipboard(generations.title!, 'title')}
                  className="text-primary hover:text-primary-dark flex items-center gap-0.5 text-2xs font-semibold"
                >
                  {copiedKey === 'title' ? <Check size={10} /> : <Copy size={10} />}
                  {copiedKey === 'title' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => handleGenerate(
              'title',
              `Generate an optimized SEO meta title for a webpage under 60 characters. URL: ${analysis.site.url}. Current Title: "${analysis.seo.title.value}". Top keywords: ${analysis.seo.content.keywords.slice(0, 3).map(k => k.word).join(', ')}. Return ONLY the title text.`,
              getFallbackTitle
            )}
            disabled={loadingMap.title}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-md transition-colors disabled:opacity-50"
          >
            <Sparkles size={12} className={loadingMap.title ? 'animate-spin' : ''} />
            <span>{loadingMap.title ? 'Optimizing...' : generations.title ? 'Regenerate' : 'Generate Optimized Title'}</span>
          </button>
        </div>
      </SectionCard>

      {/* 2. Meta Description Card */}
      <SectionCard title="Generate Meta Description">
        <div className="space-y-3">
          <div className="text-xs space-y-1">
            <span className="text-gray-400 font-semibold uppercase flex items-center gap-1"><FileText size={11} /> Current Description</span>
            <p className="text-gray-700 bg-gray-50 p-2 rounded break-all border border-gray-100 text-2xs font-mono">
              {analysis.seo.metaDescription.value || <span className="text-red-400 italic">None</span>}
            </p>
          </div>

          {generations.description && (
            <div className="text-xs space-y-1 bg-purple-50/30 border border-purple-100 p-2 rounded animate-fade-in">
              <span className="text-primary-dark font-semibold uppercase">Suggested Description</span>
              <p className="text-gray-800 break-all text-2xs leading-relaxed">{generations.description}</p>
              <div className="flex items-center justify-between pt-1 border-t border-purple-100/50 mt-1">
                <span className="text-3xs text-gray-400">{generations.description.length} characters (Optimal: 120-160)</span>
                <button
                  onClick={() => copyToClipboard(generations.description!, 'desc')}
                  className="text-primary hover:text-primary-dark flex items-center gap-0.5 text-2xs font-semibold"
                >
                  {copiedKey === 'desc' ? <Check size={10} /> : <Copy size={10} />}
                  {copiedKey === 'desc' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => handleGenerate(
              'description',
              `Generate a summary meta description for a webpage. Keep it between 120 and 160 characters. URL: ${analysis.site.url}. Content summary headings: ${analysis.seo.headings.slice(0, 4).map(h => h.text).join(' | ')}. Return ONLY the description paragraph.`,
              getFallbackDescription
            )}
            disabled={loadingMap.description}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-md transition-colors disabled:opacity-50"
          >
            <Sparkles size={12} className={loadingMap.description ? 'animate-spin' : ''} />
            <span>{loadingMap.description ? 'Optimizing...' : generations.description ? 'Regenerate' : 'Generate Meta Description'}</span>
          </button>
        </div>
      </SectionCard>

      {/* 3. FAQ Schema Card */}
      <SectionCard title="Generate FAQ Schema">
        <div className="space-y-3">
          {generations.faqSchema && (
            <div className="text-xs space-y-1 bg-purple-50/30 border border-purple-100 p-2 rounded animate-fade-in">
              <span className="text-primary-dark font-semibold uppercase flex items-center gap-1"><FileJson size={11} /> FAQ Schema (JSON-LD)</span>
              <textarea
                value={generations.faqSchema}
                readOnly
                className="w-full h-32 bg-white border border-border rounded p-1.5 font-mono text-3xs focus:outline-none"
              />
              <div className="flex items-center justify-end mt-1">
                <button
                  onClick={() => copyToClipboard(generations.faqSchema!, 'faq')}
                  className="text-primary hover:text-primary-dark flex items-center gap-0.5 text-2xs font-semibold"
                >
                  {copiedKey === 'faq' ? <Check size={10} /> : <Copy size={10} />}
                  {copiedKey === 'faq' ? 'Copy JSON-LD' : 'Copy JSON-LD'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => handleGenerate(
              'faqSchema',
              `Based on these headings from a webpage, construct a valid JSON-LD FAQ Schema object mapping relevant questions and answers. Headings: ${analysis.seo.headings.slice(0, 6).map(h => h.text).join(' | ')}. Return ONLY a raw JSON string containing the schema.`,
              getFallbackFAQSchema
            )}
            disabled={loadingMap.faqSchema}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-md transition-colors disabled:opacity-50"
          >
            <FileJson size={12} className={loadingMap.faqSchema ? 'animate-spin' : ''} />
            <span>{loadingMap.faqSchema ? 'Structuring FAQ...' : generations.faqSchema ? 'Regenerate Schema' : 'Create FAQ Schema'}</span>
          </button>
        </div>
      </SectionCard>

      {/* 4. Product Schema Card (Conditional on WP / WooCommerce / Shopify) */}
      {(analysis.wordpress.detected || analysis.shopify.detected) && (
        <SectionCard title="Generate Product Schema">
          <div className="space-y-3">
            {generations.productSchema && (
              <div className="text-xs space-y-1 bg-purple-50/30 border border-purple-100 p-2 rounded animate-fade-in">
                <span className="text-primary-dark font-semibold uppercase flex items-center gap-1"><FileJson size={11} /> Product Schema (JSON-LD)</span>
                <textarea
                  value={generations.productSchema}
                  readOnly
                  className="w-full h-32 bg-white border border-border rounded p-1.5 font-mono text-3xs focus:outline-none"
                />
                <div className="flex items-center justify-end mt-1">
                  <button
                    onClick={() => copyToClipboard(generations.productSchema!, 'product')}
                    className="text-primary hover:text-primary-dark flex items-center gap-0.5 text-2xs font-semibold"
                  >
                    {copiedKey === 'product' ? <Check size={10} /> : <Copy size={10} />}
                    {copiedKey === 'product' ? 'Copy JSON-LD' : 'Copy JSON-LD'}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => handleGenerate(
                'productSchema',
                `Create a schema.org Product JSON-LD block for this e-commerce site. URL: ${analysis.site.url}, Hostname: ${analysis.site.hostname}. SEO title: "${analysis.seo.title.value}". Shopify details: ${JSON.stringify(analysis.shopify)}. Return ONLY a raw JSON string of the schema.`,
                getFallbackProductSchema
              )}
              disabled={loadingMap.productSchema}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-md transition-colors disabled:opacity-50"
            >
              <FileJson size={12} className={loadingMap.productSchema ? 'animate-spin' : ''} />
              <span>{loadingMap.productSchema ? 'Structuring Product...' : generations.productSchema ? 'Regenerate Schema' : 'Create Product Schema'}</span>
            </button>
          </div>
        </SectionCard>
      )}

      {/* 5. Alt Text Generator */}
      {analysis.seo.images.withoutAlt > 0 && (
        <SectionCard title="Generate Image Alt Texts" badge={<span className="badge badge-danger">{analysis.seo.images.withoutAlt}</span>}>
          <div className="space-y-3">
            {generations.altTexts && generations.altTexts.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto bg-purple-50/20 p-2 border border-purple-100 rounded text-2xs animate-slide-up">
                {generations.altTexts.map((alt, idx) => (
                  <div key={idx} className="flex flex-col gap-1 border-b border-purple-100/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-gray-400 font-mono truncate flex items-center gap-1"><Tag size={10} /> {alt.src.split('/').pop()}</span>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-gray-800 font-medium italic">"{alt.suggestedAlt}"</p>
                      <button
                        onClick={() => copyToClipboard(alt.suggestedAlt, `alt_${idx}`)}
                        className="text-primary hover:text-primary-dark flex-shrink-0"
                      >
                        {copiedKey === `alt_${idx}` ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => handleGenerate(
                'altTexts',
                `Suggest 3-5 word keyword-optimized image alternate text descriptions based on these file paths: ${analysis.seo.images.missingAlt.slice(0, 5).map(img => img.src).join(', ')}. Return the suggestions as a JSON array where each item is {"src": "originalUrl", "suggestedAlt": "suggestedAltText"}. Return ONLY JSON, no markdown formatting.`,
                getFallbackAltTexts
              )}
              disabled={loadingMap.altTexts}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-md transition-colors disabled:opacity-50"
            >
              <Sparkles size={12} className={loadingMap.altTexts ? 'animate-spin' : ''} />
              <span>{loadingMap.altTexts ? 'Describing images...' : 'Generate Alt Text Suggestions'}</span>
            </button>
          </div>
        </SectionCard>
      )}

      {/* 6. Heading Hierarchy Structure Checklist */}
      <SectionCard title="Heading Structure Actions">
        <div className="space-y-3">
          {generations.headingGuide ? (
            <div className="text-xs space-y-1.5 bg-purple-50/30 border border-purple-100 p-2.5 rounded animate-fade-in">
              <span className="text-primary-dark font-semibold uppercase flex items-center gap-1"><AlertTriangle size={11} /> Hierarchy Checklist</span>
              <pre className="whitespace-pre-wrap font-sans text-gray-700 text-2xs leading-relaxed">
                {generations.headingGuide}
              </pre>
              <div className="flex items-center justify-end mt-1 pt-1 border-t border-purple-100/50">
                <button
                  onClick={() => copyToClipboard(generations.headingGuide!, 'headings')}
                  className="text-primary hover:text-primary-dark flex items-center gap-0.5 text-2xs font-semibold"
                >
                  {copiedKey === 'headings' ? <Check size={10} /> : <Copy size={10} />}
                  {copiedKey === 'headings' ? 'Copied' : 'Copy Guide'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded text-2xs text-gray-500">
              <HelpCircle size={14} className="text-gray-400 flex-shrink-0" />
              <p>Audit of tags H1 - H6 headings nesting patterns for structural hierarchy checks.</p>
            </div>
          )}

          <button
            onClick={() => handleGenerate(
              'headingGuide',
              `Analyze the following webpage headings nesting structure and outline clear bullet-point improvements to ensure compliance with WCAG heading hierarchy standards (no skipped levels). Headings structure list: ${JSON.stringify(analysis.seo.headings.slice(0, 15))}. Return ONLY the improvements list.`,
              getFallbackHeadingGuide
            )}
            disabled={loadingMap.headingGuide}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-md transition-colors disabled:opacity-50"
          >
            <Sparkles size={12} className={loadingMap.headingGuide ? 'animate-spin' : ''} />
            <span>{loadingMap.headingGuide ? 'Analyzing Headings...' : 'Analyze Heading Hierarchy'}</span>
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
