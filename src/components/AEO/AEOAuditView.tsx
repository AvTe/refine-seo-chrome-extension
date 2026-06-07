import { useState } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import { getScoreColor, getAEOAnalysis } from '@/utils/scoring';
import SectionCard from '@/components/shared/SectionCard';
import { 
  Brain, 
  Check, 
  X, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  Tag, 
  Link2, 
  ShieldCheck, 
  TrendingUp,
  Terminal,
  Copy,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function AEOAuditView() {
  const { analysis } = useAnalysis();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!analysis) return null;

  // Compute AEO dynamically based on page data (never fallback to hardcoded fake text)
  const aeo = getAEOAnalysis(analysis);

  const {
    aeoScore,
    answerReadiness,
    entityCoverage,
    schemaReadiness,
    citationReadiness,
    eeatSignals,
    contentStructure,
    answerPreview
  } = aeo;

  const mainColor = getScoreColor(aeoScore);

  const categories = [
    {
      id: 'answer',
      title: 'Answer Readiness (25%)',
      score: answerReadiness.score,
      details: answerReadiness.details,
      icon: <HelpCircle className="text-blue-500" size={18} />,
      desc: 'Direct Q&A headings, lists, tables, and short definitions suitable for conversational prompts.',
      bg: 'bg-blue-50/50'
    },
    {
      id: 'entity',
      title: 'Entity Coverage (20%)',
      score: entityCoverage.score,
      details: entityCoverage.details,
      icon: <BookOpen className="text-purple-500" size={18} />,
      desc: 'Semantic clarity and coverage of brand, org, product, place, software, and person entities.',
      bg: 'bg-purple-50/50'
    },
    {
      id: 'schema',
      title: 'Schema Readiness (20%)',
      score: schemaReadiness.score,
      details: schemaReadiness.details,
      icon: <Tag className="text-orange-500" size={18} />,
      desc: 'Critical structured JSON-LD entities (FAQ, Organization, Product, Article, Breadcrumbs).',
      bg: 'bg-orange-50/50'
    },
    {
      id: 'citation',
      title: 'Citation Readiness (15%)',
      score: citationReadiness.score,
      details: citationReadiness.details,
      icon: <Link2 className="text-emerald-500" size={18} />,
      desc: 'Measurable authority factors: authors, dates, about/contact links, and external references.',
      bg: 'bg-emerald-50/50'
    },
    {
      id: 'eeat',
      title: 'E-E-A-T Signals (10%)',
      score: eeatSignals.score,
      details: eeatSignals.details,
      icon: <ShieldCheck className="text-teal-500" size={18} />,
      desc: 'Trust anchors: address, social tags, privacy/terms policy linkages, and corporate contact details.',
      bg: 'bg-teal-50/50'
    },
    {
      id: 'structure',
      title: 'Content Structure (10%)',
      score: contentStructure.score,
      details: contentStructure.details,
      icon: <FileText className="text-indigo-500" size={18} />,
      desc: 'Correct nesting H1->H6, short paragraph blocks, Table of Contents, and FAQ layout units.',
      bg: 'bg-indigo-50/50'
    }
  ];

  // Dynamically divide Strong vs Weak factors based on the details array checks
  const getCitationFactors = () => {
    const strong: string[] = [];
    const weak: string[] = [];

    // FAQ schema check
    const hasFAQ = schemaReadiness.details.some(d => d.toLowerCase().includes('faqpage'));
    if (hasFAQ) strong.push('FAQ Schema Configured');
    else weak.push('Missing FAQ Schema');

    // Org schema check
    const hasOrg = schemaReadiness.details.some(d => d.toLowerCase().includes('organization'));
    if (hasOrg) strong.push('Organization Schema Found');
    else weak.push('Missing Organization Schema');

    // Author check
    const hasAuthor = citationReadiness.details.some(d => d.toLowerCase().includes('author attribution') || d.toLowerCase().includes('author tag'));
    if (hasAuthor) strong.push('Author Profile Defined');
    else weak.push('Missing Author Attributes');

    // References check
    const hasReferences = citationReadiness.details.some(d => d.toLowerCase().includes('references') && d.toLowerCase().includes('high-authority'));
    if (hasReferences) strong.push('High-Authority Reference Citations');
    else weak.push('Outbound Fact References');

    // Policies check
    const hasPolicies = eeatSignals.details.some(d => d.toLowerCase().includes('privacy policy') && (d.toLowerCase().includes('verified') || d.toLowerCase().includes('link')));
    if (hasPolicies) strong.push('Legal Trust Policies Linked');
    else weak.push('Privacy Policy Links');

    return { strong, weak };
  };

  const { strong, weak } = getCitationFactors();

  const getDetailIcon = (detail: string) => {
    const text = detail.toLowerCase();
    if (
      text.startsWith('no ') || 
      text.startsWith('missing') || 
      text.includes('no ') || 
      text.includes('missing') ||
      text.includes('not found')
    ) {
      if (text.includes('highly recommended') || text.includes('improves') || text.includes('consider') || text.includes('could be')) {
        return { icon: <AlertTriangle size={14} className="text-amber-500 shrink-0" />, bg: 'bg-amber-50/70' };
      }
      return { icon: <X size={14} className="text-red-500 shrink-0" />, bg: 'bg-red-50/70' };
    }
    return { icon: <Check size={14} className="text-green-500 shrink-0" />, bg: 'bg-green-50/70' };
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(answerPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-grow p-4 overflow-y-auto space-y-4 animate-slide-up bg-surface-base">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Brain size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
              AI Visibility / AEO Audit
              <span className="badge badge-info text-[9px] py-0.5 px-1.5 uppercase font-bold tracking-wider">GEO v2</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{analysis.site.hostname}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold tabular-nums" style={{ color: mainColor }}>{aeoScore}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>

      {/* Explainer Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-purple-50/60 to-surface border border-indigo-100 flex gap-3">
        <Sparkles size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-xs font-semibold text-indigo-950">AEO/GEO Engine Alignment</h3>
          <p className="text-[11px] text-indigo-900/80 mt-1 leading-relaxed">
            Generative Engine Optimization (GEO) calculates content readiness for semantic retrieval. RefineAI parses strict, measurable HTML markers to score visibility factors without inventing metrics.
          </p>
        </div>
      </div>

      {/* Gauge and breakdown panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SVG Circle Gauge Card */}
        <div className="card flex flex-col items-center justify-center p-5 text-center">
          <p className="text-[10px] text-gray-400 font-bold tracking-wider mb-3">AI VISIBILITY INDEX</p>
          
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="56"
                className="stroke-gray-100"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={mainColor}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - aeoScore / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-gray-900">{aeoScore}</span>
              <span className="text-[9px] text-gray-400 font-bold tracking-wider">SCORE</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-1 text-[11px] text-gray-500">
            <TrendingUp size={12} className="text-emerald-500" />
            <span>Search Citation potential: </span>
            <span className="font-semibold" style={{ color: mainColor }}>
              {aeoScore >= 85 ? 'Strong Citation Link' : aeoScore >= 70 ? 'Moderate Visibility' : 'Needs Optimization'}
            </span>
          </div>
        </div>

        {/* Citation Probability Factors (Measurable indicators) */}
        <div className="card p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-900 mb-2.5">AI Citation Probability</h3>
            <div className="space-y-2">
              {strong.map((factor, i) => (
                <div key={`s-${i}`} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span className="text-gray-700 font-medium">{factor}</span>
                </div>
              ))}
              {weak.map((factor, i) => (
                <div key={`w-${i}`} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <X size={10} strokeWidth={3} />
                  </div>
                  <span className="text-gray-400">{factor}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-100 mt-2">
            Citation status computed based on DOM audits
          </div>
        </div>
      </div>

      {/* Entity Extractor */}
      <SectionCard title="GEO Entity Extractor" defaultOpen={true}>
        <div className="space-y-3">
          <p className="text-[11px] text-gray-400">
            AI search models associate documents with core vocabulary concepts. We extracted these primary entities from your content:
          </p>
          {entityCoverage.detectedEntities && entityCoverage.detectedEntities.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {entityCoverage.detectedEntities.map((ent, i) => (
                <span 
                  key={i} 
                  className="px-2 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md shadow-3xs"
                >
                  {ent}
                </span>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center border border-dashed rounded-lg bg-surface text-gray-400 text-xs">
              No prominent concepts detected. Inject named entities (companies, places, specifications) to build entity authority.
            </div>
          )}
        </div>
      </SectionCard>

      {/* AI Answer Preview Box */}
      <SectionCard title="Conversational Answer Preview" defaultOpen={true}>
        <div className="space-y-3">
          <div className="p-3 bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-xl relative overflow-hidden shadow-xs border border-indigo-900/50">
            {/* Header / Bot identity */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
              <div className="flex items-center gap-2">
                <Terminal size={12} className="text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider text-indigo-300 uppercase">ChatGPT / Gemini Response Mockup</span>
              </div>
              <button 
                onClick={copyToClipboard}
                className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Copy mockup answer text"
              >
                {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
            
            <p className="text-xs text-slate-100 leading-relaxed font-sans select-all select-text">
              {answerPreview || 'Analyzing page syntax...'}
            </p>
          </div>
          <p className="text-[10px] text-gray-400 leading-normal">
            This represents how conversational engine models summarize page descriptions based on H1 hierarchy structure and direct introductory definitions.
          </p>
        </div>
      </SectionCard>

      {/* Breakdown scorecard panels */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-0.5">Scoring Breakdown Details</h2>
        
        {categories.map((cat) => {
          const catColor = getScoreColor(cat.score);
          const isExpanded = activeCategory === cat.id;

          return (
            <div 
              key={cat.id} 
              className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                isExpanded ? 'border-gray-300 bg-white shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {/* Header tab button */}
              <button
                onClick={() => setActiveCategory(isExpanded ? null : cat.id)}
                className="w-full flex items-center justify-between p-3.5 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8.5 h-8.5 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">{cat.title}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-normal max-w-[240px] md:max-w-md line-clamp-1">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold tabular-nums" style={{ color: catColor }}>
                      {cat.score}
                    </span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Score</span>
                  </div>
                  <div className="w-1.5 h-7.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                    <div 
                      className="w-full rounded-full transition-all duration-500" 
                      style={{ height: `${cat.score}%`, backgroundColor: catColor }} 
                    />
                  </div>
                </div>
              </button>

              {/* Expansion check lists */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-slate-50/50 space-y-2 animate-slide-down">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Scanned DOM checkpoints:</p>
                  {cat.details.map((detail, index) => {
                    const status = getDetailIcon(detail);
                    return (
                      <div key={index} className="flex gap-2.5 items-start p-2 rounded-lg bg-white border border-gray-100 text-xs">
                        <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center ${status.bg} mt-0.5 shrink-0`}>
                          {status.icon}
                        </div>
                        <span className="text-gray-700 leading-relaxed text-[11px]">{detail}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
