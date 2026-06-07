import { useState } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FileText, Download, Check } from 'lucide-react';
import {
  calculateOverallScore,
  calculateSEOScore,
  calculateSecurityScore,
  calculatePerformanceScore,
  calculateAccessibilityScore,
  formatBytes,
} from '@/utils/scoring';

export default function ReportsView() {
  const { analysis } = useAnalysis();
  const [clientName, setClientName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [sections, setSections] = useState({
    seo: true,
    performance: true,
    security: true,
    techstack: true,
    aiinsights: true,
  });

  if (!analysis) return null;

  const handleSectionToggle = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = () => {
    setIsGenerating(true);
    setSuccessMessage(null);

    // Give react time to render loading state
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const primaryColor = [193, 144, 255]; // #c190ff

        const seoScore = calculateSEOScore(analysis);
        const securityScore = calculateSecurityScore(analysis);
        const performanceScore = calculatePerformanceScore(analysis);
        const accessibilityScore = calculateAccessibilityScore(analysis);
        const overallScore = calculateOverallScore(analysis);

        // ─── COVER PAGE ───
        // Title Bar Decorator
        doc.setFillColor(193, 144, 255);
        doc.rect(0, 0, 210, 35, 'F');

        // Brand
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('RefineAI Inspector', 20, 22);

        // Title
        doc.setTextColor(23, 23, 23);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('Website Intelligence Audit', 20, 65);

        // Subtitle / Hostname
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(115, 115, 115);
        doc.text(`Target Site: ${analysis.site.url}`, 20, 78);
        doc.text(`Scan Date: ${new Date().toLocaleString()}`, 20, 85);

        if (clientName) {
          doc.text(`Prepared for: ${clientName}`, 20, 95);
        }
        if (agencyName) {
          doc.text(`Prepared by: ${agencyName}`, 20, 102);
        }

        // Horizontal Line
        doc.setDrawColor(229, 229, 229);
        doc.line(20, 112, 190, 112);

        // Score Table
        doc.setFontSize(16);
        doc.setTextColor(23, 23, 23);
        doc.setFont('helvetica', 'bold');
        doc.text('Executive Health Scorecard', 20, 125);

        const scoreBody = [
          ['Overall Website Score', `${overallScore} / 100`, 'Weighted average of audit findings'],
          ['SEO Score', `${seoScore} / 100`, 'Titles, tags, headings, content & schemas'],
          ['Security Score', `${securityScore} / 100`, 'HTTPS encryption, security headers & script safety'],
          ['Performance Score', `${performanceScore} / 100`, 'Page weights, sizes, TTFB and speed metrics'],
          ['Accessibility Score', `${accessibilityScore} / 100`, 'WCAG 2.1 contrast, alt descriptions & tag orders'],
        ];

        (doc as any).autoTable({
          head: [['Audit Area', 'Score', 'Analysis']],
          body: scoreBody,
          startY: 132,
          theme: 'striped',
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
          styles: { fontSize: 10, cellPadding: 4 },
        });

        // Footer note
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(163, 163, 163);
        doc.text('Report generated programmatically in-browser via RefineAI sidepanel workspace.', 20, 280);

        // ─── DETAILED SECTIONS ───
        
        // SEO Section
        if (sections.seo) {
          doc.addPage();
          // Header Bar
          doc.setFillColor(193, 144, 255);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('SEO Inspector Details', 20, 10);

          doc.setTextColor(23, 23, 23);
          doc.setFontSize(14);
          doc.text('Search Engine Optimization Review', 20, 30);

          const seoData = [
            ['Title Tag', analysis.seo.title.value || 'None', `${analysis.seo.title.length} chars`],
            ['Meta Description', analysis.seo.metaDescription.value || 'None', `${analysis.seo.metaDescription.length} chars`],
            ['Canonical Link', analysis.seo.canonical || 'None', analysis.seo.canonical ? 'Valid' : 'Missing'],
            ['Word Count', `${analysis.seo.content.wordCount} words`, `Est. ${analysis.seo.content.readingTime} min reading`],
            ['Images Audit', `${analysis.seo.images.total} images`, `${analysis.seo.images.withoutAlt} missing alt texts`],
          ];

          (doc as any).autoTable({
            head: [['Parameter', 'Value', 'Assessment']],
            body: seoData,
            startY: 37,
            theme: 'grid',
            headStyles: { fillColor: [140, 100, 200] },
          });
        }

        // Performance Section
        if (sections.performance) {
          doc.addPage();
          doc.setFillColor(193, 144, 255);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('Performance Analyzer Details', 20, 10);

          doc.setTextColor(23, 23, 23);
          doc.setFontSize(14);
          doc.text('Page Speed & Weight Review', 20, 30);

          const perfData = [
            ['Page Loading Complete', `${(analysis.performance.timings.loadComplete || 0).toFixed(0)} ms`, 'Total load window'],
            ['First Contentful Paint (FCP)', `${analysis.performance.timings.fcp || '—'} ms`, 'Time to visual rendering'],
            ['Time To First Byte (TTFB)', `${analysis.performance.timings.ttfb || '—'} ms`, 'Server response speed'],
            ['Total Page Size', formatBytes(analysis.performance.totalSize), 'Encoded byte weight'],
            ['Total Network Requests', `${analysis.performance.totalRequests} files`, 'Resource fetches'],
            ['DOM Tree Size', `${analysis.performance.domSize} elements`, 'HTML hierarchy node count'],
          ];

          (doc as any).autoTable({
            head: [['Metric', 'Value', 'Description']],
            body: perfData,
            startY: 37,
            theme: 'grid',
            headStyles: { fillColor: [140, 100, 200] },
          });
        }

        // Security Section
        if (sections.security) {
          doc.addPage();
          doc.setFillColor(193, 144, 255);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('Security Auditing Details', 20, 10);

          doc.setTextColor(23, 23, 23);
          doc.setFontSize(14);
          doc.text('HTTP Encryption & Security Headers', 20, 30);

          const h = analysis.security.headers || {};
          const secData = [
            ['HTTPS Secured Connection', analysis.security.isHTTPS ? 'YES' : 'NO', analysis.security.isHTTPS ? 'Secure' : 'Vulnerable'],
            ['Strict-Transport-Security (HSTS)', h['strict-transport-security'] ? 'CONFIGURED' : 'MISSING', h['strict-transport-security'] || 'Not set'],
            ['Content-Security-Policy (CSP)', h['content-security-policy'] ? 'CONFIGURED' : 'MISSING', h['content-security-policy'] ? 'Set' : 'Not set'],
            ['X-Frame-Options (Clickjacking)', h['x-frame-options'] ? 'CONFIGURED' : 'MISSING', h['x-frame-options'] || 'Not set'],
            ['Password Transmission Security', analysis.security.passwordOverHTTP ? 'VULNERABLE' : 'SAFE', analysis.security.passwordOverHTTP ? 'HTTP Passwords' : 'Secure Protocol'],
            ['Active Cookies', `${analysis.security.cookies.count} cookies`, 'JS accessible context'],
          ];

          (doc as any).autoTable({
            head: [['Security Parameter', 'Status', 'Configuration']],
            body: secData,
            startY: 37,
            theme: 'grid',
            headStyles: { fillColor: [140, 100, 200] },
          });
        }

        // Tech Stack
        if (sections.techstack) {
          doc.addPage();
          doc.setFillColor(193, 144, 255);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('Web Technology stack details', 20, 10);

          doc.setTextColor(23, 23, 23);
          doc.setFontSize(14);
          doc.text('Detected Frameworks, CMS & Infrastructure', 20, 30);

          const techList: string[][] = [];
          Object.entries(analysis.technology).forEach(([category, items]) => {
            if (category !== 'other' && Array.isArray(items) && items.length > 0) {
              const names = items.map((t: any) => `${t.name}${t.version ? ` (v${t.version})` : ''}`).join(', ');
              techList.push([category.toUpperCase(), names]);
            }
          });

          (doc as any).autoTable({
            head: [['Category', 'Technologies Detected']],
            body: techList,
            startY: 37,
            theme: 'grid',
            headStyles: { fillColor: [140, 100, 200] },
          });
        }

        // AI Recommendations
        if (sections.aiinsights) {
          doc.addPage();
          doc.setFillColor(193, 144, 255);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('Action Plan & Recommendations', 20, 10);

          doc.setTextColor(23, 23, 23);
          doc.setFontSize(14);
          doc.text('RefineAI Priority Checklist', 20, 30);

          const actionList = [];
          if (seoScore < 90) actionList.push(['1', 'SEO Checklist', 'Fix missing alt texts and verify description lengths to optimize meta crawls.']);
          if (performanceScore < 90) actionList.push(['2', 'Page Optimization', 'Compress static images, activate lazy loading, and compress bulky stylesheets.']);
          if (securityScore < 90) actionList.push(['3', 'Security Hardening', 'Deploy HSTS and CSP headers on your host server configs to prevent exploits.']);
          if (accessibilityScore < 90) actionList.push(['4', 'Accessibility Fixes', 'Check button name tags and associate labels with correct forms.']);

          if (actionList.length === 0) {
            actionList.push(['✓', 'Excellent Health', 'All categories scored high. Standard site checks complete. Maintain caching rules.']);
          }

          (doc as any).autoTable({
            head: [['Item', 'Action Area', 'Suggested Resolution details']],
            body: actionList,
            startY: 37,
            theme: 'striped',
            headStyles: { fillColor: [140, 100, 200] },
          });
        }

        // Save PDF
        const pdfName = `refineai-report-${analysis.site.hostname}.pdf`;
        doc.save(pdfName);

        setSuccessMessage(`PDF Report successfully exported to your downloads folder as "${pdfName}"!`);
      } catch (err: any) {
        console.error('PDF generation error:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 500);
  };

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up bg-white">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
          <FileText size={18} className="text-primary-dark" />
          PDF Report Exporter
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">{analysis.site.hostname}</p>
      </div>

      {/* Success Notice */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs flex gap-2">
          <Check size={14} className="flex-shrink-0 mt-0.5" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Settings Form */}
      <SectionCard title="Report Details">
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="client-input" className="text-2xs font-semibold text-gray-500 uppercase">Client / Project Name</label>
            <input
              id="client-input"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Corp Marketing Team"
              className="text-xs px-3 py-1.5 border border-border rounded-md focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="agency-input" className="text-2xs font-semibold text-gray-500 uppercase">Consultant / Agency Name</label>
            <input
              id="agency-input"
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g. RefineAI Digital Agency"
              className="text-xs px-3 py-1.5 border border-border rounded-md focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </SectionCard>

      {/* Selection Checklist */}
      <SectionCard title="Include in Report">
        <div className="space-y-2 text-xs">
          {Object.entries(sections).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={value}
                onChange={() => handleSectionToggle(key as keyof typeof sections)}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <span className="capitalize text-gray-700">
                {key === 'aiinsights' ? 'AI Insights checklist' : key === 'techstack' ? 'Technology Stack list' : `${key.toUpperCase()} audit`}
              </span>
            </label>
          ))}
        </div>
      </SectionCard>

      {/* Action Button */}
      <button
        onClick={handleExport}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs disabled:opacity-50"
      >
        <Download size={14} className={isGenerating ? 'animate-bounce' : ''} />
        <span>{isGenerating ? 'Generating PDF...' : 'Download PDF Report'}</span>
      </button>
    </div>
  );
}
