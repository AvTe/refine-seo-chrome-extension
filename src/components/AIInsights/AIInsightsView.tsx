import { useState, useRef, useEffect } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import { Sparkles, Send, Bot, User, AlertCircle } from 'lucide-react';
import {
  calculateSEOScore,
  calculateSecurityScore,
  calculatePerformanceScore,
  calculateAccessibilityScore,
} from '@/utils/scoring';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export default function AIInsightsView() {
  const { analysis, apiKey } = useAnalysis();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hello! I am your Refine SEO Auditor. I have completed a scan of this website. Ask me anything about its SEO, performance, security, or accessibility metrics, or ask for suggestions to improve the overall score!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!analysis) return null;

  const seo = calculateSEOScore(analysis);
  const security = calculateSecurityScore(analysis);
  const performance = calculatePerformanceScore(analysis);
  const accessibility = calculateAccessibilityScore(analysis);

  // Generate automated suggestions based on rules
  const getSuggestions = () => {
    const list: { type: 'seo' | 'perf' | 'sec' | 'a11y'; title: string; desc: string; severity: 'high' | 'medium' | 'low' }[] = [];

    // SEO
    if (!analysis.seo.title.value) {
      list.push({ type: 'seo', title: 'Missing Title Tag', desc: 'Add an optimized <title> tag between 30-60 characters.', severity: 'high' });
    } else if (analysis.seo.title.length > 60) {
      list.push({ type: 'seo', title: 'Title Too Long', desc: `Title has ${analysis.seo.title.length} characters. Shorten it to under 60 characters.`, severity: 'low' });
    }
    if (!analysis.seo.metaDescription.value) {
      list.push({ type: 'seo', title: 'Missing Meta Description', desc: 'Provide a summary of the page content between 120-160 characters.', severity: 'high' });
    }
    if (analysis.seo.images.withoutAlt > 0) {
      list.push({ type: 'seo', title: 'Images Missing Alt Text', desc: `${analysis.seo.images.withoutAlt} image(s) do not have alternate descriptions.`, severity: 'medium' });
    }

    // Security
    if (!analysis.security.isHTTPS) {
      list.push({ type: 'sec', title: 'Insecure Protocol (HTTP)', desc: 'Configure SSL certificates to redirect all traffic to HTTPS.', severity: 'high' });
    }
    if (analysis.security.headers) {
      if (!analysis.security.headers['strict-transport-security']) {
        list.push({ type: 'sec', title: 'Missing HSTS Header', desc: 'Enable HSTS to prevent cookie hijacking and protocol downgrades.', severity: 'medium' });
      }
      if (!analysis.security.headers['content-security-policy']) {
        list.push({ type: 'sec', title: 'Missing CSP Policy', desc: 'Deploy Content Security Policy headers to mitigate XSS risks.', severity: 'medium' });
      }
    }

    // Performance
    if (analysis.performance.timings.ttfb && analysis.performance.timings.ttfb > 500) {
      list.push({ type: 'perf', title: 'Slow Server Response (TTFB)', desc: `TTFB is ${analysis.performance.timings.ttfb}ms. Cache database queries or use a CDN.`, severity: 'high' });
    }
    if (analysis.performance.totalSize > 2500000) {
      list.push({ type: 'perf', title: 'Heavy Page Size', desc: `Total size is ${(analysis.performance.totalSize / (1024 * 1024)).toFixed(1)}MB. Compress images and delay non-critical scripts.`, severity: 'medium' });
    }

    // Accessibility
    if (analysis.accessibility.errorCount > 0) {
      list.push({ type: 'a11y', title: 'WCAG Compliance Failures', desc: `${analysis.accessibility.errorCount} accessibility error(s) found. Check form labels and button names.`, severity: 'high' });
    }

    return list.slice(0, 4); // return top 4
  };

  const suggestions = getSuggestions();

  // Local Chat Response Fallback
  const getLocalResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('seo') || q.includes('title') || q.includes('description') || q.includes('keyword')) {
      return `SEO audit review for ${analysis.site.hostname}:
- **SEO Score**: ${seo}/100.
- **Title**: "${analysis.seo.title.value || 'Missing'}" (${analysis.seo.title.length} chars).
- **Meta Description**: "${analysis.seo.metaDescription.value || 'Missing'}" (${analysis.seo.metaDescription.length} chars).
- **Images**: ${analysis.seo.images.total} total, ${analysis.seo.images.withoutAlt} missing alt text.
*Tip: Ensure your target keyword is in the H1 tag and first paragraph.*`;
    }
    if (q.includes('speed') || q.includes('performance') || q.includes('slow') || q.includes('size') || q.includes('load')) {
      return `Performance metrics for ${analysis.site.hostname}:
- **Performance Score**: ${performance}/100.
- **Load Time**: ${(analysis.performance.timings.loadComplete ? analysis.performance.timings.loadComplete / 1000 : 0).toFixed(1)}s.
- **TTFB**: ${analysis.performance.timings.ttfb || '—'}ms (Time To First Byte).
- **Page Size**: ${(analysis.performance.totalSize / (1024 * 1024)).toFixed(2)} MB.
- **Total Requests**: ${analysis.performance.totalRequests} files.
*Tip: Image elements are the largest byte contributors. Optimize them to WEBP format.*`;
    }
    if (q.includes('security') || q.includes('https') || q.includes('ssl') || q.includes('header')) {
      return `Security credentials for ${analysis.site.hostname}:
- **Security Score**: ${security}/100.
- **SSL Status**: ${analysis.security.isHTTPS ? 'HTTPS Enabled' : 'Insecure HTTP'}.
- **Secure Headers**: HSTS: ${analysis.security.headers?.['strict-transport-security'] ? 'Yes' : 'No'}, CSP: ${analysis.security.headers?.['content-security-policy'] ? 'Yes' : 'No'}.
- **Cookies**: ${analysis.security.cookies.count} detected.
*Tip: Add the X-Content-Type-Options: nosniff header to prevent MIME sniffing.*`;
    }
    if (q.includes('accessibility') || q.includes('wcag') || q.includes('alt') || q.includes('a11y')) {
      return `Accessibility audit summary:
- **Accessibility Score**: ${accessibility}/100.
- **Errors**: ${analysis.accessibility.errorCount} found.
- **Warnings**: ${analysis.accessibility.warningCount} found.
*Recommendation: Provide descriptive alt tags to all images and ensure form controls have corresponding label associations.*`;
    }
    if (q.includes('wordpress') || q.includes('plugins') || q.includes('shopify') || q.includes('cms')) {
      if (analysis.shopify.detected) {
        return `Shopify integration details:
- Theme: "${analysis.shopify.theme?.name || 'Unknown'}".
- Active Apps: ${analysis.shopify.apps?.map(a => a.name).join(', ') || 'None'}.`;
      }
      if (analysis.wordpress.detected) {
        return `WordPress website details:
- Version: ${analysis.wordpress.wpVersion || 'Unknown'}.
- Theme: "${analysis.wordpress.theme?.active || 'Unknown'}".
- Plugins: ${analysis.wordpress.pluginCount || 0} active plugins detected.`;
      }
      return `CMS Detection: No CMS platforms (WordPress/Shopify) were detected on this site. Web stack details: ${analysis.technology.cms.map(c => c.name).join(', ') || 'Custom framework'}.`;
    }

    return `Website Intelligence Summary for **${analysis.site.hostname}**:
- Overall Health Score: **${Math.round(seo * 0.3 + security * 0.25 + performance * 0.25 + accessibility * 0.2)}/100**
- SEO: ${seo} | Security: ${security} | Performance: ${performance} | Accessibility: ${accessibility}
What specific segment would you like me to explain in detail? (e.g., "Tell me about security" or "How is page speed?")`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');

    setMessages((prev) => [...prev, { sender: 'user', text: userText, timestamp: new Date() }]);
    setIsTyping(true);

    if (apiKey) {
      // Live Gemini API Call
      try {
        const prompt = `You are Refine SEO Auditor, a premium website intelligence assistant.
Analyze the following website data and answer the user's question. Be concise, professional, and provide clear actionable bullet points.

Hostname: ${analysis.site.hostname}
SEO Score: ${seo}/100
Security Score: ${security}/100
Performance Score: ${performance}/100
Accessibility Score: ${accessibility}/100
Page Size: ${(analysis.performance.totalSize / 1024).toFixed(0)} KB
Total Requests: ${analysis.performance.totalRequests}
CMS: ${analysis.wordpress.detected ? 'WordPress' : analysis.shopify.detected ? 'Shopify' : 'Other'}
SEO Title: "${analysis.seo.title.value}"
SEO Meta Description: "${analysis.seo.metaDescription.value}"
Accessibility Errors: ${analysis.accessibility.errorCount}

User's Question: "${userText}"`;

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
        const data = await res.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't reach the AI server. Falling back to local rules engine.";
        setMessages((prev) => [...prev, { sender: 'ai', text: responseText, timestamp: new Date() }]);
      } catch (err) {
        console.error('Gemini error:', err);
        const fallback = getLocalResponse(userText);
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: `(Local Fallback) ${fallback}`, timestamp: new Date() },
        ]);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Local Fallback response
      setTimeout(() => {
        const reply = getLocalResponse(userText);
        setMessages((prev) => [...prev, { sender: 'ai', text: reply, timestamp: new Date() }]);
        setIsTyping(false);
      }, 700);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-slide-up bg-bg text-text">
      {/* Scrollable Audit Section */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Sparkles size={18} className="text-primary-dark dark:text-primary-light" />
            AI Insights & Chat
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-550 mt-0.5">{analysis.site.hostname}</p>
        </div>

        {/* Gemini Notice */}
        {!apiKey && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg flex gap-2.5 items-start">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Local Rules Engine Active</p>
              <p className="text-2xs text-amber-600 dark:text-amber-400 mt-0.5">
                Using built-in rules for analysis. To activate live generative answers, enter your Gemini API Key in the <strong>Settings</strong> tab.
              </p>
            </div>
          </div>
        )}

        {/* Rule recommendations */}
        {suggestions.length > 0 && (
          <SectionCard title="Auditor Quick Recommendations">
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span
                    className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      s.severity === 'high'
                        ? 'bg-red-500'
                        : s.severity === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{s.title}</span>
                    <p className="text-2xs text-gray-500 dark:text-zinc-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Chat Log */}
        <div className="border border-border dark:border-zinc-800 rounded-lg bg-surface flex flex-col h-[280px] overflow-hidden">
          <div className="p-2 border-b border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-1.5">
            <Bot size={14} className="text-primary-dark dark:text-primary-light" />
            <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">Refine SEO Chatbot</span>
          </div>
          <div className="flex-grow p-3 overflow-y-auto space-y-3 text-xs bg-gray-50/50 dark:bg-zinc-950/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex items-start gap-2 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.sender === 'user' ? 'bg-primary/20 dark:bg-primary/30 text-primary-dark dark:text-primary-light' : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  {m.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div
                  className={`p-2.5 rounded-lg whitespace-pre-wrap ${
                    m.sender === 'user' ? 'bg-primary text-white font-medium rounded-tr-none' : 'bg-white dark:bg-zinc-900 border border-border dark:border-zinc-800 text-gray-800 dark:text-zinc-200 rounded-tl-none shadow-2xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot size={12} />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-border dark:border-zinc-800 p-2.5 rounded-lg rounded-tl-none text-gray-400 dark:text-zinc-500 italic animate-pulse">
                  Refine SEO is analyzing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-2 border-t border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about SEO, performance..."
              className="flex-grow text-xs px-3 py-1.5 border border-border dark:border-zinc-700 rounded-md focus:outline-none focus:border-primary bg-card text-text dark:placeholder-zinc-500"
            />
            <button
              onClick={handleSend}
              className="p-1.5 bg-primary dark:bg-primary-dark text-white rounded-md hover:bg-primary-dark dark:hover:bg-primary transition-colors flex-shrink-0"
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
