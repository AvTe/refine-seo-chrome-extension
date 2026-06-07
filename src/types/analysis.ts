// RefineAI Inspector — Analysis Types

export interface SiteInfo {
  url: string;
  hostname: string;
  protocol: string;
  pathname: string;
}

export interface TitleMeta {
  value: string;
  length: number;
}

export interface ImageData {
  src: string;
  alt: string;
  hasAlt: boolean;
}

export interface LinkData {
  href: string;
  text: string;
  rel: string;
  isNofollow: boolean;
}

export interface HeadingData {
  tag: string;
  text: string;
  level: number;
}

export interface KeywordData {
  word: string;
  count: number;
  density: string;
}

export interface SEOAnalysis {
  title: TitleMeta;
  metaDescription: TitleMeta;
  canonical: string;
  robots: string;
  lang: string;
  charset: string;
  viewport: string;
  favicon: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  headings: HeadingData[];
  h1Count: number;
  images: {
    total: number;
    withoutAlt: number;
    missingAlt: ImageData[];
  };
  links: {
    internal: { count: number; items: LinkData[] };
    external: { count: number; items: LinkData[] };
    nofollow: { count: number; items: LinkData[] };
  };
  content: {
    wordCount: number;
    readingTime: number;
    keywords: KeywordData[];
  };
  hreflang: { lang: string; href: string }[];
}

export interface SchemaItem {
  type: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface SchemaAnalysis {
  jsonLd: SchemaItem[];
  types: string[];
  count: number;
  hasMicrodata: boolean;
  microdataCount: number;
}

export interface CookieData {
  name: string;
  httpOnly: boolean;
}

export interface SecurityAnalysis {
  isHTTPS: boolean;
  cookies: { count: number; items: CookieData[] };
  mixedContent: { count: number; items: { tag: string; url: string }[] };
  inlineScripts: number;
  insecureForms: { count: number; items: { action: string }[] };
  hasPasswordField: boolean;
  passwordOverHTTP: boolean;
  externalScripts: {
    count: number;
    items: { src: string; integrity: string | null; crossorigin: string | null }[];
  };
  headers?: Record<string, string>;
}

export interface TechItem {
  name: string;
  confidence: string;
  version?: string | null;
}

export interface TechnologyAnalysis {
  cms: TechItem[];
  frontend: TechItem[];
  backend: TechItem[];
  analytics: TechItem[];
  infrastructure: TechItem[];
  ecommerce: TechItem[];
  seo: TechItem[];
  caching: TechItem[];
  security: TechItem[];
  fonts: TechItem[];
  other: TechItem[];
}

export interface WPPlugin {
  slug: string;
  name: string;
  detected: boolean;
}

export interface WPIssue {
  type: string;
  message: string;
  severity: string;
}

export interface WordPressAnalysis {
  detected: boolean;
  theme?: {
    active: string | null;
    all: string[];
    hasChildTheme: boolean;
  };
  plugins?: WPPlugin[];
  pluginCount?: number;
  issues?: WPIssue[];
  wpVersion?: string | null;
}

export interface WooCommerceAnalysis {
  detected: boolean;
  productsOnPage?: number;
  hasCart?: boolean;
  hasCheckout?: boolean;
  productSchema?: boolean;
  issues?: WPIssue[];
}

export interface ShopifyApp {
  slug: string;
  name: string;
  detected: boolean;
}

export interface ShopifyAnalysis {
  detected: boolean;
  theme?: {
    name: string | null;
    id: string | null;
  } | null;
  apps?: ShopifyApp[];
  appCount?: number;
  currency?: string | null;
}

export interface ResourceGroup {
  count: number;
  totalSize: number;
  items: {
    url: string;
    size: number;
    duration: number;
    type: string;
  }[];
}

export interface PerformanceAnalysis {
  timings: {
    dns: number | null;
    ssl: number | null;
    ttfb: number | null;
    fcp: number | null;
    domContentLoaded: number | null;
    loadComplete: number | null;
    lcp?: number | null;
    cls?: number | null;
    inp?: number | null;
  };
  resources: {
    images: ResourceGroup;
    scripts: ResourceGroup;
    stylesheets: ResourceGroup;
    fonts: ResourceGroup;
    other: ResourceGroup;
  };
  totalSize: number;
  totalRequests: number;
  domSize: number;
  domDepth: number;
}

export interface AuditHistoryItem {
  timestamp: number;
  url: string;
  hostname: string;
  scores: {
    overall: number;
    seo: number;
    performance: number;
    security: number;
    accessibility: number;
    aeo?: number;
  };
}

export interface A11yIssue {
  type: 'error' | 'warning';
  rule: string;
  message: string;
  count: number;
  wcag: string;
}

export interface AccessibilityAnalysis {
  issues: A11yIssue[];
  errorCount: number;
  warningCount: number;
  totalIssues: number;
}

export interface AEOAnalysis {
  aeoScore: number;
  answerReadiness: { score: number; details: string[] };
  entityCoverage: { score: number; details: string[]; detectedEntities: string[] };
  schemaReadiness: { score: number; details: string[] };
  citationReadiness: { score: number; details: string[] };
  eeatSignals: { score: number; details: string[] };
  contentStructure: { score: number; details: string[] };
  answerPreview: string;
}

export interface PageAnalysis {
  site: SiteInfo;
  seo: SEOAnalysis;
  schema: SchemaAnalysis;
  security: SecurityAnalysis;
  technology: TechnologyAnalysis;
  wordpress: WordPressAnalysis;
  woocommerce: WooCommerceAnalysis;
  shopify: ShopifyAnalysis;
  performance: PerformanceAnalysis;
  accessibility: AccessibilityAnalysis;
  aeo?: AEOAnalysis;
  timestamp: number;
  tabId?: number;
  url?: string;
}

export type NavSection =
  | 'overview'
  | 'seo'
  | 'performance'
  | 'security'
  | 'wordpress'
  | 'techstack'
  | 'accessibility'
  | 'aiinsights'
  | 'actioncenter'
  | 'aeo'
  | 'competitor'
  | 'reports'
  | 'screenshots'
  | 'settings';

export interface CompetitorAnalysis {
  url: string;
  hostname: string;
  seoScore: number;
  securityScore: number;
  performanceScore: number;
  accessibilityScore: number;
  overallScore: number;
  pageSize: number;
  requestsCount: number;
  cms: string;
  technologiesCount: number;
}
