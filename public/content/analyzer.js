// Refine SEO Extension — Content Script Analyzer
// Extracts comprehensive website data from the DOM

(function () {
  'use strict';

  // Prevent double-injection
  if (window.__REFINESEO_INJECTED__) return;
  window.__REFINESEO_INJECTED__ = true;

  // Accumulated Web Vitals variables
  let clsValue = 0;
  let lcpValue = 0;
  let inpValue = 0;

  try {
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) { /* ignore */ }

  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcpValue = lastEntry.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) { /* ignore */ }

  try {
    const inpObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const duration = entry.duration;
        if (duration > inpValue) {
          inpValue = duration;
        }
      }
    });
    inpObserver.observe({ type: 'first-input', buffered: true });
    inpObserver.observe({ type: 'event', buffered: true });
  } catch (e) { /* ignore */ }

  // ============================================================
  // SEO ANALYSIS
  // ============================================================

  function analyzeSEO() {
    const title = document.title || '';
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
    const lang = document.documentElement.lang || '';
    const charset = document.characterSet || '';

    // Open Graph
    const og = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(el => {
      const prop = el.getAttribute('property');
      og[prop] = el.getAttribute('content') || '';
    });

    // Twitter Card
    const twitter = {};
    document.querySelectorAll('meta[name^="twitter:"]').forEach(el => {
      const name = el.getAttribute('name');
      twitter[name] = el.getAttribute('content') || '';
    });

    // Headings
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
      headings.push({
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().substring(0, 200),
        level: parseInt(el.tagName.charAt(1))
      });
    });

    const h1Count = headings.filter(h => h.level === 1).length;

    // Images
    const images = [];
    const imagesWithoutAlt = [];
    document.querySelectorAll('img').forEach(el => {
      const alt = el.getAttribute('alt');
      const src = el.src || el.getAttribute('data-src') || '';
      const img = { src: src.substring(0, 200), alt: alt || '', hasAlt: alt !== null && alt.trim() !== '' };
      images.push(img);
      if (!img.hasAlt) imagesWithoutAlt.push(img);
    });

    // Links
    const internalLinks = [];
    const externalLinks = [];
    const nofollowLinks = [];
    const currentHost = window.location.hostname;

    document.querySelectorAll('a[href]').forEach(el => {
      const href = el.getAttribute('href') || '';
      const text = el.textContent.trim().substring(0, 100);
      const rel = el.getAttribute('rel') || '';
      const isNofollow = rel.includes('nofollow');
      const link = { href, text, rel, isNofollow };

      if (isNofollow) nofollowLinks.push(link);

      try {
        const url = new URL(href, window.location.origin);
        if (url.hostname === currentHost) {
          internalLinks.push(link);
        } else if (url.protocol.startsWith('http')) {
          externalLinks.push(link);
        }
      } catch {
        internalLinks.push(link);
      }
    });

    // Content analysis
    const bodyText = document.body?.innerText || '';
    const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Keyword density (top words, excluding common stop words)
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or', 'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'my', 'your', 'his', 'her', 'our', 'their', 'all', 'each', 'every', 'any', 'some', 'if', 'then', 'than', 'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'why', 'up', 'out', 'about', 'more', 'also', 'just', 'only', 'very']);
    const words = bodyText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    const wordFreq = {};
    words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count, density: ((count / words.length) * 100).toFixed(1) }));

    // Hreflang
    const hreflang = [];
    document.querySelectorAll('link[hreflang]').forEach(el => {
      hreflang.push({
        lang: el.getAttribute('hreflang'),
        href: el.getAttribute('href')
      });
    });

    // Viewport
    const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';

    // Favicon
    const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')?.getAttribute('href') || '';

    return {
      title: { value: title, length: title.length },
      metaDescription: { value: metaDesc, length: metaDesc.length },
      canonical,
      robots,
      lang,
      charset,
      viewport,
      favicon,
      og,
      twitter,
      headings,
      h1Count,
      images: { total: images.length, withoutAlt: imagesWithoutAlt.length, missingAlt: imagesWithoutAlt },
      links: {
        internal: { count: internalLinks.length, items: internalLinks.slice(0, 50) },
        external: { count: externalLinks.length, items: externalLinks.slice(0, 50) },
        nofollow: { count: nofollowLinks.length, items: nofollowLinks.slice(0, 50) }
      },
      content: { wordCount, readingTime, keywords },
      hreflang
    };
  }

  // ============================================================
  // SCHEMA / STRUCTURED DATA
  // ============================================================

  function analyzeSchema() {
    const schemas = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
      try {
        const data = JSON.parse(el.textContent);
        const items = Array.isArray(data) ? data : [data];
        items.forEach(item => {
          if (item['@graph']) {
            item['@graph'].forEach(g => schemas.push({ type: g['@type'] || 'Unknown', data: g }));
          } else {
            schemas.push({ type: item['@type'] || 'Unknown', data: item });
          }
        });
      } catch (e) {
        schemas.push({ type: 'Invalid JSON-LD', error: e.message });
      }
    });

    // Check for microdata
    const microdataCount = document.querySelectorAll('[itemscope]').length;

    return {
      jsonLd: schemas,
      types: [...new Set(schemas.map(s => s.type))],
      count: schemas.length,
      hasMicrodata: microdataCount > 0,
      microdataCount
    };
  }

  // ============================================================
  // SECURITY ANALYSIS
  // ============================================================

  function analyzeSecurity() {
    const isHTTPS = window.location.protocol === 'https:';

    // Check cookies accessible from JS
    const cookies = document.cookie.split(';').filter(c => c.trim()).map(c => {
      const [name] = c.trim().split('=');
      return { name: name.trim(), httpOnly: false }; // JS-accessible cookies are NOT httpOnly
    });

    // Mixed content detection
    const mixedContent = [];
    if (isHTTPS) {
      document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"], iframe[src^="http:"]').forEach(el => {
        mixedContent.push({
          tag: el.tagName.toLowerCase(),
          url: el.src || el.href || ''
        });
      });
    }

    // Check for inline scripts (potential XSS vectors)
    const inlineScripts = document.querySelectorAll('script:not([src])').length;

    // Check for forms without HTTPS action
    const insecureForms = [];
    document.querySelectorAll('form[action^="http:"]').forEach(el => {
      insecureForms.push({ action: el.getAttribute('action') });
    });

    // Check for password fields over HTTP
    const hasPasswordField = document.querySelectorAll('input[type="password"]').length > 0;

    // External scripts
    const externalScripts = [];
    document.querySelectorAll('script[src]').forEach(el => {
      const src = el.getAttribute('src');
      try {
        const url = new URL(src, window.location.origin);
        if (url.hostname !== window.location.hostname) {
          externalScripts.push({
            src: url.href,
            integrity: el.getAttribute('integrity') || null,
            crossorigin: el.getAttribute('crossorigin') || null
          });
        }
      } catch { /* ignore */ }
    });

    return {
      isHTTPS,
      cookies: { count: cookies.length, items: cookies },
      mixedContent: { count: mixedContent.length, items: mixedContent },
      inlineScripts,
      insecureForms: { count: insecureForms.length, items: insecureForms },
      hasPasswordField,
      passwordOverHTTP: hasPasswordField && !isHTTPS,
      externalScripts: { count: externalScripts.length, items: externalScripts.slice(0, 20) }
    };
  }

  // ============================================================
  // TECHNOLOGY DETECTION
  // ============================================================

  function detectTechnology() {
    const tech = {
      cms: [],
      frontend: [],
      backend: [],
      analytics: [],
      infrastructure: [],
      ecommerce: [],
      seo: [],
      caching: [],
      security: [],
      fonts: [],
      other: []
    };

    const html = document.documentElement.outerHTML;
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    const links = Array.from(document.querySelectorAll('link')).map(l => l.href);
    const metas = Array.from(document.querySelectorAll('meta')).map(m => ({
      name: m.getAttribute('name') || m.getAttribute('property') || '',
      content: m.getAttribute('content') || ''
    }));

    const generator = metas.find(m => m.name === 'generator')?.content || '';

    // CMS Detection
    if (html.includes('wp-content') || html.includes('wp-includes') || generator.includes('WordPress')) {
      tech.cms.push({ name: 'WordPress', confidence: 'high', version: generator.replace('WordPress ', '') || null });
    }
    if (html.includes('shopify') || html.includes('Shopify.') || scripts.some(s => s.includes('shopify'))) {
      tech.cms.push({ name: 'Shopify', confidence: 'high' });
    }
    if (html.includes('wix.com') || scripts.some(s => s.includes('wix'))) {
      tech.cms.push({ name: 'Wix', confidence: 'high' });
    }
    if (html.includes('squarespace') || scripts.some(s => s.includes('squarespace'))) {
      tech.cms.push({ name: 'Squarespace', confidence: 'high' });
    }
    if (html.includes('webflow') || scripts.some(s => s.includes('webflow'))) {
      tech.cms.push({ name: 'Webflow', confidence: 'high' });
    }
    if (generator.includes('Drupal')) {
      tech.cms.push({ name: 'Drupal', confidence: 'high' });
    }
    if (generator.includes('Joomla')) {
      tech.cms.push({ name: 'Joomla', confidence: 'high' });
    }

    // Frontend Frameworks
    if (document.querySelector('[data-reactroot]') || document.querySelector('#__next') || html.includes('_reactRootContainer') || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      tech.frontend.push({ name: 'React', confidence: 'high' });
    }
    if (window.__NEXT_DATA__ || html.includes('/_next/')) {
      tech.frontend.push({ name: 'Next.js', confidence: 'high' });
    }
    if (document.querySelector('[data-v-]') || window.__VUE__) {
      tech.frontend.push({ name: 'Vue.js', confidence: 'high' });
    }
    if (html.includes('ng-version') || document.querySelector('[_ngcontent-]')) {
      tech.frontend.push({ name: 'Angular', confidence: 'high' });
    }
    if (window.Svelte || html.includes('svelte')) {
      tech.frontend.push({ name: 'Svelte', confidence: 'medium' });
    }
    if (window.jQuery || typeof window.$ === 'function') {
      const ver = window.jQuery?.fn?.jquery || '';
      tech.frontend.push({ name: 'jQuery', confidence: 'high', version: ver || null });
    }
    if (scripts.some(s => s.includes('bootstrap')) || links.some(l => l.includes('bootstrap'))) {
      tech.frontend.push({ name: 'Bootstrap', confidence: 'high' });
    }
    if (html.includes('tailwind') || document.querySelector('[class*="tw-"]')) {
      tech.frontend.push({ name: 'Tailwind CSS', confidence: 'medium' });
    }

    // Analytics
    if (window.gtag || scripts.some(s => s.includes('gtag')) || scripts.some(s => s.includes('google-analytics'))) {
      tech.analytics.push({ name: 'Google Analytics (GA4)', confidence: 'high' });
    }
    if (window.google_tag_manager || scripts.some(s => s.includes('googletagmanager'))) {
      tech.analytics.push({ name: 'Google Tag Manager', confidence: 'high' });
    }
    if (window.fbq || scripts.some(s => s.includes('fbevents') || s.includes('facebook'))) {
      tech.analytics.push({ name: 'Meta Pixel', confidence: 'high' });
    }
    if (scripts.some(s => s.includes('hotjar'))) {
      tech.analytics.push({ name: 'Hotjar', confidence: 'high' });
    }
    if (scripts.some(s => s.includes('clarity.ms'))) {
      tech.analytics.push({ name: 'Microsoft Clarity', confidence: 'high' });
    }
    if (scripts.some(s => s.includes('plausible'))) {
      tech.analytics.push({ name: 'Plausible', confidence: 'high' });
    }

    // Infrastructure / CDN
    if (scripts.some(s => s.includes('cloudflare')) || html.includes('cloudflare')) {
      tech.infrastructure.push({ name: 'Cloudflare', confidence: 'medium' });
    }
    if (scripts.some(s => s.includes('vercel')) || html.includes('vercel')) {
      tech.infrastructure.push({ name: 'Vercel', confidence: 'medium' });
    }
    if (scripts.some(s => s.includes('netlify'))) {
      tech.infrastructure.push({ name: 'Netlify', confidence: 'medium' });
    }
    if (scripts.some(s => s.includes('amazonaws'))) {
      tech.infrastructure.push({ name: 'AWS', confidence: 'medium' });
    }
    if (scripts.some(s => s.includes('firebase') || s.includes('firebaseio'))) {
      tech.infrastructure.push({ name: 'Firebase', confidence: 'high' });
    }

    // E-Commerce
    if (html.includes('woocommerce') || html.includes('wc-') || html.includes('wc_') || document.querySelector('.woocommerce')) {
      tech.ecommerce.push({ name: 'WooCommerce', confidence: 'high' });
    }
    if (html.includes('bigcommerce')) {
      tech.ecommerce.push({ name: 'BigCommerce', confidence: 'high' });
    }
    if (html.includes('magento')) {
      tech.ecommerce.push({ name: 'Magento', confidence: 'high' });
    }

    // SEO Tools
    if (html.includes('rank-math') || html.includes('rankmath')) {
      tech.seo.push({ name: 'Rank Math', confidence: 'high' });
    }
    if (html.includes('yoast') || html.includes('wpseo')) {
      tech.seo.push({ name: 'Yoast SEO', confidence: 'high' });
    }
    if (html.includes('aioseo') || html.includes('all-in-one-seo')) {
      tech.seo.push({ name: 'All in One SEO', confidence: 'high' });
    }

    // Caching
    if (html.includes('wp-rocket') || html.includes('wprocket')) {
      tech.caching.push({ name: 'WP Rocket', confidence: 'high' });
    }
    if (html.includes('w3-total-cache') || html.includes('w3tc')) {
      tech.caching.push({ name: 'W3 Total Cache', confidence: 'high' });
    }
    if (html.includes('wp-super-cache')) {
      tech.caching.push({ name: 'WP Super Cache', confidence: 'high' });
    }
    if (html.includes('litespeed') || html.includes('lscache')) {
      tech.caching.push({ name: 'LiteSpeed Cache', confidence: 'high' });
    }

    // Fonts
    if (links.some(l => l.includes('fonts.googleapis.com'))) {
      tech.fonts.push({ name: 'Google Fonts', confidence: 'high' });
    }
    if (links.some(l => l.includes('use.typekit.net'))) {
      tech.fonts.push({ name: 'Adobe Fonts', confidence: 'high' });
    }

    return tech;
  }

  // ============================================================
  // SHOPIFY DEEP ANALYSIS
  // ============================================================

  function analyzeShopify() {
    const html = document.documentElement.outerHTML;
    
    // Check if Shopify is used
    const hasShopify = html.includes('cdn.shopify.com') || 
                       html.includes('shopify-section') || 
                       window.Shopify !== undefined || 
                       document.querySelector('link[href*="cdn.shopify.com"]') !== null;

    if (!hasShopify) return { detected: false };

    // Try to detect theme
    let themeName = null;
    let themeId = null;
    
    // Scan script tags for Shopify.theme details
    document.querySelectorAll('script').forEach(el => {
      const text = el.textContent || '';
      if (text.includes('Shopify.theme')) {
        const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/);
        const idMatch = text.match(/"id"\s*:\s*(\d+)/);
        if (nameMatch) themeName = nameMatch[1];
        if (idMatch) themeId = idMatch[1];
      }
    });

    // Fallback theme detection
    if (!themeName) {
      themeName = document.querySelector('meta[name="theme-color"]')?.getAttribute('content') || null;
    }

    // Detect Shopify apps
    const appsList = [
      { name: 'Klaviyo Marketing', slug: 'klaviyo', pattern: /klaviyo\.com/i },
      { name: 'Loox Product Reviews', slug: 'loox', pattern: /loox\.io/i, selector: '.loox-rating, #looxReviews' },
      { name: 'Judge.me Reviews', slug: 'judgeme', pattern: /judgeme/i, selector: '.jdgm-widget, .jdgm-preview-badge' },
      { name: 'Smile.io Loyalty', slug: 'smile', pattern: /(smile\.io|sweettooth)/i },
      { name: 'Yotpo Reviews & Loyalty', slug: 'yotpo', pattern: /yotpo\.com/i, selector: '.yotpo' },
      { name: 'ReCharge Subscriptions', slug: 'recharge', pattern: /(rechargepayments\.com|recharge)/i },
      { name: 'Privy Popups', slug: 'privy', pattern: /privy\.com/i },
      { name: 'Omnisend Email', slug: 'omnisend', pattern: /(omnisend|soundest)/i },
      { name: 'Bold Commerce Apps', slug: 'bold', pattern: /(boldcommerce|boldapps)/i },
      { name: 'PageFly Landing Page', slug: 'pagefly', pattern: /pagefly/i, selector: '[class*="pagefly"]' },
      { name: 'Shogun Page Builder', slug: 'shogun', pattern: /shogun/i, selector: '.shogun-layout' },
      { name: 'Gorgias Helpdesk', slug: 'gorgias', pattern: /gorgias\.io/i },
      { name: 'Ali Reviews', slug: 'alireviews', pattern: /alireviews/i, selector: '.alireviews' },
      { name: 'Stamped.io Reviews', slug: 'stamped', pattern: /stamped\.io/i, selector: '.stamped-' },
      { name: 'Route Shipping Protection', slug: 'route', pattern: /(routeapp|route\.js)/i },
      { name: 'Lucky Orange Heatmaps', slug: 'luckyorange', pattern: /luckyorange/i },
      { name: 'Facebook/Meta Pixel', slug: 'facebook-pixel', pattern: /facebook\.net/i },
      { name: 'Google Tag Manager', slug: 'gtm', pattern: /googletagmanager/i },
      { name: 'Shopify Inbox Chat', slug: 'shopify-inbox', pattern: /(shopify-chat|shopify-inbox)/i },
      { name: 'Searchanise Search', slug: 'searchanise', pattern: /searchanise/i },
      { name: 'Booster SEO', slug: 'booster', pattern: /booster/i }
    ];

    const detectedApps = new Set();
    const urls = [];
    document.querySelectorAll('script[src], link[href]').forEach(el => {
      urls.push(el.src || el.href || '');
    });

    appsList.forEach(app => {
      const hasScript = urls.some(url => app.pattern.test(url));
      const hasHTML = html.includes(app.slug);
      const hasSelector = app.selector ? document.querySelector(app.selector) !== null : false;

      if (hasScript || hasHTML || hasSelector) {
        detectedApps.add(app.name);
      }
    });

    const apps = Array.from(detectedApps).map(name => ({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      detected: true
    }));

    let currency = null;
    try {
      if (window.Shopify && window.Shopify.currency) {
        currency = window.Shopify.currency.active;
      }
    } catch { /* ignore */ }

    return {
      detected: true,
      theme: {
        name: themeName,
        id: themeId
      },
      apps,
      appCount: apps.length,
      currency
    };
  }

  // ============================================================
  // WORDPRESS DEEP ANALYSIS
  // ============================================================

  function analyzeWordPress() {
    const html = document.documentElement.outerHTML;
    const isWordPress = html.includes('wp-content') || html.includes('wp-includes');

    if (!isWordPress) return { detected: false };

    // Theme detection
    const themeMatch = html.match(/wp-content\/themes\/([a-zA-Z0-9_-]+)/);
    const theme = themeMatch ? themeMatch[1] : null;

    // Check for child theme
    const allThemes = [...html.matchAll(/wp-content\/themes\/([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
    const uniqueThemes = [...new Set(allThemes)];
    const hasChildTheme = uniqueThemes.length > 1;

    // Plugin detection
    const pluginSlugs = new Set();
    
    // 1. Scan script and link URLs
    document.querySelectorAll('script[src], link[href], img[src]').forEach(el => {
      const url = (el.tagName === 'LINK' ? el.getAttribute('href') : el.getAttribute('src')) || el.getAttribute('data-src') || '';
      const match = url.match(/wp-content\/plugins\/([a-zA-Z0-9_-]+)/);
      if (match) {
        pluginSlugs.add(match[1]);
      }
    });

    // 2. Scan outerHTML for other references
    const pluginMatches = [...html.matchAll(/wp-content\/plugins\/([a-zA-Z0-9_-]+)/g)];
    pluginMatches.forEach(m => pluginSlugs.add(m[1]));
    
    const detectedPlugins = Array.from(pluginSlugs);

    // Plugin name mapping (slug → display name)
    const pluginNames = {
      'woocommerce': 'WooCommerce',
      'elementor': 'Elementor',
      'elementor-pro': 'Elementor Pro',
      'wordpress-seo': 'Yoast SEO',
      'seo-by-rank-math': 'Rank Math',
      'rank-math-seo': 'Rank Math',
      'wp-rocket': 'WP Rocket',
      'advanced-custom-fields': 'Advanced Custom Fields',
      'advanced-custom-fields-pro': 'ACF Pro',
      'contact-form-7': 'Contact Form 7',
      'wpforms-lite': 'WPForms',
      'gravityforms': 'Gravity Forms',
      'jetpack': 'Jetpack',
      'wordfence': 'Wordfence',
      'sucuri-scanner': 'Sucuri',
      'all-in-one-wp-migration': 'All-in-One WP Migration',
      'updraftplus': 'UpdraftPlus',
      'w3-total-cache': 'W3 Total Cache',
      'wp-super-cache': 'WP Super Cache',
      'litespeed-cache': 'LiteSpeed Cache',
      'autoptimize': 'Autoptimize',
      'wp-optimize': 'WP-Optimize',
      'redirection': 'Redirection',
      'really-simple-ssl': 'Really Simple SSL',
      'akismet': 'Akismet',
      'classic-editor': 'Classic Editor',
      'google-site-kit': 'Site Kit by Google',
      'mailchimp-for-wp': 'Mailchimp for WP',
      'all-in-one-seo-pack': 'All in One SEO',
      'tablepress': 'TablePress',
      'regenerate-thumbnails': 'Regenerate Thumbnails',
      'duplicate-post': 'Duplicate Post',
      'cookie-notice': 'Cookie Notice',
      'complianz-gdpr': 'Complianz GDPR',
      'breeze': 'Breeze Cache',
      'perfmatters': 'Perfmatters',
      'flying-scripts': 'Flying Scripts',
      'asset-cleanup': 'Asset CleanUp'
    };

    const plugins = detectedPlugins.map(slug => ({
      slug,
      name: pluginNames[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      detected: true
    }));

    // WordPress-specific issues
    const issues = [];

    // Check for REST API exposure
    if (document.querySelector('link[rel="https://api.w.org/"]')) {
      issues.push({ type: 'info', message: 'WordPress REST API is exposed', severity: 'low' });
    }

    // Check for login page exposure
    const hasLoginLink = html.includes('wp-login.php');
    if (hasLoginLink) {
      issues.push({ type: 'security', message: 'wp-login.php is accessible', severity: 'medium' });
    }

    // Check for version exposure
    const wpVersionMeta = document.querySelector('meta[name="generator"]');
    if (wpVersionMeta && wpVersionMeta.content.includes('WordPress')) {
      issues.push({ type: 'security', message: 'WordPress version is exposed in meta generator tag', severity: 'medium' });
    }

    // Check for emoji script (performance)
    if (html.includes('wp-emoji-release.min.js')) {
      issues.push({ type: 'performance', message: 'WordPress emoji script is loaded (usually unnecessary)', severity: 'low' });
    }

    // Check for jQuery migrate
    if (html.includes('jquery-migrate')) {
      issues.push({ type: 'performance', message: 'jQuery Migrate is loaded', severity: 'low' });
    }

    // DOM size
    const domSize = document.querySelectorAll('*').length;
    if (domSize > 1500) {
      issues.push({ type: 'performance', message: `Large DOM size: ${domSize} elements`, severity: domSize > 3000 ? 'high' : 'medium' });
    }

    // Check if Elementor is generating large DOM
    if (detectedPlugins.includes('elementor') && domSize > 2000) {
      issues.push({ type: 'performance', message: 'Elementor detected with large DOM — consider reducing widget usage', severity: 'medium' });
    }

    return {
      detected: true,
      theme: {
        active: theme,
        all: uniqueThemes,
        hasChildTheme
      },
      plugins,
      pluginCount: plugins.length,
      issues,
      wpVersion: wpVersionMeta?.content?.replace('WordPress ', '') || null
    };
  }

  // ============================================================
  // WOOCOMMERCE ANALYSIS
  // ============================================================

  function analyzeWooCommerce() {
    const html = document.documentElement.outerHTML;
    const isWoo = html.includes('woocommerce') || html.includes('wc-') || document.querySelector('.woocommerce');

    if (!isWoo) return { detected: false };

    // Product detection
    const products = document.querySelectorAll('.product, [class*="product-"]');
    const hasCart = html.includes('wc-cart') || document.querySelector('.woocommerce-cart') !== null;
    const hasCheckout = document.querySelector('.woocommerce-checkout') !== null;

    // Product schema
    const productSchemas = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
      try {
        const data = JSON.parse(el.textContent);
        if (data['@type'] === 'Product' || (data['@graph'] && data['@graph'].some(g => g['@type'] === 'Product'))) {
          productSchemas.push(data);
        }
      } catch { /* ignore */ }
    });

    const issues = [];
    if (products.length > 0 && productSchemas.length === 0) {
      issues.push({ type: 'seo', message: 'Products detected but no Product schema markup found', severity: 'high' });
    }

    return {
      detected: true,
      productsOnPage: products.length,
      hasCart,
      hasCheckout,
      productSchema: productSchemas.length > 0,
      issues
    };
  }

  // ============================================================
  // PERFORMANCE ANALYSIS
  // ============================================================

  function analyzePerformance() {
    const timing = performance.timing || {};
    const navigation = performance.getEntriesByType('navigation')[0] || {};

    // Core Web Vitals estimation
    const entries = performance.getEntriesByType('resource');
    const paintEntries = performance.getEntriesByType('paint');

    const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || null;
    const lcp = null; // Requires PerformanceObserver, set up separately
    const ttfb = navigation.responseStart - navigation.requestStart || null;

    // Resource breakdown
    const resources = {
      images: { count: 0, totalSize: 0, items: [] },
      scripts: { count: 0, totalSize: 0, items: [] },
      stylesheets: { count: 0, totalSize: 0, items: [] },
      fonts: { count: 0, totalSize: 0, items: [] },
      other: { count: 0, totalSize: 0, items: [] }
    };

    entries.forEach(entry => {
      const size = entry.transferSize || entry.encodedBodySize || 0;
      const item = {
        url: entry.name.substring(0, 200),
        size,
        duration: Math.round(entry.duration),
        type: entry.initiatorType
      };

      if (entry.initiatorType === 'img' || entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg|avif|ico)/i)) {
        resources.images.count++;
        resources.images.totalSize += size;
        resources.images.items.push(item);
      } else if (entry.initiatorType === 'script' || entry.name.match(/\.js/i)) {
        resources.scripts.count++;
        resources.scripts.totalSize += size;
        resources.scripts.items.push(item);
      } else if (entry.initiatorType === 'css' || entry.initiatorType === 'link' || entry.name.match(/\.css/i)) {
        resources.stylesheets.count++;
        resources.stylesheets.totalSize += size;
        resources.stylesheets.items.push(item);
      } else if (entry.name.match(/\.(woff2?|ttf|otf|eot)/i)) {
        resources.fonts.count++;
        resources.fonts.totalSize += size;
        resources.fonts.items.push(item);
      } else {
        resources.other.count++;
        resources.other.totalSize += size;
      }
    });

    // Sort items by size (descending)
    Object.values(resources).forEach(r => {
      if (r.items) r.items.sort((a, b) => b.size - a.size);
      if (r.items) r.items = r.items.slice(0, 10); // Top 10 only
    });

    // Total page weight
    const totalSize = Object.values(resources).reduce((sum, r) => sum + r.totalSize, 0);
    const totalRequests = Object.values(resources).reduce((sum, r) => sum + r.count, 0);

    // Timing breakdown
    const timings = {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart || null,
      ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : null,
      ttfb: ttfb ? Math.round(ttfb) : null,
      fcp: fcp ? Math.round(fcp) : null,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime || null,
      loadComplete: navigation.loadEventEnd - navigation.startTime || null,
      lcp: lcpValue ? Math.round(lcpValue) : null,
      cls: Math.round(clsValue * 1000) / 1000,
      inp: inpValue ? Math.round(inpValue) : null
    };

    // DOM metrics
    const domSize = document.querySelectorAll('*').length;
    const domDepth = getMaxDOMDepth(document.body);

    return {
      timings,
      resources,
      totalSize,
      totalRequests,
      domSize,
      domDepth
    };
  }

  function getMaxDOMDepth(element, depth = 0) {
    if (!element || !element.children) return depth;
    let maxDepth = depth;
    for (const child of element.children) {
      maxDepth = Math.max(maxDepth, getMaxDOMDepth(child, depth + 1));
      if (maxDepth > 32) return maxDepth; // Cap to prevent stack overflow
    }
    return maxDepth;
  }

  // ============================================================
  // ACCESSIBILITY ANALYSIS
  // ============================================================

  function analyzeAccessibility() {
    const issues = [];

    // Images without alt
    const imgsNoAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
    if (imgsNoAlt.length > 0) {
      issues.push({
        type: 'error',
        rule: 'img-alt',
        message: `${imgsNoAlt.length} image(s) missing alt text`,
        count: imgsNoAlt.length,
        wcag: '1.1.1'
      });
    }

    // Form inputs without labels
    const inputsNoLabel = [];
    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea').forEach(el => {
      const id = el.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      const wrappedInLabel = el.closest('label');
      if (!hasLabel && !hasAriaLabel && !wrappedInLabel) {
        inputsNoLabel.push(el.tagName.toLowerCase() + (el.type ? `[type="${el.type}"]` : ''));
      }
    });
    if (inputsNoLabel.length > 0) {
      issues.push({
        type: 'error',
        rule: 'label',
        message: `${inputsNoLabel.length} form input(s) missing labels`,
        count: inputsNoLabel.length,
        wcag: '1.3.1'
      });
    }

    // Missing lang attribute
    if (!document.documentElement.lang) {
      issues.push({ type: 'error', rule: 'html-lang', message: 'Missing lang attribute on <html>', count: 1, wcag: '3.1.1' });
    }

    // Heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    let hierarchyIssues = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName.charAt(1));
      if (level - lastLevel > 1 && lastLevel > 0) hierarchyIssues++;
      lastLevel = level;
    });
    if (hierarchyIssues > 0) {
      issues.push({
        type: 'warning',
        rule: 'heading-order',
        message: `${hierarchyIssues} heading hierarchy skip(s) detected`,
        count: hierarchyIssues,
        wcag: '1.3.1'
      });
    }

    // Missing landmarks
    const hasMain = document.querySelector('main, [role="main"]') !== null;
    const hasNav = document.querySelector('nav, [role="navigation"]') !== null;
    if (!hasMain) {
      issues.push({ type: 'warning', rule: 'landmark-main', message: 'Missing <main> landmark', count: 1, wcag: '1.3.1' });
    }
    if (!hasNav) {
      issues.push({ type: 'warning', rule: 'landmark-nav', message: 'Missing <nav> landmark', count: 1, wcag: '1.3.1' });
    }

    // Skip link
    const hasSkipLink = document.querySelector('a[href="#main-content"], a[href="#content"], a[class*="skip"]') !== null;
    if (!hasSkipLink) {
      issues.push({ type: 'warning', rule: 'skip-link', message: 'No skip navigation link found', count: 1, wcag: '2.4.1' });
    }

    // Tabindex > 0
    const badTabindex = document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
    if (badTabindex.length > 0) {
      issues.push({
        type: 'warning',
        rule: 'tabindex',
        message: `${badTabindex.length} element(s) with positive tabindex`,
        count: badTabindex.length,
        wcag: '2.4.3'
      });
    }

    // Buttons without text
    const emptyButtons = document.querySelectorAll('button:empty, button:not([aria-label])');
    let emptyCount = 0;
    emptyButtons.forEach(btn => {
      if (!btn.textContent.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('aria-labelledby')) {
        emptyCount++;
      }
    });
    if (emptyCount > 0) {
      issues.push({
        type: 'error',
        rule: 'button-name',
        message: `${emptyCount} button(s) without accessible name`,
        count: emptyCount,
        wcag: '4.1.2'
      });
    }

    const errors = issues.filter(i => i.type === 'error').length;
    const warnings = issues.filter(i => i.type === 'warning').length;

    return {
      issues,
      errorCount: errors,
      warningCount: warnings,
      totalIssues: issues.length
    };
  }

  // ============================================================
  // AEO / AI VISIBILITY AUDIT
  // ============================================================

  function analyzeAEO() {
    const detailsAnswer = [];
    const detailsEntity = [];
    const detailsSchema = [];
    const detailsCitation = [];
    const detailsEeat = [];
    const detailsStructure = [];

    const bodyText = document.body?.innerText || '';
    const bodyTextLower = bodyText.toLowerCase();

    // 1. Answer Readiness (25% weight) - Max 100
    let answerScore = 0;
    
    // Check for Question Headings (30 points)
    const qaRegex = /^(what|how|why|who|when|where|can|is|are|does|do|should|define)\b/i;
    let hasQuestionHeading = false;
    let qaHeadingCount = 0;
    document.querySelectorAll('h1, h2, h3, h4').forEach(h => {
      const text = h.textContent.trim();
      if (text.includes('?') || qaRegex.test(text)) {
        hasQuestionHeading = true;
        qaHeadingCount++;
      }
    });
    if (hasQuestionHeading) {
      answerScore += 30;
      detailsAnswer.push(`Found ${qaHeadingCount} question-based headings, optimized for query matching.`);
    } else {
      detailsAnswer.push('No question-formatted headings found. Phrasing headings as queries (e.g. "What is...") matches AI search patterns.');
    }

    // Check for Definitions (25 points)
    const definitionRegex = /\b(is a|is the|is defined as|refers to|means the|denotes|is an open-source)\b/i;
    let hasDefinition = definitionRegex.test(bodyText);
    if (hasDefinition) {
      answerScore += 25;
      detailsAnswer.push('Clear definition statements (e.g. "is a", "refers to") detected in paragraphs.');
    } else {
      detailsAnswer.push('No explicit definition syntax found. Use "Entity is X" patterns to help AI identify core concepts.');
    }

    // Check for Step-by-Step Sections (15 points)
    let hasSteps = false;
    document.querySelectorAll('ol, ul').forEach(list => {
      const parentText = list.previousElementSibling?.textContent?.toLowerCase() || '';
      if (parentText.includes('step') || parentText.includes('how to') || parentText.includes('guide') || parentText.includes('install') || parentText.includes('setup')) {
        hasSteps = true;
      }
    });
    if (!hasSteps) {
      // Check if headers have numbers
      document.querySelectorAll('h2, h3').forEach(h => {
        if (/^[0-9]\.\s+/i.test(h.textContent.trim())) {
          hasSteps = true;
        }
      });
    }
    if (hasSteps) {
      answerScore += 15;
      detailsAnswer.push('Step-by-step guidance sections or numbered headers detected.');
    } else {
      detailsAnswer.push('No numbered guides or step-by-step sections found.');
    }

    // Tables (15 points)
    const tableCount = document.querySelectorAll('table').length;
    if (tableCount > 0) {
      answerScore += 15;
      detailsAnswer.push(`Found structured tables (${tableCount} found), excellent for direct AI data pulls.`);
    } else {
      detailsAnswer.push('No HTML tables found. Use tables for comparative or tabular data to trigger AI summaries.');
    }

    // Lists (15 points)
    const listCount = document.querySelectorAll('ul, ol').length;
    if (listCount > 0) {
      answerScore += 15;
      detailsAnswer.push(`Detected HTML lists (${listCount} lists on page), highly extractable for AI bullet answers.`);
    } else {
      detailsAnswer.push('No lists found. Group related items in bullet points.');
    }

    // 2. Entity Coverage (20% weight) - Max 100
    let entityScore = 0;
    const commonEntities = ['wordpress', 'woocommerce', 'shopify', 'google', 'openai', 'refineseo', 'microsoft', 'apple', 'amazon', 'facebook', 'instagram', 'twitter', 'github', 'wikipedia'];
    const detectedEntitiesSet = new Set();
    
    // Simple scan
    commonEntities.forEach(ent => {
      if (bodyTextLower.includes(ent)) {
        detectedEntitiesSet.add(ent.charAt(0).toUpperCase() + ent.slice(1));
      }
    });

    // Extract other capitalized words that look like entities
    const properNounRegex = /\b[A-Z][a-z]{3,15}\b/g;
    const properNouns = bodyText.match(properNounRegex) || [];
    const entityIgnore = new Set(['The', 'This', 'That', 'With', 'From', 'Their', 'They', 'Here', 'Then', 'When', 'Where', 'What', 'About', 'Contact', 'Home', 'Blog', 'Shop', 'Privacy', 'Terms', 'More', 'Read', 'Page']);
    properNouns.forEach(noun => {
      if (!entityIgnore.has(noun) && detectedEntitiesSet.size < 12) {
        detectedEntitiesSet.add(noun);
      }
    });

    const detectedEntities = Array.from(detectedEntitiesSet);
    if (detectedEntities.length > 0) {
      entityScore = Math.min(100, detectedEntities.length * 20);
      detailsEntity.push(`Extracted ${detectedEntities.length} key semantic entities.`);
    } else {
      detailsEntity.push('No prominent semantic entities detected in body text.');
    }

    const boldCount = document.querySelectorAll('strong, b').length;
    if (boldCount > 3) {
      entityScore = Math.min(100, entityScore + 10);
      detailsEntity.push(`Used bold tags on ${boldCount} terms to emphasize key concept entities.`);
    } else {
      detailsEntity.push('Highlight key entities with bold formatting tags.');
    }

    // 3. Schema Readiness (20% weight) - Max 100
    let schemaScore = 0;
    const schemasFound = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
      try {
        const data = JSON.parse(el.textContent);
        const items = Array.isArray(data) ? data : [data];
        items.forEach(item => {
          if (item['@graph']) {
            item['@graph'].forEach(g => { if (g['@type']) schemasFound.push(g['@type'].toLowerCase()); });
          } else if (item['@type']) {
            schemasFound.push(item['@type'].toLowerCase());
          }
        });
      } catch (e) { /* ignore */ }
    });

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

    if (document.querySelector('[itemscope]')) {
      schemaScore = Math.min(100, schemaScore + 10);
      detailsSchema.push('Found HTML microdata items alongside JSON-LD.');
    }

    // 4. Citation Readiness (15% weight) - Max 100
    let citationScore = 0;

    // Author tag (20 pts)
    const authorMeta = document.querySelector('meta[name="author"]') || document.querySelector('[itemprop="author"]');
    const hasAuthorInSchema = schemasFound.some(sf => sf.includes('person') || sf.includes('author'));
    if (authorMeta || hasAuthorInSchema) {
      citationScore += 20;
      detailsCitation.push('Author attribution is defined (meta author or author schema).');
    } else {
      detailsCitation.push('Missing explicit author attribution (e.g. meta name="author" tag).');
    }

    // About page link (20 pts)
    let hasAbout = false;
    document.querySelectorAll('a[href]').forEach(el => {
      const href = el.getAttribute('href').toLowerCase();
      const text = el.textContent.toLowerCase();
      if (href.includes('about') || text.includes('about us') || text.includes('who we are')) {
        hasAbout = true;
      }
    });
    if (hasAbout) {
      citationScore += 20;
      detailsCitation.push('Page links to a verified "About" or brand profile page.');
    } else {
      detailsCitation.push('No link to an "About Us" page detected.');
    }

    // Contact page link (20 pts)
    let hasContact = false;
    document.querySelectorAll('a[href]').forEach(el => {
      const href = el.getAttribute('href').toLowerCase();
      const text = el.textContent.toLowerCase();
      if (href.includes('contact') || text.includes('contact us') || text.includes('get in touch')) {
        hasContact = true;
      }
    });
    if (hasContact) {
      citationScore += 20;
      detailsCitation.push('Page links to a verified "Contact" page.');
    } else {
      detailsCitation.push('No link to a "Contact" page detected.');
    }

    // External sources / references (20 pts)
    const currentHost = window.location.hostname;
    let externalRefs = 0;
    document.querySelectorAll('a[href]').forEach(el => {
      const href = el.getAttribute('href') || '';
      try {
        const url = new URL(href, window.location.origin);
        if (url.hostname !== currentHost && url.protocol.startsWith('http')) {
          const host = url.hostname.toLowerCase();
          if (host.endsWith('.gov') || host.endsWith('.edu') || host.endsWith('.org') || host.includes('wikipedia') || host.includes('arxiv') || host.includes('doi')) {
            externalRefs++;
          }
        }
      } catch { /* ignore */ }
    });
    if (externalRefs > 0) {
      citationScore += 20;
      detailsCitation.push(`References ${externalRefs} high-authority source link(s) (.gov, .edu, Wikipedia).`);
    } else {
      detailsCitation.push('No high-authority external sources cited in outbound links.');
    }

    // Last updated date (20 pts)
    const hasDateMeta = document.querySelector('time') !== null || document.querySelector('[class*="date"], [id*="date"], [property*="date"], [itemprop*="date"]') !== null;
    if (hasDateMeta) {
      citationScore += 20;
      detailsCitation.push('Temporal fresh signals found (publish or update timestamps).');
    } else {
      detailsCitation.push('No last updated timestamp found.');
    }

    // 5. E-E-A-T Signals (10% weight) - Max 100
    let eeatScore = 0;

    // Author Profile link (20 pts)
    const authorProfileLink = document.querySelector('a[href*="/author/"], a[href*="/profile/"], [class*="author-link"]');
    if (authorProfileLink) {
      eeatScore += 20;
      detailsEeat.push('Links to an author credentials or profile page.');
    } else {
      detailsEeat.push('No link to an author profile page found.');
    }

    // Company Information (20 pts)
    const companyKeywords = /\b(inc\.|llc|corp\.|corporation|ltd\.|limited|co\.)\b/i;
    if (companyKeywords.test(bodyText)) {
      eeatScore += 20;
      detailsEeat.push('Company registration details (LLC, Inc, Corp, Ltd) identified in text.');
    } else {
      detailsEeat.push('No company registration details detected in body.');
    }

    // Address (20 pts)
    const addressKeywords = /\b(st\.|street|ave\.|avenue|rd\.|road|suite|building|floor|po box)\b/i;
    const hasZip = /\b\d{5}(-\d{4})?\b/.test(bodyText) || /\b[A-Z]\d[A-Z] \d[A-Z]\d\b/i.test(bodyText); // US or Canadian ZIP
    if (addressKeywords.test(bodyText) || hasZip) {
      eeatScore += 20;
      detailsEeat.push('Physical mailing address signals detected in text.');
    } else {
      detailsEeat.push('No physical mailing address or ZIP code found in footer/body.');
    }

    // Social Profiles (20 pts)
    let socialCount = 0;
    document.querySelectorAll('a[href]').forEach(el => {
      const href = el.getAttribute('href').toLowerCase();
      if (href.includes('twitter.com') || href.includes('x.com') || href.includes('facebook.com') || href.includes('linkedin.com') || href.includes('instagram.com') || href.includes('youtube.com')) {
        socialCount++;
      }
    });
    if (socialCount > 0) {
      eeatScore += 20;
      detailsEeat.push(`Linked ${socialCount} social media profile channels.`);
    } else {
      detailsEeat.push('No social media profile links (LinkedIn, X, Facebook) detected.');
    }

    // Privacy & Terms Policies (20 pts)
    let policyCount = 0;
    document.querySelectorAll('a[href]').forEach(el => {
      const text = el.textContent.toLowerCase();
      if (text.includes('privacy policy') || text.includes('terms of service') || text.includes('terms of use')) {
        policyCount++;
      }
    });
    if (policyCount > 0) {
      eeatScore += 20;
      detailsEeat.push('Verified links to Privacy Policy and/or Terms of Service agreements.');
    } else {
      detailsEeat.push('No links to Privacy Policy or Terms of Service found.');
    }

    // 6. Content Structure (10% weight) - Max 100
    let structureScore = 0;

    // Heading Tree Order (30 pts)
    let headingSkips = 0;
    let prevLevel = 0;
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      const level = parseInt(h.tagName.charAt(1));
      if (prevLevel > 0 && level > prevLevel + 1) {
        headingSkips++;
      }
      prevLevel = level;
    });
    if (prevLevel === 0) {
      detailsStructure.push('No headings found on the page.');
    } else if (headingSkips === 0) {
      structureScore += 30;
      detailsStructure.push('Heading tree hierarchy has perfect nesting order.');
    } else {
      structureScore += 10;
      detailsStructure.push(`Detected ${headingSkips} heading level skip(s) (e.g. H1 directly to H3).`);
    }

    // FAQ Blocks (20 pts)
    const faqBlocks = document.querySelectorAll('[class*="faq"], [id*="faq"]').length;
    const questionMarks = (bodyText.match(/\?/g) || []).length;
    if (faqBlocks > 0 || questionMarks > 3) {
      structureScore += 20;
      detailsStructure.push('Page contains structural FAQ blocks or multiple question format patterns.');
    } else {
      detailsStructure.push('No styled FAQ blocks or high density of questions found.');
    }

    // Short Paragraphs (25 pts)
    let longParagraphs = 0;
    let paragraphCount = 0;
    document.querySelectorAll('p').forEach(p => {
      paragraphCount++;
      const wordCount = p.textContent.trim().split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount > 60) {
        longParagraphs++;
      }
    });
    if (paragraphCount > 0 && (longParagraphs / paragraphCount) < 0.25) {
      structureScore += 25;
      detailsStructure.push('Paragraphs are short and highly scannable (under 60 words average).');
    } else if (paragraphCount > 0) {
      structureScore += 10;
      detailsStructure.push(`Found ${longParagraphs} long paragraph(s) containing over 60 words.`);
    } else {
      detailsStructure.push('No paragraph tags (<p>) found on the page.');
    }

    // Definition Sections (15 pts)
    const hasDfn = document.querySelectorAll('dfn').length > 0;
    const hasDefinitionList = document.querySelectorAll('dl, dt, dd').length > 0;
    if (hasDfn || hasDefinitionList || hasDefinition) {
      structureScore += 15;
      detailsStructure.push('Uses definition markup (<dfn>, <dl>) or clear inline glossary terms.');
    } else {
      detailsStructure.push('No structured definitions found. Use glossaries or <dfn> tags for entity clarity.');
    }

    // Table of Contents (10 pts)
    const hasTOC = document.querySelector('[class*="toc"], [id*="toc"], [class*="table-of-contents"], [id*="table-of-contents"]') !== null;
    if (hasTOC) {
      structureScore += 10;
      detailsStructure.push('Table of Contents (TOC) index detected, easing deep page indexing.');
    } else {
      detailsStructure.push('No Table of Contents (TOC) element found.');
    }

    // Combine Weighted Score
    // Answer Readiness: 25%
    // Entity Coverage: 20%
    // Schema Readiness: 20%
    // Citation Readiness: 15%
    // EEAT Signals: 10%
    // Content Structure: 10%
    const aeoScore = Math.round(
      (answerScore * 0.25) +
      (entityScore * 0.20) +
      (schemaScore * 0.20) +
      (citationScore * 0.15) +
      (eeatScore * 0.10) +
      (structureScore * 0.10)
    );

    // AI Answer Preview Synthesis
    let answerPreview = '';
    const h1El = document.querySelector('h1');
    const firstParagraph = document.querySelector('p');
    if (h1El && firstParagraph && firstParagraph.textContent.trim().length > 20) {
      const titleClean = h1El.textContent.trim();
      const paraClean = firstParagraph.textContent.trim().split('.').slice(0, 2).join('.') + '.';
      answerPreview = `Based on the page structure, ChatGPT or Gemini might summarize: "${titleClean} is highlighted as follows. ${paraClean}"`;
    } else {
      const docTitle = document.title || 'Target Website';
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      answerPreview = `Based on the page meta definitions, ChatGPT or Gemini might summarize: "${docTitle}. ${metaDesc}"`;
    }

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

  // ============================================================
  // SITE INFO
  // ============================================================

  function getSiteInfo() {
    return {
      url: window.location.href,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      pathname: window.location.pathname
    };
  }

  // ============================================================
  // MAIN ANALYSIS FUNCTION
  // ============================================================

  function runFullAnalysis() {
    try {
      const result = {
        site: getSiteInfo(),
        seo: analyzeSEO(),
        schema: analyzeSchema(),
        security: analyzeSecurity(),
        technology: detectTechnology(),
        wordpress: analyzeWordPress(),
        woocommerce: analyzeWooCommerce(),
        shopify: analyzeShopify(),
        performance: analyzePerformance(),
        accessibility: analyzeAccessibility(),
        aeo: analyzeAEO(),
        timestamp: Date.now()
      };

      // Send results to background script
      chrome.runtime.sendMessage({ type: 'ANALYSIS_RESULT', data: result });

      return result;
    } catch (error) {
      console.error('[Refine SEO] Analysis error:', error);
      return { error: error.message };
    }
  }

  // Listen for analysis requests
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'RUN_ANALYSIS') {
      const result = runFullAnalysis();
      sendResponse(result);
    }
    return true;
  });

  // Run initial analysis
  runFullAnalysis();
})();
