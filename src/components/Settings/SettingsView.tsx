import { useState, useEffect } from 'react';
import { Info, Key } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';

export default function SettingsView() {
  const { apiKey, setApiKey, theme, setTheme } = useAnalysis();
  const [autoScan, setAutoScan] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['autoScan', 'showNotifications'], (result) => {
        if (result.autoScan !== undefined) setAutoScan(result.autoScan as boolean);
        if (result.showNotifications !== undefined) setShowNotifications(result.showNotifications as boolean);
      });
    }
  }, []);

  const handleAutoScanChange = (val: boolean) => {
    setAutoScan(val);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ autoScan: val });
    }
  };

  const handleShowNotificationsChange = (val: boolean) => {
    setShowNotifications(val);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ showNotifications: val });
    }
  };

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up bg-bg text-text">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Configure Refine SEO Extension</p>
      </div>

      {/* General */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">General</h3>

        <ToggleSetting
          label="Auto-scan on page load"
          description="Automatically analyze pages when you navigate"
          enabled={autoScan}
          onChange={handleAutoScanChange}
        />

        <ToggleSetting
          label="Show notifications"
          description="Alert when critical issues are found"
          enabled={showNotifications}
          onChange={handleShowNotificationsChange}
        />

        <ToggleSetting
          label="Dark mode"
          description="Toggle between light and dark theme"
          enabled={theme === 'dark'}
          onChange={(val) => setTheme(val ? 'dark' : 'light')}
        />
      </div>

      {/* API Configuration */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
          <Key size={14} className="text-primary-dark dark:text-primary-light" />
          AI API Configuration
        </h3>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="api-key-input" className="text-2xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">Gemini API Key</label>
          <input
            id="api-key-input"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key..."
            className="text-xs px-3 py-1.5 border border-border dark:border-zinc-700 rounded-md focus:outline-none focus:border-primary bg-card text-text dark:placeholder-zinc-500"
          />
          <p className="text-3xs text-gray-400 dark:text-zinc-500">
            Saved locally in browser storage. Enter a valid key to activate live AI answers in the AI Insights panel.
          </p>
        </div>
      </div>

      {/* About */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">About</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-zinc-400">Version</span>
            <span className="text-gray-800 dark:text-zinc-200 font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-zinc-400">Build</span>
            <span className="text-gray-800 dark:text-zinc-200 font-medium font-mono text-xs">
              {new Date().toISOString().split('T')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30">
        <div className="flex gap-3">
          <Info size={16} className="text-primary-dark dark:text-primary-light flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Refine SEO Extension</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              Website Intelligence for WordPress, WooCommerce & Modern Websites.
              Built with React, TypeScript, and Vite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm text-gray-700 dark:text-zinc-300">{label}</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative w-9 h-5 rounded-full transition-colors p-0 focus:outline-none focus:ring-0 border-0 flex-shrink-0 ${
          enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-zinc-800'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
