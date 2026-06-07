# Refine SEO Extension — Website Intelligence Extension

Refine SEO Extension is a premium, feature-rich Google Chrome SidePanel extension that audits and inspects websites directly from your browser. It provides comprehensive, real-time insights on SEO, page performance, security headers, accessibility WCAG compliance, web technology stack (with deep detection for WordPress & Shopify), AI insights, competitor comparisons, and exportable PDF audits.

---

## 🚀 Key Features

*   **Website Overview**: High-level health score card based on multiple audit criteria and overall page attributes.
*   **SEO Inspector**: Detailed audits of On-Page tags (title, description, canonicals, OG/Twitter metadata, headings structure), Content statistics (word count, reading time, keyword density), Links (internal/external/nofollow lists), and Structured Data (JSON-LD and Microdata).
*   **Performance Analyzer**: Measures TTFB, FCP, load times, DOM element size/depth, and illustrates visual resource breakdowns (images, scripts, CSS, fonts) using interactive charts.
*   **Security Inspector**: Audits HTTPS connection, mixed content, JS-accessible cookies, insecure forms, external script integrity (SRI), and key HTTP security headers.
*   **CMS Deep Analysis**:
    *   **WordPress**: Detects theme, child themes, active plugins list, WooCommerce status, and specific security/performance recommendations.
    *   **Shopify**: Detects active theme, theme ID, currency, and embedded Shopify marketing, review, and loyalty apps.
*   **Tech Stack Inspector**: Catalogs and labels technologies across categories (CMS, Frontend, Analytics, Infrastructure, E-commerce, SEO, Caching, Fonts) with versioning and confidence metrics.
*   **Accessibility (WCAG)**: Audits alt tags, form labels, lang attributes, skip links, tabindex usage, landmark roles, and button labels.
*   **AI Insights**: Displays a priority recommendation checklist. Includes an interactive chat auditor powered by the Gemini API (via your local API key) with local rules-based fallback.
*   **Competitor Compare**: Compares your active website scores and asset sizes side-by-side with any competitor domain.
*   **PDF Report Exporter**: Generates a professional multi-page executive PDF report (using `jsPDF` and `jspdf-autotable`) with customizable client/agency metadata and section selection.
*   **Screenshot Log**: Captures and saves active window layouts locally using Chrome Extension APIs.

---

## 🛠️ Technology Stack

*   **Core**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS, Vanilla CSS
*   **Libraries**:
    *   [jspdf](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) (PDF generation)
    *   [recharts](https://github.com/recharts/recharts) (interactive charts)
    *   [lucide-react](https://github.com/lucide/lucide) (modern icon set)

---

## 📦 Installation & Setup

Follow these steps to build and install the extension in your Google Chrome browser:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.

### 2. Install Dependencies
Clone the repository and run:
```bash
npm install
```

### 3. Build the Extension
Build the React production application and compile extension content scripts:
```bash
npm run build
```
This compiles all files and bundles them into the `dist/` directory.

### 4. Load into Chrome
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** using the toggle in the top-right corner.
3.  Click the **Load unpacked** button in the top-left.
4.  Select the **`dist/`** directory inside this project folder.
5.  Click the Refine SEO puzzle piece icon in your Chrome toolbar to open the side panel inspector.

---

## 💻 Development Mode

To run the app locally as a web preview during UI development:
```bash
npm run dev
```
*Note: In local preview mode, mock data is injected since the app runs outside the Chrome extension context.*

---

## 📂 Project Structure

```
├── dist/                    # Compiled Chrome Extension build output
├── public/                  # Static assets & Extension entrypoints
│   ├── background.js        # Service worker (message broker & screenshots)
│   ├── content/
│   │   └── analyzer.js      # DOM scanner content script
│   ├── manifest.json        # Extension manifest v3 configuration
│   └── icons/               # Extension icons
├── src/                     # React App Source Code
│   ├── components/          # View panels & UI layouts
│   ├── context/             # State & Chrome API communication
│   ├── utils/               # Scoring algorithm & formatters
│   ├── types/               # TypeScript declarations
│   ├── App.tsx              # Main Router & View switcher
│   ├── index.css            # Stylesheets & Tailwind setup
│   └── main.tsx             # Entry point
└── vite.config.ts           # Build configuration
```
