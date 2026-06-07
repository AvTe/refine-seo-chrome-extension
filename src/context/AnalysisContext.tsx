import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { PageAnalysis, NavSection, CompetitorAnalysis, AuditHistoryItem } from '@/types/analysis';
import {
  calculateSEOScore,
  calculateSecurityScore,
  calculatePerformanceScore,
  calculateAccessibilityScore,
  calculateOverallScore,
} from '@/utils/scoring';

interface AnalysisContextType {
  analysis: PageAnalysis | null;
  isLoading: boolean;
  error: string | null;
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  requestAnalysis: () => void;
  lastScanTime: string | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  competitor: CompetitorAnalysis | null;
  isCompetitorLoading: boolean;
  competitorError: string | null;
  analyzeCompetitor: (url: string) => Promise<void>;
  screenshotHistory: string[];
  captureScreenshot: () => Promise<void>;
  apiKey: string;
  setApiKey: (key: string) => void;
  auditHistory: AuditHistoryItem[];
  clearHistory: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

// Check if running in Chrome extension context
const isChromeExtension = typeof chrome !== 'undefined' && chrome.runtime?.id;

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysis] = useState<PageAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [competitor, setCompetitor] = useState<CompetitorAnalysis | null>(null);
  const [isCompetitorLoading, setIsCompetitorLoading] = useState(false);
  const [competitorError, setCompetitorError] = useState<string | null>(null);
  const [screenshotHistory, setScreenshotHistory] = useState<string[]>([]);
  const [apiKey, setApiKeyState] = useState<string>(() => localStorage.getItem('refineai_api_key') || '');
  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);

  // Function to add a scan to history
  const addToHistory = useCallback((data: PageAnalysis) => {
    const seo = calculateSEOScore(data);
    const security = calculateSecurityScore(data);
    const performance = calculatePerformanceScore(data);
    const accessibility = calculateAccessibilityScore(data);
    const overall = calculateOverallScore(data);

    const newItem: AuditHistoryItem = {
      timestamp: Date.now(),
      url: data.site.url,
      hostname: data.site.hostname,
      scores: {
        overall,
        seo,
        performance,
        security,
        accessibility
      }
    };

    setAuditHistory(prev => {
      const lastItem = prev[0];
      const isRecentDuplicate = lastItem && 
        lastItem.hostname === newItem.hostname && 
        (newItem.timestamp - lastItem.timestamp < 3000); // 3 seconds threshold

      if (isRecentDuplicate) {
        return prev;
      }

      const next = [newItem, ...prev].slice(0, 30);
      if (isChromeExtension) {
        chrome.storage.local.set({ auditHistory: next });
      } else {
        localStorage.setItem('refineai_audit_history', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setAuditHistory([]);
    if (isChromeExtension) {
      chrome.storage.local.set({ auditHistory: [] });
    } else {
      localStorage.removeItem('refineai_audit_history');
    }
  }, []);

  // Save to history when analysis changes
  useEffect(() => {
    if (analysis && !isLoading) {
      addToHistory(analysis);
    }
  }, [analysis, isLoading, addToHistory]);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('refineai_api_key', key);
  };

  const analyzeCompetitor = useCallback(async (url: string) => {
    setIsCompetitorLoading(true);
    setCompetitorError(null);

    if (!isChromeExtension) {
      setTimeout(() => {
        const hostname = url.replace(/https?:\/\//i, '').split('/')[0];
        const h = hostname.length;
        const mock: CompetitorAnalysis = {
          url: url.startsWith('http') ? url : `https://${url}`,
          hostname,
          seoScore: 72 + (h % 15),
          securityScore: 65 + (h % 25),
          performanceScore: 50 + (h % 35),
          accessibilityScore: 60 + (h % 30),
          overallScore: 0,
          pageSize: 55000 + h * 1200,
          requestsCount: 30 + (h % 25),
          cms: h % 2 === 0 ? 'WordPress' : h % 3 === 0 ? 'Shopify' : 'Custom / Other',
          technologiesCount: 3 + (h % 5),
        };
        mock.overallScore = Math.round(
          mock.seoScore * 0.3 +
            mock.securityScore * 0.25 +
            mock.performanceScore * 0.25 +
            mock.accessibilityScore * 0.2
        );
        setCompetitor(mock);
        setIsCompetitorLoading(false);
      }, 1200);
      return;
    }

    chrome.runtime.sendMessage({ type: 'ANALYZE_COMPETITOR', url }, (response: any) => {
      if (chrome.runtime.lastError) {
        setCompetitorError(chrome.runtime.lastError.message || 'Competitor scan failed');
        setIsCompetitorLoading(false);
        return;
      }
      if (response?.success && response.data) {
        setCompetitor(response.data);
      } else {
        setCompetitorError(response?.error || 'Failed to scan competitor');
      }
      setIsCompetitorLoading(false);
    });
  }, []);

  const captureScreenshot = useCallback(async () => {
    if (!isChromeExtension) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#c190ff';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillText('RefineAI Captures', 30, 60);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(`Mock Capture: ${new Date().toLocaleTimeString()}`, 30, 95);
        ctx.fillText('Tested in Development Mode', 30, 120);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0, 0, 400, 30);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(15, 15, 5, 0, Math.PI * 2);
        ctx.arc(30, 15, 5, 0, Math.PI * 2);
        ctx.arc(45, 15, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      const dataUrl = canvas.toDataURL('image/png');
      setScreenshotHistory((prev) => {
        const next = [dataUrl, ...prev];
        localStorage.setItem('refineai_screenshot_history', JSON.stringify(next));
        return next.slice(0, 10);
      });
      return;
    }

    chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, (response: any) => {
      if (response?.success && response.dataUrl) {
        setScreenshotHistory((prev) => {
          const next = [response.dataUrl, ...prev];
          chrome.storage.local.set({ screenshotHistory: next });
          return next.slice(0, 10);
        });
      }
    });
  }, []);

  // Load screenshot and audit history on init
  useEffect(() => {
    if (isChromeExtension) {
      chrome.storage.local.get(['screenshotHistory', 'auditHistory'], (result) => {
        if (result.screenshotHistory) {
          setScreenshotHistory(result.screenshotHistory as string[]);
        }
        if (result.auditHistory) {
          setAuditHistory(result.auditHistory as AuditHistoryItem[]);
        }
      });
    } else {
      const cachedScreenshots = localStorage.getItem('refineai_screenshot_history');
      if (cachedScreenshots) {
        try {
          setScreenshotHistory(JSON.parse(cachedScreenshots));
        } catch { /* ignore */ }
      }
      const cachedHistory = localStorage.getItem('refineai_audit_history');
      if (cachedHistory) {
        try {
          setAuditHistory(JSON.parse(cachedHistory));
        } catch { /* ignore */ }
      }
    }
  }, []);

  const requestAnalysis = useCallback(() => {
    if (!isChromeExtension) {
      // Dev mode — use mock data
      setIsLoading(true);
      setTimeout(() => {
        setAnalysis(getMockAnalysis());
        setLastScanTime(new Date().toLocaleTimeString());
        setIsLoading(false);
      }, 800);
      return;
    }

    setIsLoading(true);
    setError(null);

    chrome.runtime.sendMessage({ type: 'REQUEST_ANALYSIS' }, (response: any) => {
      if (chrome.runtime.lastError) {
        setError(chrome.runtime.lastError.message || 'Analysis failed');
        setIsLoading(false);
        return;
      }

      if (response?.success && response.data) {
        setAnalysis(response.data);
        setLastScanTime(new Date().toLocaleTimeString());
      } else {
        setError(response?.error || 'No data received');
      }
      setIsLoading(false);
    });
  }, []);

  // Listen for analysis updates from background
  useEffect(() => {
    if (!isChromeExtension) {
      // Dev mode — load mock immediately
      requestAnalysis();
      return;
    }

    const listener = (message: { type: string; data: PageAnalysis }) => {
      if (message.type === 'ANALYSIS_UPDATE' && message.data) {
        setAnalysis(message.data);
        setLastScanTime(new Date().toLocaleTimeString());
        setIsLoading(false);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    // Try to get cached analysis first
    chrome.runtime.sendMessage({ type: 'GET_CACHED_ANALYSIS' }, (response: any) => {
      if (response?.data) {
        setAnalysis(response.data);
        setLastScanTime(new Date(response.data.timestamp).toLocaleTimeString());
        setIsLoading(false);
      } else {
        requestAnalysis();
      }
    });

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [requestAnalysis]);

  return (
    <AnalysisContext.Provider
      value={{
        analysis,
        isLoading,
        error,
        activeSection,
        setActiveSection,
        requestAnalysis,
        lastScanTime,
        isSidebarOpen,
        setIsSidebarOpen,
        competitor,
        isCompetitorLoading,
        competitorError,
        analyzeCompetitor,
        screenshotHistory,
        captureScreenshot,
        apiKey,
        setApiKey,
        auditHistory,
        clearHistory,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}

// ─── Mock Data for Development ───

function getMockAnalysis(): PageAnalysis {
  const isShopify = typeof window !== 'undefined' && (window.location.search.includes('shopify') || window.location.hash.includes('shopify'));

  return {
    site: {
      url: isShopify ? 'https://mystore.myshopify.com/products/cool-shirt' : 'https://example.com/page',
      hostname: isShopify ? 'mystore.myshopify.com' : 'example.com',
      protocol: 'https:',
      pathname: isShopify ? '/products/cool-shirt' : '/page',
    },
    seo: {
      title: { value: 'Example Website — Premium Digital Solutions', length: 46 },
      metaDescription: {
        value: 'We provide premium digital solutions for modern businesses. Our services include web development, SEO optimization, and digital marketing strategies.',
        length: 149,
      },
      canonical: 'https://example.com/page',
      robots: 'index, follow',
      lang: 'en',
      charset: 'UTF-8',
      viewport: 'width=device-width, initial-scale=1',
      favicon: '/favicon.ico',
      og: {
        'og:title': 'Example Website',
        'og:description': 'Premium digital solutions',
        'og:image': 'https://example.com/og.jpg',
        'og:type': 'website',
      },
      twitter: {
        'twitter:card': 'summary_large_image',
        'twitter:title': 'Example Website',
      },
      headings: [
        { tag: 'h1', text: 'Premium Digital Solutions', level: 1 },
        { tag: 'h2', text: 'Our Services', level: 2 },
        { tag: 'h3', text: 'Web Development', level: 3 },
        { tag: 'h3', text: 'SEO Optimization', level: 3 },
        { tag: 'h2', text: 'About Us', level: 2 },
        { tag: 'h2', text: 'Contact', level: 2 },
      ],
      h1Count: 1,
      images: {
        total: 24,
        withoutAlt: 3,
        missingAlt: [
          { src: '/img/hero-bg.jpg', alt: '', hasAlt: false },
          { src: '/img/icon-1.svg', alt: '', hasAlt: false },
          { src: '/img/team-photo.jpg', alt: '', hasAlt: false },
        ],
      },
      links: {
        internal: {
          count: 42,
          items: [
            { href: '/about', text: 'About Us', rel: '', isNofollow: false },
            { href: '/services', text: 'Our Services', rel: '', isNofollow: false },
            { href: '/blog', text: 'Latest News & Blog', rel: '', isNofollow: false },
            { href: '/contact', text: 'Contact Us', rel: '', isNofollow: false },
            { href: '/portfolio', text: 'Case Studies', rel: '', isNofollow: false }
          ]
        },
        external: {
          count: 8,
          items: [
            { href: 'https://github.com/refineai', text: 'GitHub Profile', rel: 'noopener', isNofollow: false },
            { href: 'https://twitter.com/refineai', text: 'Twitter Profile', rel: 'noopener', isNofollow: false },
            { href: 'https://wordpress.org', text: 'WordPress CMS', rel: 'nofollow noopener', isNofollow: true }
          ]
        },
        nofollow: {
          count: 2,
          items: [
            { href: 'https://wordpress.org', text: 'WordPress CMS', rel: 'nofollow noopener', isNofollow: true }
          ]
        },
      },
      content: {
        wordCount: 1847,
        readingTime: 10,
        keywords: [
          { word: 'digital', count: 14, density: '2.1' },
          { word: 'solutions', count: 11, density: '1.7' },
          { word: 'website', count: 9, density: '1.4' },
          { word: 'services', count: 8, density: '1.2' },
          { word: 'development', count: 7, density: '1.1' },
        ],
      },
      hreflang: [],
    },
    schema: {
      jsonLd: [
        { type: 'Organization', data: { name: 'Example Corp' } },
        { type: 'WebPage', data: { name: 'Home' } },
      ],
      types: ['Organization', 'WebPage'],
      count: 2,
      hasMicrodata: false,
      microdataCount: 0,
    },
    security: {
      isHTTPS: true,
      cookies: { count: 4, items: [{ name: '_ga', httpOnly: false }, { name: 'session', httpOnly: false }] },
      mixedContent: { count: 0, items: [] },
      inlineScripts: 3,
      insecureForms: { count: 0, items: [] },
      hasPasswordField: false,
      passwordOverHTTP: false,
      externalScripts: { count: 5, items: [] },
      headers: {
        'strict-transport-security': 'max-age=31536000',
        'x-frame-options': 'SAMEORIGIN',
        'x-content-type-options': 'nosniff',
      },
    },
    technology: {
      cms: isShopify ? [{ name: 'Shopify', confidence: 'high' }] : [{ name: 'WordPress', confidence: 'high', version: '6.5' }],
      frontend: isShopify ? [] : [
        { name: 'jQuery', confidence: 'high', version: '3.7.1' },
      ],
      backend: [],
      analytics: [
        { name: 'Google Analytics (GA4)', confidence: 'high' },
        { name: 'Google Tag Manager', confidence: 'high' },
      ],
      infrastructure: [{ name: 'Cloudflare', confidence: 'medium' }],
      ecommerce: isShopify ? [{ name: 'Shopify Checkout', confidence: 'high' }] : [{ name: 'WooCommerce', confidence: 'high' }],
      seo: isShopify ? [] : [{ name: 'Rank Math', confidence: 'high' }],
      caching: isShopify ? [] : [{ name: 'WP Rocket', confidence: 'high' }],
      security: [],
      fonts: [{ name: 'Google Fonts', confidence: 'high' }],
      other: [],
    },
    wordpress: {
      detected: !isShopify,
      theme: { active: 'astra', all: ['astra', 'astra-child'], hasChildTheme: true },
      plugins: [
        { slug: 'woocommerce', name: 'WooCommerce', detected: true },
        { slug: 'elementor', name: 'Elementor', detected: true },
        { slug: 'seo-by-rank-math', name: 'Rank Math', detected: true },
        { slug: 'wp-rocket', name: 'WP Rocket', detected: true },
        { slug: 'advanced-custom-fields', name: 'Advanced Custom Fields', detected: true },
        { slug: 'contact-form-7', name: 'Contact Form 7', detected: true },
        { slug: 'wordfence', name: 'Wordfence', detected: true },
      ],
      pluginCount: 7,
      issues: [
        { type: 'security', message: 'WordPress version is exposed in meta generator tag', severity: 'medium' },
        { type: 'performance', message: 'WordPress emoji script is loaded (usually unnecessary)', severity: 'low' },
        { type: 'performance', message: 'Elementor detected with large DOM — consider reducing widget usage', severity: 'medium' },
        { type: 'performance', message: 'Large DOM size: 2847 elements', severity: 'medium' },
      ],
      wpVersion: '6.5',
    },
    woocommerce: {
      detected: !isShopify,
      productsOnPage: 12,
      hasCart: true,
      hasCheckout: false,
      productSchema: true,
      issues: [],
    },
    shopify: {
      detected: isShopify,
      theme: isShopify ? {
        name: 'Dawn',
        id: '135489726485'
      } : null,
      apps: isShopify ? [
        { name: 'Klaviyo Marketing', slug: 'klaviyo', detected: true },
        { name: 'Loox Product Reviews', slug: 'loox', detected: true },
        { name: 'Judge.me Reviews', slug: 'judgeme', detected: true },
        { name: 'Smile.io Loyalty', slug: 'smile', detected: true },
        { name: 'PageFly Landing Page', slug: 'pagefly', detected: true }
      ] : [],
      appCount: isShopify ? 5 : 0,
      currency: isShopify ? 'USD' : null
    },
    performance: {
      timings: {
        dns: 12,
        ssl: 45,
        ttfb: 320,
        fcp: 1240,
        domContentLoaded: 2100,
        loadComplete: 3800,
        lcp: 1450,
        cls: 0.08,
        inp: 85,
      },
      resources: {
        images: { count: 34, totalSize: 2457600, items: [{ url: '/img/hero.jpg', size: 845000, duration: 450, type: 'img' }] },
        scripts: { count: 21, totalSize: 1843200, items: [{ url: '/wp-includes/js/jquery.min.js', size: 92000, duration: 120, type: 'script' }] },
        stylesheets: { count: 8, totalSize: 512000, items: [] },
        fonts: { count: 6, totalSize: 384000, items: [] },
        other: { count: 12, totalSize: 256000, items: [] },
      },
      totalSize: 5452800,
      totalRequests: 81,
      domSize: 2847,
      domDepth: 18,
    },
    accessibility: {
      issues: [
        { type: 'error', rule: 'img-alt', message: '3 image(s) missing alt text', count: 3, wcag: '1.1.1' },
        { type: 'warning', rule: 'heading-order', message: '1 heading hierarchy skip(s) detected', count: 1, wcag: '1.3.1' },
        { type: 'warning', rule: 'skip-link', message: 'No skip navigation link found', count: 1, wcag: '2.4.1' },
      ],
      errorCount: 1,
      warningCount: 2,
      totalIssues: 3,
    },
    timestamp: Date.now(),
  };
}
